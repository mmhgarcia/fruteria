import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Polyfill de IndexedDB en memoria ANTES de importar nuestros módulos.
import 'fake-indexeddb/auto'

// backupService y db.js usan addLog; lo mockeamos para no depender del store de logs.
vi.mock('../src/utils/logService', () => ({
  LOG_TYPES: { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR', FATAL: 'FATAL', ALERT: 'ALERT' },
  addLog: vi.fn().mockResolvedValue({}),
}))

import { openDB, DB_VERSION, getBackupRecords, addBackupRecord } from '../src/utils/db'
import {
  createBackup,
  validateBackup,
  previewBackup,
  importBackup,
  exportBackup,
  restoreFromRecord,
  buildBackupFilename,
  buildBackupId,
  todayDateKey,
  previousDayDateKey,
  createAutomaticSnapshot,
  hasAutoBackupFor,
  cleanupAutoSnapshots,
  runAutoBackupIfDue,
  AUTO_BACKUP_RETENTION,
  SCOPE_COMPLETO,
  SCOPE_SOLO_DATOS,
  MODE_MANUAL,
  MODE_AUTOMATICO,
} from '../src/utils/backupService'
import { hashPin } from '../src/utils/hash'

const ALL_STORES = ['products', 'categories', 'historico_tasas', 'sales', 'ramos', 'logs', 'stock_movements', 'backup_registry']

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

const store = (db, name) => db.transaction(name, 'readwrite').objectStore(name)

function put(db, name, record) {
  return new Promise((resolve, reject) => {
    const req = store(db, name).put(record)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function getAll(db, name) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(name, 'readonly').objectStore(name).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function clearAllStores(db) {
  await Promise.all(
    ALL_STORES.map((name) => new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(name)) return resolve()
      const tx = db.transaction(name, 'readwrite')
      tx.objectStore(name).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }))
  )
}

async function clearBusinessStores(db) {
  const business = ALL_STORES.filter((n) => n !== 'backup_registry')
  await Promise.all(
    business.map((name) => new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(name)) return resolve()
      const tx = db.transaction(name, 'readwrite')
      tx.objectStore(name).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }))
  )
}

function createLocalStorageMock() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size },
  }
}

const TEST_DATE = new Date(2026, 8, 4, 8, 15, 0)

