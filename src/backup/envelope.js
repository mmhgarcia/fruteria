// Formato "envelope" del archivo de backup:
// auto-descriptivo y migrable a futuro. El checksum cubre SOLO el payload `data`.
// versionado: un backup viejo (versión <= actual) se restaura; uno más nuevo se rechaza.

import { BACKUP_SOURCES } from './backupSchema.js'

export const APP_NAME = 'fruteria-pos'
export const SCHEMA_VERSION = 1
export const GENERATOR = 'fruteria-pos'

const encoder = new TextEncoder()
const hex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// SHA-256 del payload serializado. Devuelve "sha256:<hex>".
export async function computeChecksum(data) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(data)))
  return `sha256:${hex(digest)}`
}

// Construye el envelope a partir del payload `data`.
export async function buildEnvelope(data, options = {}) {
  const { createdAt = new Date().toISOString(), generator = GENERATOR } = options
  const checksum = await computeChecksum(data)
  return {
    app: APP_NAME,
    schemaVersion: SCHEMA_VERSION,
    createdAt,
    generator,
    checksum,
    data,
  }
}

// Valida la estructura y el checksum. Devuelve { valid, errors, data }.
// Nunca lanza: el llamador decide mensajes de error; esto es para rechazo seguro.
export async function validateBackup(backup) {
  const errors = []

  if (!isPlainObject(backup)) {
    return { valid: false, errors: ['El respaldo no es un objeto válido'], data: null }
  }
  if (backup.app !== APP_NAME) {
    errors.push('El respaldo no pertenece a esta aplicación')
  }
  if (typeof backup.schemaVersion !== 'number') {
    errors.push('El respaldo no declara una versión de esquema')
  } else if (backup.schemaVersion > SCHEMA_VERSION) {
    errors.push(`Versión de esquema ${backup.schemaVersion} no soportada (actual: ${SCHEMA_VERSION})`)
  }
  if (!isPlainObject(backup.data)) {
    errors.push('El respaldo no contiene datos válidos')
  }
  if (!backup.checksum || typeof backup.checksum !== 'string') {
    errors.push('El respaldo no tiene checksum')
  } else if (isPlainObject(backup.data)) {
    const expected = await computeChecksum(backup.data)
    if (expected !== backup.checksum) {
      errors.push('El checksum no coincide: el archivo está dañado o fue modificado')
    }
  }

  return { valid: errors.length === 0, errors, data: backup.data }
}

// Valida que el payload agrupe las fuentes declaradas en el catálogo.
// Para `localStorage` solo exige las claves si el backup las declara (completo).
// Un `localStorage` vacío (backup solo_datos) se acepta sin exigir claves.
export function validateBackupSources(data) {
  const errors = []
  if (!data) return { valid: false, errors: ['Sin datos'] }

  for (const store of BACKUP_SOURCES.indexedDB) {
    if (!Array.isArray(data.indexedDB?.[store])) {
      errors.push(`Falta la store "${store}" en el respaldo`)
    }
  }
  const local = data.localStorage || {}
  if (Object.keys(local).length > 0) {
    for (const key of BACKUP_SOURCES.localStorage) {
      if (!(key in local)) {
        errors.push(`Falta la clave local "${key}" en el respaldo`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
