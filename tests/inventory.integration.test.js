import { describe, it, expect, vi } from 'vitest'

// Polyfill de IndexedDB en memoria ANTES de importar nuestros módulos.
import 'fake-indexeddb/auto'

// addLog está importado en inventory.js; se lo mockea vía vi.mock (ESM read-only).
vi.mock('../src/utils/logService', () => ({
  LOG_TYPES: {
    INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR', FATAL: 'FATAL', ALERT: 'ALERT',
  },
  addLog: vi.fn().mockResolvedValue({}),
}))

import { descontarStockVenta, registrarMovimiento, MOVEMENT_TYPES } from '../src/utils/inventory'
import { DB_VERSION } from '../src/utils/db'

const store = (db, name) => db.transaction(name, 'readwrite').objectStore(name)

function createAllStores(db) {
  if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id', autoIncrement: true })
  if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' })
  if (!db.objectStoreNames.contains('historico_tasas')) db.createObjectStore('historico_tasas', { keyPath: 'id', autoIncrement: true })
  if (!db.objectStoreNames.contains('sales')) db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true })
  if (!db.objectStoreNames.contains('ramos')) db.createObjectStore('ramos', { keyPath: 'id' })
  if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true })
  if (!db.objectStoreNames.contains('stock_movements')) db.createObjectStore('stock_movements', { keyPath: 'id', autoIncrement: true })
  if (!db.objectStoreNames.contains('backup_registry')) db.createObjectStore('backup_registry', { keyPath: 'id' })
}

function openTestDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('fruteria-db', DB_VERSION)
    req.onupgradeneeded = () => createAllStores(req.result)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function putProduct(db, product) {
  return new Promise((resolve, reject) => {
    const req = store(db, 'products').put(product)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function getProducts(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('products', 'readonly').objectStore('products').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function getMovimientos(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('stock_movements', 'readonly').objectStore('stock_movements').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

describe('descontarStockVenta (integración con IndexedDB)', () => {
  let db

  it('descuenta stock de una venta normal y registra el movimiento', async () => {
    db = await openTestDB()

    await putProduct(db, { id: 1, name: 'Manzana', stock: 10, stockMin: 2 })

    const res = await descontarStockVenta([{ id: 1, name: 'Manzana', qty: 4 }])

    const products = await getProducts(db)
    expect(products.find((p) => p.id === 1).stock).toBe(6)

    expect(res.descontados).toHaveLength(1)
    expect(res.faltantes).toHaveLength(0)

    const movimientos = await getMovimientos(db)
    expect(movimientos).toHaveLength(1)
    expect(movimientos[0].tipo).toBe('venta')
    expect(movimientos[0].cantidad).toBe(4)
  })

  it('no baja el stock de 0 y reporta el faltante', async () => {
    db = await openTestDB()

    await putProduct(db, { id: 1, name: 'Manzana', stock: 3, stockMin: 2 })

    const res = await descontarStockVenta([{ id: 1, name: 'Manzana', qty: 10 }])

    const products = await getProducts(db)
    expect(products.find((p) => p.id === 1).stock).toBe(0)

    expect(res.faltantes).toHaveLength(1)
    expect(res.faltantes[0].faltante).toBe(7)
  })

  it('devuelve vacío sin items', async () => {
    const res = await descontarStockVenta([])
    expect(res).toEqual({ descontados: [], faltantes: [], alertas: [] })
  })
})

describe('registrarMovimiento (ajuste a la baja)', () => {
  let db

  beforeEach(async () => {
    db = await openTestDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'stock_movements'], 'readwrite')
      tx.objectStore('products').clear()
      tx.objectStore('stock_movements').clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  })

  it('permite un ajuste negativo (corregir a la baja) y refleja el signo', async () => {
    db = await openTestDB()
    await putProduct(db, { id: 1, name: 'Manzana', stock: 10 })

    const res = await registrarMovimiento({ productId: 1, tipo: MOVEMENT_TYPES.AJUSTE, cantidad: -3, motivo: 'Conteo físico' })

    const products = await getProducts(db)
    expect(products.find((p) => p.id === 1).stock).toBe(7)

    const movimientos = await getMovimientos(db)
    expect(movimientos).toHaveLength(1)
    expect(movimientos[0].tipo).toBe('ajuste')
    expect(movimientos[0].cantidad).toBe(-3)
    expect(res.movement.cantidad).toBe(-3)
    expect(res.product.stock).toBe(7)
  })

  it('permite un ajuste positivo (sumar) con signo +', async () => {
    db = await openTestDB()
    await putProduct(db, { id: 1, name: 'Manzana', stock: 5 })

    const res = await registrarMovimiento({ productId: 1, tipo: MOVEMENT_TYPES.AJUSTE, cantidad: 4, motivo: 'Conteo físico' })

    const products = await getProducts(db)
    expect(products.find((p) => p.id === 1).stock).toBe(9)
    expect(res.movement.cantidad).toBe(4)
  })

  it('rechaza un ajuste con cantidad 0', async () => {
    db = await openTestDB()
    await putProduct(db, { id: 1, name: 'Manzana', stock: 10 })
    await expect(registrarMovimiento({ productId: 1, tipo: MOVEMENT_TYPES.AJUSTE, cantidad: 0 }))
      .rejects.toThrow(/cantidad/)
  })

  it('rechaza cantidad negativa para merma y entrada (solo ajuste lo permite)', async () => {
    db = await openTestDB()
    await putProduct(db, { id: 1, name: 'Manzana', stock: 10 })
    await expect(registrarMovimiento({ productId: 1, tipo: MOVEMENT_TYPES.MERMA, cantidad: -2 }))
      .rejects.toThrow(/cantidad/)
    await expect(registrarMovimiento({ productId: 1, tipo: MOVEMENT_TYPES.ENTRADA, cantidad: -2 }))
      .rejects.toThrow(/cantidad/)
  })
})
