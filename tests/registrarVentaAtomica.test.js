import { describe, it, expect, beforeEach, vi } from 'vitest'

// Polyfill de IndexedDB en memoria ANTES de importar nuestros módulos.
import 'fake-indexeddb/auto'

// Mock del logService (inventory.js importa addLog a través de la cadena).
vi.mock('../src/utils/logService', () => ({
  LOG_TYPES: {
    INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR', FATAL: 'FATAL', ALERT: 'ALERT',
  },
  addLog: vi.fn().mockResolvedValue({}),
}))

// vi.hoisted() corre antes de los vi.mock hoisted, así que el spy ya existe
// cuando db.js es mockeado.
const mocks = vi.hoisted(() => ({
  openDB: vi.fn(),
}))

vi.mock('../src/utils/db', async () => {
  const actual = await vi.importActual('../src/utils/db')
  return { ...actual, openDB: mocks.openDB }
})

// Imports DESPUÉS del mock.
const dbReal = await vi.importActual('../src/utils/db')
const { registrarVentaAtomica } = await import('../src/utils/inventory')
const { DB_VERSION } = dbReal

const STORES = ['products', 'categories', 'historico_tasas', 'sales', 'ramos', 'logs', 'stock_movements']

function createAllStores(db) {
  for (const name of STORES) {
    if (!db.objectStoreNames.contains(name)) {
      db.createObjectStore(name, { keyPath: 'id', autoIncrement: true })
    }
  }
  if (!db.objectStoreNames.contains('backup_registry')) {
    db.createObjectStore('backup_registry', { keyPath: 'id' })
  }
}

function openTestDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('fruteria-db', DB_VERSION)
    req.onupgradeneeded = () => createAllStores(req.result)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function readAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function putProduct(db, product) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('products', 'readwrite').objectStore('products').put(product)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const SALE_TEMPLATE = {
  date: '2026-08-29T10:00:00.000Z',
  tasa: 36.5,
  totalUSD: 4,
  totalBS: 146,
  pagomovilRef: '', pagomovilBanco: '', pagomovilMonto: 0,
  efectivoBS: 200, puntoCard: '', puntoBanco: '', puntoMonto: 0,
  divisaUSD: 0, totalPagado: 200, vuelto: 54,
  items: [],
}

// Helper: por defecto, openDB devuelve la DB real. Tests específicos la sobrescriben.
beforeEach(() => {
  mocks.openDB.mockImplementation(() => dbReal.openDB())
})

