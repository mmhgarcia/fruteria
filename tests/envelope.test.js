import { describe, it, expect } from 'vitest'

import {
  APP_NAME,
  SCHEMA_VERSION,
  computeChecksum,
  buildEnvelope,
  validateBackup,
  validateBackupSources,
} from '../src/backup/envelope'

const sampleData = {
  indexedDB: {
    products: [{ id: 1, name: 'Manzana' }],
    categories: [],
    historico_tasas: [],
    sales: [],
    ramos: [],
    logs: [],
    stock_movements: [],
  },
  localStorage: {
    'fruteria-settings': { pinHash: 'abc', igft: 3 },
    'fruteria-tasa': 36.5,
    'fruteria-alert-read-at': '2026-09-03T10:00:00.000Z',
  },
}

describe('envelope (checksum + validación)', () => {
  it('genera un checksum SHA-256 estable y determinista', async () => {
    const a = await computeChecksum(sampleData)
    const b = await computeChecksum(sampleData)
    expect(a).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(a).toBe(b)
  })

  it('el checksum cambia si cambia el payload', async () => {
    const a = await computeChecksum({ indexedDB: {}, localStorage: {} })
    const b = await computeChecksum({ indexedDB: { products: [1] }, localStorage: {} })
    expect(a).not.toBe(b)
  })

  it('construye un envelope completo con checksum sobre data', async () => {
    const env = await buildEnvelope(sampleData, { createdAt: '2026-09-03T00:00:00.000Z' })
    expect(env.app).toBe(APP_NAME)
    expect(env.schemaVersion).toBe(SCHEMA_VERSION)
    expect(env.createdAt).toBe('2026-09-03T00:00:00.000Z')
    expect(env.data).toEqual(sampleData)
    expect(env.checksum).toBe(await computeChecksum(sampleData))
  })

  it('acepta un backup válido', async () => {
    const env = await buildEnvelope(sampleData)
    const res = await validateBackup(env)
    expect(res.valid).toBe(true)
    expect(res.errors).toEqual([])
  })

  it('rechaza un backup con checksum alterado (corrupto)', async () => {
    const env = await buildEnvelope(sampleData)
    env.data.indexedDB.products = [{ id: 1, name: 'HACKED' }]
    const res = await validateBackup(env)
    expect(res.valid).toBe(false)
    expect(res.errors.join(' ')).toMatch(/checksum/)
  })

  it('rechaza un backup con versión de esquema no soportada (más reciente)', async () => {
    const env = await buildEnvelope(sampleData)
    env.schemaVersion = SCHEMA_VERSION + 1
    const res = await validateBackup(env)
    expect(res.valid).toBe(false)
    expect(res.errors.join(' ')).toMatch(/no soportada/)
  })

  it('rechaza un backup sin estructura o sin datos', async () => {
    expect((await validateBackup(null)).valid).toBe(false)
    expect((await validateBackup({ app: APP_NAME })).valid).toBe(false)
    expect((await validateBackup({ app: APP_NAME, schemaVersion: 1, data: null })).valid).toBe(false)
  })

  it('valida que el payload contenga las fuentes declaradas en el catálogo', () => {
    const ok = validateBackupSources(sampleData)
    expect(ok.valid).toBe(true)

    const missing = validateBackupSources({ indexedDB: {}, localStorage: {} })
    expect(missing.valid).toBe(false)
    expect(missing.errors.join(' ')).toMatch(/products/)
  })
})
