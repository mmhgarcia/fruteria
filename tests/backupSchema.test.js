import { describe, it, expect } from 'vitest'

import {
  BUSINESS_STORES,
  PERSISTENT_LOCAL_STORAGE_KEYS,
  TRANSIENT_LOCAL_STORAGE_KEYS,
  BACKUP_SOURCES,
} from '../src/backup/backupSchema'

describe('backupSchema', () => {
  it('declara todas las stores de negocio (incluye la de stock y registros)', () => {
    expect(BUSINESS_STORES).toEqual(
      ['products', 'categories', 'historico_tasas', 'sales', 'ramos', 'logs', 'stock_movements']
    )
  })

  it('declara las claves persistibles de localStorage', () => {
    expect(PERSISTENT_LOCAL_STORAGE_KEYS).toEqual(['fruteria-settings', 'fruteria-tasa', 'fruteria-alert-read-at'])
  })

  it('excluye el carrito como estado transitorio (no se respalda)', () => {
    expect(TRANSIENT_LOCAL_STORAGE_KEYS).toContain('fruteria-cart')
    expect(BACKUP_SOURCES.excluded).toContain('fruteria-cart')
  })

  it('no mezcla claves persistibles con transitorias', () => {
    for (const key of PERSISTENT_LOCAL_STORAGE_KEYS) {
      expect(TRANSIENT_LOCAL_STORAGE_KEYS).not.toContain(key)
    }
  })

  it('expone un catálogo coherente (fuentes + exclusiones)', () => {
    expect(BACKUP_SOURCES.indexedDB).toEqual(BUSINESS_STORES)
    expect(BACKUP_SOURCES.localStorage).toEqual(PERSISTENT_LOCAL_STORAGE_KEYS)
    expect(BACKUP_SOURCES.excluded).toEqual(TRANSIENT_LOCAL_STORAGE_KEYS)
  })
})
