import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'

import { addLog, getLogs, clearLogs, LOG_TYPES } from '../src/utils/logService'
import { DB_VERSION } from '../src/utils/db'

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

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('fruteria-db', DB_VERSION)
    req.onupgradeneeded = () => createAllStores(req.result)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Simula el estado real: la DB ya existe en v7 (creada por el resto del sistema)
// antes de que logService escriba. Regresivamente este flujo fallaba con
// VersionError porque logService abría la DB con versión fija `6`.
describe('logService (integración con IndexedDB v7)', () => {
  beforeEach(async () => {
    const db = await openDB()
    db.close()
    await clearLogs()
  })

  it('registra, lee y limpia logs sin VersionError', async () => {
    const id = await addLog(LOG_TYPES.ALERT, 'Stock por reponer', { productId: 1 })
    expect(typeof id).toBe('number')

    const logs = await getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].type).toBe(LOG_TYPES.ALERT)
    expect(logs[0].message).toBe('Stock por reponer')
    expect(logs[0].details.productId).toBe(1)

    await clearLogs()
    const empty = await getLogs()
    expect(empty).toHaveLength(0)
  })

  it('filtra y ordena logs, y respeta el límite', async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms))
    await addLog(LOG_TYPES.INFO, 'primero')
    await delay(5)
    await addLog(LOG_TYPES.WARNING, 'segundo')
    await delay(5)
    await addLog(LOG_TYPES.ERROR, 'tercero')

    const warnings = await getLogs({ type: LOG_TYPES.WARNING })
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toBe('segundo')

    const recent = await getLogs({ limit: 2 })
    expect(recent).toHaveLength(2)
    expect(recent[0].message).toBe('tercero')
    expect(recent[1].message).toBe('segundo')
  })
})