describe('registrarVentaAtomica (atomicidad venta + stock)', () => {
  let db

  beforeEach(async () => {
    db = await openTestDB()
    // Limpiamos productos, ventas y movimientos entre tests para aislamiento
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['products', 'sales', 'stock_movements'], 'readwrite')
      tx.objectStore('products').clear()
      tx.objectStore('sales').clear()
      tx.objectStore('stock_movements').clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    await putProduct(db, { id: 1, name: 'Manzana', stock: 10, stockMin: 2, puntoPedido: 4 })
    await putProduct(db, { id: 2, name: 'Pera', stock: 5, stockMin: 1, puntoPedido: 2 })
  })

  it('caso feliz: persiste venta + descuenta stock + registra movimiento', async () => {
    const { saleId, descontados, faltantes, alertas } = await registrarVentaAtomica({
      sale: { ...SALE_TEMPLATE, items: [{ id: 1, name: 'Manzana', qty: 3, price: 1 }] },
      items: [{ id: 1, name: 'Manzana', qty: 3 }],
    })

    expect(typeof saleId).toBe('number')

    const sales = await readAll(db, 'sales')
    expect(sales).toHaveLength(1)
    expect(sales[0].id).toBe(saleId)

    const products = await readAll(db, 'products')
    const manzana = products.find((p) => p.id === 1)
    expect(manzana.stock).toBe(7) // 10 - 3

    const movs = await readAll(db, 'stock_movements')
    expect(movs).toHaveLength(1)
    expect(movs[0].tipo).toBe('venta')
    expect(movs[0].cantidad).toBe(3)
    expect(movs[0].stockAnterior).toBe(10)
    expect(movs[0].stockNuevo).toBe(7)

    expect(descontados).toHaveLength(1)
    expect(faltantes).toHaveLength(0)
    expect(alertas).toHaveLength(0)
  })

  it('atomicidad: si la tx aborta, la venta NO queda persistida', async () => {
    // Override: la transacción se aborta antes de commit.
    // Equivale a "disco lleno" o cualquier error fatal que IndexedDB propaga.
    mocks.openDB.mockImplementation(async () => {
      const realDb = await dbReal.openDB()
      const origTx = realDb.transaction.bind(realDb)
      realDb.transaction = function (names, mode) {
        const tx = origTx(names, mode)
        // Abortar en el microtask queue: después de que la tx arranque pero
        // antes de que commit. queueMicrotask es más predecible que setTimeout.
        queueMicrotask(() => {
          try { tx.abort() } catch (_) {}
        })
        return tx
      }
      return realDb
    })

    await expect(
      registrarVentaAtomica({
        sale: { ...SALE_TEMPLATE, items: [{ id: 1, name: 'Manzana', qty: 1 }] },
        items: [{ id: 1, name: 'Manzana', qty: 1 }],
      })
    ).rejects.toThrow()

    // Verificar atomicidad: NO hay venta, NO hay movimiento de stock,
    // y el stock del producto NO cambió.
    const sales = await readAll(db, 'sales')
    const movs = await readAll(db, 'stock_movements')
    const products = await readAll(db, 'products')
    expect(sales).toHaveLength(0)
    expect(movs).toHaveLength(0)
    expect(products.find((p) => p.id === 1).stock).toBe(10) // intacto
  })

  it('producto inexistente no aborta la tx: queda como faltante', async () => {
    const { saleId, descontados, faltantes } = await registrarVentaAtomica({
      sale: { ...SALE_TEMPLATE, items: [{ id: 999, name: 'Fantasma', qty: 1 }] },
      items: [{ id: 999, name: 'Fantasma', qty: 1 }],
    })

    expect(typeof saleId).toBe('number')
    expect(descontados).toHaveLength(0)
    expect(faltantes).toHaveLength(1)
    expect(faltantes[0].motivo).toBe('producto_no_existe')

    // La venta SÍ se guardó (el item "fantasma" no bloquea a los demás)
    const sales = await readAll(db, 'sales')
    expect(sales).toHaveLength(1)
  })

  it('items con stock insuficiente: descuenta hasta 0 y reporta faltante', async () => {
    const { descontados, faltantes } = await registrarVentaAtomica({
      sale: { ...SALE_TEMPLATE, items: [{ id: 2, name: 'Pera', qty: 10 }] },
      items: [{ id: 2, name: 'Pera', qty: 10 }],
    })

    expect(descontados).toHaveLength(1)
    expect(descontados[0].stockNuevo).toBe(0)
    expect(faltantes).toHaveLength(1)
    expect(faltantes[0].faltante).toBe(5) // pidió 10, había 5

    const products = await readAll(db, 'products')
    expect(products.find((p) => p.id === 2).stock).toBe(0)
  })

  it('detecta cruce a "agotado" tras una venta y emite alerta', async () => {
    // Pera tiene stock 5. Vendemos 5 → stockNuevo 0 → cruce a agotado
    const { alertas, saleId } = await registrarVentaAtomica({
      sale: { ...SALE_TEMPLATE, items: [{ id: 2, name: 'Pera', qty: 5 }] },
      items: [{ id: 2, name: 'Pera', qty: 5 }],
    })

    expect(alertas).toHaveLength(1)
    expect(alertas[0].estado).toBe('agotado')
    expect(alertas[0].stockAnterior).toBe(5)
    expect(alertas[0].stockNuevo).toBe(0)
    expect(typeof saleId).toBe('number')
  })

  it('carrito vacío: solo persiste la venta (sin movimientos)', async () => {
    const { saleId, descontados, faltantes, alertas } = await registrarVentaAtomica({
      sale: { ...SALE_TEMPLATE, totalUSD: 0, totalBS: 0, items: [] },
      items: [],
    })

    expect(typeof saleId).toBe('number')
    expect(descontados).toHaveLength(0)
    expect(faltantes).toHaveLength(0)
    expect(alertas).toHaveLength(0)

    const sales = await readAll(db, 'sales')
    expect(sales).toHaveLength(1)
    const movs = await readAll(db, 'stock_movements')
    expect(movs).toHaveLength(0)
  })

  it('valida argumentos: rechaza sin sale', async () => {
    await expect(registrarVentaAtomica({ sale: null, items: [] })).rejects.toThrow(/sale requerida/)
  })

  it('valida argumentos: rechaza si items no es array', async () => {
    await expect(
      registrarVentaAtomica({ sale: SALE_TEMPLATE, items: 'no' })
    ).rejects.toThrow(/items debe ser array/)
  })
})