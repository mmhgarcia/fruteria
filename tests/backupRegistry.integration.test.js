import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'

import { addBackupRecord, getBackupRecords, deleteBackupRecord } from '../src/utils/db'

describe('backup_registry (integración con IndexedDB)', () => {
  beforeEach(async () => {
    const all = await getBackupRecords()
    for (const r of all) {
      await deleteBackupRecord(r.id)
    }
  })

  it('agrega un registro con id explícito y lo recupera', async () => {
    const record = { id: 'bk_20260903_081500', filename: 'fruteria-pos_2026-09-03_0815_completo_manual.json' }
    await addBackupRecord(record)

    const all = await getBackupRecords()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('bk_20260903_081500')
    expect(all[0].filename).toBe(record.filename)
  })

  it('respeta ids propios (keyPath sin autoincremento) y no los renumera', async () => {
    const ids = ['bk_a', 'bk_b', 'bk_c']
    for (const id of ids) {
      await addBackupRecord({ id })
    }
    const all = await getBackupRecords()
    expect(all.map((r) => r.id).sort()).toEqual(ids)
  })

  it('listo varios registros, cada uno con su metadata', async () => {
    await addBackupRecord({ id: 'bk_1', scope: 'completo', storage: 'local', createdAt: '2026-09-04T08:00:00.000Z' })
    await addBackupRecord({ id: 'bk_2', scope: 'solo_datos', storage: 'shared', createdAt: '2026-09-05T08:00:00.000Z' })

    const all = await getBackupRecords()
    expect(all).toHaveLength(2)
    expect(all.find((r) => r.id === 'bk_2')).toMatchObject({ storage: 'shared', scope: 'solo_datos' })
  })

  it('elimina un registro y los demás permanecen', async () => {
    await addBackupRecord({ id: 'bk_x', filename: 'a.json' })
    await addBackupRecord({ id: 'bk_y', filename: 'b.json' })

    await deleteBackupRecord('bk_x')

    const all = await getBackupRecords()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('bk_y')
  })

  it('no rompe si se intenta eliminar un registro inexistente', async () => {
    await expect(deleteBackupRecord('bk_nonexistent')).resolves.toBeUndefined()
  })
})
