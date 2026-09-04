// Catálogo declarativo de fuentes de datos respaldables.
// Fuente única de verdad para exportar/importar: si algo no está aquí, no se respalda.

// Stores de IndexedDB que pertenecen al negocio (persistentes).
export const BUSINESS_STORES = [
  'products',
  'categories',
  'historico_tasas',
  'sales',
  'ramos',
  'logs',
  'stock_movements',
]

// Claves de localStorage con estado persistente/configuración que SÍ se respaldan.
// NOTA: 'fruteria-settings' contiene la configuración y el PIN (bueno, el hash del PIN).
export const PERSISTENT_LOCAL_STORAGE_KEYS = [
  'fruteria-settings',
  'fruteria-tasa',
  'fruteria-alert-read-at',
]

// Claves de localStorage que representan estado transitorio/loca y NUNCA se respaldan:
// carrito (vivo de una sesión), sesión de admin y bloqueo por fuerza bruta.
export const TRANSIENT_LOCAL_STORAGE_KEYS = [
  'fruteria-cart',
  'fruteria-auth-session',
  'fruteria-pin-blocked-until',
]

export const BACKUP_SOURCES = {
  indexedDB: BUSINESS_STORES,
  localStorage: PERSISTENT_LOCAL_STORAGE_KEYS,
  excluded: TRANSIENT_LOCAL_STORAGE_KEYS,
}