describe('backupService (ciclo create → validate → preview → import)', () => {
  let db

  beforeEach(async () => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
    db = await openTestDB()
    await clearAllStores(db)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function seedSource() {
    await put(db, 'products', { id: 1, name: 'Manzana', stock: 10, stockMin: 2, costoPromedio: 2 })
    await put(db, 'products', { id: 2, name: 'Pera', stock: 5, stockMin: 1, costoPromedio: 3 })
    await put(db, 'sales', { id: 1, total: 20, date: '2026-09-04T10:00:00.000Z' })
    await put(db, 'sales', { id: 2, total: 12, date: '2026-09-04T11:00:00.000Z' })
    await put(db, 'categories', { id: 1, name: 'Frutas' })
    localStorage.setItem('fruteria-settings', JSON.stringify({ companyName: 'Mi Negocio', pin: 'viejohash', igft: 3 }))
    localStorage.setItem('fruteria-tasa', JSON.stringify(36.5))
    localStorage.setItem('fruteria-alert-read-at', '2026-09-03T10:00:00.000Z')
  }

  it('createBackup(completo) genera envelope válido con metadata y configuración', async () => {
    await seedSource()
    const res = await createBackup({ scope: SCOPE_COMPLETO, mode: MODE_MANUAL, date: TEST_DATE })

    expect(res.filename).toBe('fruteria-pos_2026-09-04_0815_completo_manual.json')
    expect(res.record.id).toBe(buildBackupId(TEST_DATE))
    expect(res.record.scope).toBe(SCOPE_COMPLETO)
    expect(res.record.mode).toBe(MODE_MANUAL)
    expect(res.record.storeCounts.products).toBe(2)
    expect(res.record.storeCounts.sales).toBe(2)
    expect(res.data.localStorage['fruteria-settings'].companyName).toBe('Mi Negocio')
    expect(res.data.localStorage['fruteria-tasa']).toBe(36.5)
    expect(res.data.localStorage['fruteria-alert-read-at']).toBe('2026-09-03T10:00:00.000Z')

    const check = await validateBackup(res.backup)
    expect(check.valid).toBe(true)
    expect(check.errors).toEqual([])
  })

  it('createBackup(solo_datos) no incluye configuración local', async () => {
    await seedSource()
    const res = await createBackup({ scope: SCOPE_SOLO_DATOS, mode: MODE_MANUAL, date: TEST_DATE })

    expect(res.filename).toBe('fruteria-pos_2026-09-04_0815_solo_datos_manual.json')
    expect(res.data.indexedDB.products).toHaveLength(2)
    expect(res.data.localStorage).toEqual({})
  })

  it('validateBackup rechaza un archivo corrupto (checksum alterado) sin lanzar', async () => {
    await seedSource()
    const res = await createBackup({ scope: SCOPE_COMPLETO, date: TEST_DATE })
    res.backup.data.indexedDB.products = [{ id: 1, name: 'HACKED' }]

    const check = await validateBackup(res.backup)
    expect(check.valid).toBe(false)
    expect(check.errors.join(' ')).toMatch(/checksum/)
  })

  it('validateBackup rechaza un respaldo de otra app o sin datos', async () => {
    expect((await validateBackup({ app: 'otra-app', schemaVersion: 1, data: { indexedDB: {}, localStorage: {} } })).valid).toBe(false)
    expect((await validateBackup(null)).valid).toBe(false)
  })

  it('previewBackup reporta impactos (añadir/actualizar/reemplazar) sin tocar datos', async () => {
    await seedSource()
    const res = await createBackup({ scope: SCOPE_COMPLETO, date: TEST_DATE })

    // Añadimos un producto extra en el "destino" para que el preview detecte remociones.
    await put(db, 'products', { id: 99, name: 'Extra', stock: 1 })
    const before = await getAll(db, 'products')

    const preview = await previewBackup(res.backup)
    expect(preview.valid).toBe(true)
    expect(preview.summary.mode).toBe('replace')

    const productsImpact = preview.impacts.find((i) => i.store === 'products')
    expect(productsImpact.currentCount).toBe(3)
    expect(productsImpact.incomingCount).toBe(2)
    expect(productsImpact.removed).toBe(1) // el id 99 será eliminado por el replace
    expect(productsImpact.added).toBe(0)
    expect(productsImpact.updated).toBe(2)

    expect(preview.localStorage.count).toBe(3)

    // El preview NO debe modificar los datos.
    const after = await getAll(db, 'products')
    expect(after).toEqual(before)
  })

  it('importBackup aplica replace atómicamente, es idempotente y resetea el PIN', async () => {
    await seedSource()
    const res = await createBackup({ scope: SCOPE_COMPLETO, date: TEST_DATE })

    // Destino con datos "sucios" que deben ser reemplazados por el backup.
    await clearAllStores(db)
    await put(db, 'products', { id: 77, name: 'Dato viejo', stock: 9 })
    await put(db, 'sales', { id: 5, total: 999 })

    const result = await importBackup(res.backup)

    expect(result.success).toBe(true)
    expect(result.restoredConfig).toBe(true)

    const products = await getAll(db, 'products')
    expect(products).toHaveLength(2)
    expect(products.map((p) => p.id).sort()).toEqual([1, 2])

    const sales = await getAll(db, 'sales')
    expect(sales).toHaveLength(2)
    expect(sales.map((s) => s.id).sort()).toEqual([1, 2])

    // La configuración se restaura y el PIN vuelve a 000000 (default).
    const settings = JSON.parse(localStorage.getItem('fruteria-settings'))
    expect(settings.companyName).toBe('Mi Negocio')
    expect(settings.pin).toBe(await hashPin('000000'))

    // Se registró el snapshot previo (para poder revertir).
    const records = await getBackupRecords()
    const pre = records.find((r) => r.mode === MODE_AUTOMATICO)
    expect(pre).toBeTruthy()
    expect(pre.scope).toBe(SCOPE_COMPLETO)

    // Idempotencia: restaurar de nuevo no duplica registros ni rompe totales.
    await importBackup(res.backup)
    expect(await getAll(db, 'products')).toHaveLength(2)
    expect(await getAll(db, 'sales')).toHaveLength(2)
  })

  it('importBackup de un backup solo_datos no toca la configuración local', async () => {
    await seedSource()
    const res = await createBackup({ scope: SCOPE_SOLO_DATOS, date: TEST_DATE })

    localStorage.setItem('fruteria-settings', JSON.stringify({ companyName: 'Otro negocio', pin: 'hashactual' }))
    await clearAllStores(db)

    const result = await importBackup(res.backup)
    expect(result.restoredConfig).toBe(false)

    const settings = JSON.parse(localStorage.getItem('fruteria-settings'))
    expect(settings.companyName).toBe('Otro negocio')
    expect(settings.pin).toBe('hashactual')
  })

  it('exportBackup registra el respaldo con payload y restoreFromRecord lo restaura', async () => {
    await seedSource()
    const exported = await exportBackup()

    const records = await getBackupRecords()
    const record = records.find((r) => r.filename === exported.filename)
    expect(record).toBeTruthy()
    expect(record.payload).toBeTruthy()
    expect(record.payload.indexedDB.products).toHaveLength(2)

    // Destino "sucio": limpiamos los datos de negocio y agregamos un dato viejo.
    await clearBusinessStores(db)
    await put(db, 'products', { id: 50, name: 'Basura', stock: 1 })

    const result = await restoreFromRecord(record.id)
    expect(result.success).toBe(true)

    const products = await getAll(db, 'products')
    expect(products).toHaveLength(2)
    expect(products.map((p) => p.id).sort()).toEqual([1, 2])

    // Se creó un nuevo snapshot previo para poder volver a revertir.
    const snapshots = (await getBackupRecords()).filter((r) => r.mode === MODE_AUTOMATICO)
    expect(snapshots.length).toBeGreaterThan(0)

    const settings = JSON.parse(localStorage.getItem('fruteria-settings'))
    expect(settings.pin).toBe(await hashPin('000000'))
  })

  it('restoreFromRecord rechaza un registro sin payload (archivo no guardado)', async () => {
    await addBackupRecord({ id: 'bk_sin_payload', filename: 'x.json', createdAt: '2026-09-04T08:00:00.000Z' })
    await expect(restoreFromRecord('bk_sin_payload')).rejects.toThrow(/seleccione el archivo/)
  })

  it('importBackup rechaza un archivo corrupto y deja los datos intactos', async () => {
    await seedSource()
    const res = await createBackup({ scope: SCOPE_COMPLETO, date: TEST_DATE })
    res.backup.checksum = 'sha256:deadbeef'

    const beforeProducts = await getAll(db, 'products')
    await expect(importBackup(res.backup)).rejects.toThrow(/checksum/)

    expect(await getAll(db, 'products')).toEqual(beforeProducts)
  })

  it('buildBackupFilename sigue la convención y buildBackupId es estable', () => {
    expect(buildBackupFilename({ scope: SCOPE_COMPLETO, mode: MODE_MANUAL, date: TEST_DATE }))
      .toBe('fruteria-pos_2026-09-04_0815_completo_manual.json')
    expect(buildBackupFilename({ scope: SCOPE_SOLO_DATOS, mode: MODE_AUTOMATICO, date: TEST_DATE }))
      .toBe('fruteria-pos_2026-09-04_0815_solo_datos_automatico.json')
    expect(buildBackupId(TEST_DATE)).toBe('bk_20260904_081500')
  })
})

describe('backup automático (SPEC-001)', () => {
  let db

  beforeEach(async () => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
    db = await openTestDB()
    await clearAllStores(db)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function seedSource() {
    await put(db, 'products', { id: 1, name: 'Manzana', stock: 10 })
    localStorage.setItem('fruteria-settings', JSON.stringify({ companyName: 'Mi Negocio', pin: 'viejohash' }))
  }

  it('todayDateKey y previousDayDateKey devuelven la fecha local y el día previo', () => {
    const d = new Date(2026, 8, 5, 10, 0, 0)
    expect(todayDateKey(d)).toBe('2026-09-05')
    expect(previousDayDateKey(d)).toBe('2026-09-04')
  })

  it('runAutoBackupIfDue crea un respaldo cuando falta el del día previo', async () => {
    await seedSource()
    const now = new Date(2026, 8, 5, 10, 0, 0)

    const res = await runAutoBackupIfDue({ date: now })
    expect(res.didRun).toBe(true)
    expect(res.periodDate).toBe('2026-09-04')

    const records = await getBackupRecords()
    const auto = records.find((r) => r.mode === MODE_AUTOMATICO && r.periodDate === '2026-09-04')
    expect(auto).toBeTruthy()
    expect(auto.scope).toBe(SCOPE_COMPLETO)
    expect(auto.payload).toBeTruthy()

    // Al abrir de nuevo el mismo día, ya hay log del día previo → no repite.
    const again = await runAutoBackupIfDue({ date: now })
    expect(again.didRun).toBe(false)
  })

  it('hasAutoBackupFor detecta si ya existe el respaldo del día previo', async () => {
    expect(await hasAutoBackupFor('2026-09-04')).toBe(false)
    await createAutomaticSnapshot({ periodDate: '2026-09-04' })
    expect(await hasAutoBackupFor('2026-09-04')).toBe(true)
    expect(await hasAutoBackupFor('2026-09-03')).toBe(false)
  })

  it('cleanupAutoSnapshots conserva solo los 4 últimos y no borra manuales/shared', async () => {
    for (let i = 1; i <= 6; i++) {
      await addBackupRecord({
        id: `bk_auto_${i}`,
        mode: MODE_AUTOMATICO,
        periodDate: `2026-08-${String(i).padStart(2, '0')}`,
        createdAt: `2026-08-${String(i).padStart(2, '0')}T08:00:00.000Z`,
      })
    }
    await addBackupRecord({ id: 'bk_manual', mode: MODE_MANUAL, createdAt: '2026-09-01T00:00:00.000Z' })
    await addBackupRecord({ id: 'bk_shared', mode: MODE_MANUAL, storage: 'shared', createdAt: '2026-09-02T00:00:00.000Z' })

    const removed = await cleanupAutoSnapshots(AUTO_BACKUP_RETENTION)
    expect(removed).toBe(2)

    const records = await getBackupRecords()
    const autos = records.filter((r) => r.mode === MODE_AUTOMATICO)
    expect(autos).toHaveLength(AUTO_BACKUP_RETENTION)
    // Conserva los 4 más recientes (2026-08-03 a 08-06).
    expect(autos.map((r) => r.periodDate).sort()).toEqual(['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06'])
    expect(records.find((r) => r.id === 'bk_manual')).toBeTruthy()
    expect(records.find((r) => r.id === 'bk_shared')).toBeTruthy()
  })
})
