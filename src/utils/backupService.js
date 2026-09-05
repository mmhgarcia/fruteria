// filepath: src/utils/backupService.js
// Servicio central de backup/restore (SPEC-006).
// Catálogo único de fuentes: BACKUP_SOURCES de ../backup/backupSchema.js.
// Formato envelope + checksum SHA-256 en ../backup/envelope.js.
// Restauración `replace` en UNA transacción readwrite multi-store (all-or-nothing).

import { openDB, addBackupRecord, getBackupRecords, deleteBackupRecord } from './db.js'
import { addLog, LOG_TYPES } from './logService.js'
import { hashPin } from './hash.js'
import { BUSINESS_STORES, PERSISTENT_LOCAL_STORAGE_KEYS } from '../backup/backupSchema.js'
import {
  buildEnvelope,
  validateBackup as validateEnvelope,
  validateBackupSources,
} from '../backup/envelope.js'

export const SCOPE_COMPLETO = 'completo'
export const SCOPE_SOLO_DATOS = 'solo_datos'
export const MODE_MANUAL = 'manual'
export const MODE_AUTOMATICO = 'automatico'

const DEFAULT_PIN = '000000'
const SMALL_PAYLOAD_LIMIT = 5 * 1024 * 1024 // 5MB

function pad(n, len = 2) {
  return String(n).padStart(len, '0')
}

function parseJSONOrRaw(raw) {
  if (raw === null || raw === undefined) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function serializeLocalValue(value) {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export function buildBackupId(date = new Date()) {
  const y = date.getFullYear()
  const mo = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const mi = pad(date.getMinutes())
  const s = pad(date.getSeconds())
  return `bk_${y}${mo}${d}_${h}${mi}${s}`
}

export function buildBackupFilename({ scope = SCOPE_COMPLETO, mode = MODE_MANUAL, date = new Date() } = {}) {
  const fecha = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const hora = `${pad(date.getHours())}${pad(date.getMinutes())}`
  return `fruteria-pos_${fecha}_${hora}_${scope}_${mode}.json`
}

export function buildStoreCounts(data) {
  const counts = {}
  for (const store of BUSINESS_STORES) {
    counts[store] = (data.indexedDB?.[store] || []).length
  }
  return counts
}

function readStoreAll(db, storeName) {
  if (!db.objectStoreNames.contains(storeName)) return Promise.resolve([])
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

async function readBusinessData() {
  const db = await openDB()
  const indexedDB = {}
  for (const store of BUSINESS_STORES) {
    indexedDB[store] = await readStoreAll(db, store)
  }
  return indexedDB
}

function readPersistentLocalStorage() {
  const local = {}
  if (typeof localStorage === 'undefined') return local
  for (const key of PERSISTENT_LOCAL_STORAGE_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw !== null) local[key] = parseJSONOrRaw(raw)
  }
  return local
}

/**
 * Crea un backup completo (datos + configuración) sin tocar disco ni registro.
 * Devuelve el envelope, metadata y el payload crudo.
 */
export async function createBackup({ scope = SCOPE_COMPLETO, mode = MODE_MANUAL, date = new Date() } = {}) {
  const indexedDB = await readBusinessData()
  const local = scope === SCOPE_COMPLETO ? readPersistentLocalStorage() : {}
  const data = { indexedDB, localStorage: local }

  const createdAt = date.toISOString()
  const backup = await buildEnvelope(data, { createdAt })
  const filename = buildBackupFilename({ scope, mode, date })
  const sizeBytes = new Blob([JSON.stringify(data)]).size

  const storeCounts = buildStoreCounts(data)
  const record = {
    id: buildBackupId(date),
    createdAt,
    filename,
    scope,
    sizeBytes,
    storeCounts,
    storage: 'local',
    mode,
  }

  return { backup, data, filename, createdAt, sizeBytes, storeCounts, record }
}

/**
 * Lee un archivo/objeto de backup y lo valida (envelope + checksum + fuentes).
 * Devuelve { valid, errors, backup }. Nunca lanza.
 */
export async function validateBackup(file) {
  let backup
  try {
    if (typeof file === 'string') {
      backup = JSON.parse(file)
    } else if (file && typeof file.text === 'function') {
      backup = JSON.parse(await file.text())
    } else if (file && typeof file === 'object') {
      backup = file
    } else {
      return { valid: false, errors: ['No se pudo leer el respaldo'], backup: null }
    }
  } catch {
    return { valid: false, errors: ['El archivo no es un JSON válido'], backup: null }
  }

  const env = await validateEnvelope(backup)
  if (!env.valid) return { valid: false, errors: env.errors, backup }

  const src = validateBackupSources(env.data)
  if (!src.valid) return { valid: false, errors: src.errors, backup }

  return { valid: true, errors: [], backup }
}

function buildStoreImpact(store, current, incoming) {
  const currentIds = new Set(current.map((r) => r.id))
  const incomingIds = new Set(incoming.map((r) => r.id))
  return {
    store,
    currentCount: current.length,
    incomingCount: incoming.length,
    added: incoming.filter((r) => !currentIds.has(r.id)).length,
    updated: incoming.filter((r) => currentIds.has(r.id)).length,
    removed: current.filter((r) => !incomingIds.has(r.id)).length,
  }
}

function buildLocalStorageImpact(local) {
  const keys = Object.keys(local || {})
  return {
    keys,
    count: keys.length,
    note: keys.length
      ? 'Se reemplazará la configuración local del dispositivo'
      : 'No se tocará la configuración local del dispositivo',
  }
}

/**
 * Dry-run: simula la importación y reporta impactos (añadir/actualizar/reemplazar)
 * SIN tocar datos. Devuelve { valid, impacts, localStorage, summary }.
 */
export async function previewBackup(file) {
  const { valid, errors, backup } = await validateBackup(file)
  if (!valid) return { valid: false, errors }

  const data = backup.data
  const db = await openDB()
  const impacts = []
  for (const store of BUSINESS_STORES) {
    const incoming = data.indexedDB?.[store] || []
    const current = await readStoreAll(db, store)
    impacts.push(buildStoreImpact(store, current, incoming))
  }

  const localStorageImpact = buildLocalStorageImpact(data.localStorage)
  const summary = {
    mode: 'replace',
    storeCounts: buildStoreCounts(data),
    localStorageKeys: Object.keys(data.localStorage || {}),
  }

  return { valid: true, impacts, localStorage: localStorageImpact, summary }
}

/**
 * Aplica `replace` (reemplazo total) en UNA transacción readwrite multi-store.
 * Si cualquier escritura falla, la transacción se revierte y nada cambia.
 */
function applyReplace(data) {
  return openDB().then((db) => {
    const storeNames = BUSINESS_STORES.filter((s) => db.objectStoreNames.contains(s))
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite')
      let settled = false

      tx.oncomplete = () => {
        if (settled) return
        settled = true
        resolve()
      }
      tx.onerror = () => {
        if (settled) return
        settled = true
        reject(tx.error)
      }
      tx.onabort = () => {
        if (settled) return
        settled = true
        reject(tx.error)
      }

      for (const storeName of storeNames) {
        const store = tx.objectStore(storeName)
        store.clear()
        const records = data.indexedDB?.[storeName] || []
        for (const record of records) {
          store.put(record)
        }
      }
    })
  })
}

async function restoreLocalStorage(local) {
  if (typeof localStorage === 'undefined') return
  for (const key of Object.keys(local)) {
    localStorage.setItem(key, serializeLocalValue(local[key]))
  }
  // Tras restaurar configuración, el PIN siempre vuelve al valor de fábrica (000000),
  // para no arrastrar un PIN viejo del backup ni dejar a nadie bloqueado.
  const settingsRaw = localStorage.getItem('fruteria-settings')
  if (settingsRaw) {
    try {
      const settings = JSON.parse(settingsRaw)
      settings.pin = await hashPin(DEFAULT_PIN)
      localStorage.setItem('fruteria-settings', JSON.stringify(settings))
    } catch (_) {
      // No bloqueamos la restauración por un fallo en el reset del PIN.
    }
  }
}

/**
 * Restaura un backup (modo `replace`).
 * - Valida el archivo (rechaza corruptos sin tocar datos).
 * - Crea un snapshot automático previo (para poder revertir) y lo registra.
 * - Aplica `replace` atómicamente (all-or-nothing).
 * - Restaura configuración si el backup es `completo` y resetea el PIN a 000000.
 * - Emite evento INFO de auditoría.
 */
export async function importBackup(file, options = {}) {
  const { mode = 'replace' } = options
  const { valid, errors, backup } = await validateBackup(file)
  if (!valid) throw new Error(errors.join('; '))
  if (mode !== 'replace') throw new Error(`Modo de restauración "${mode}" no soportado`)
  return applyData(backup.data)
}

/**
 * Restaura desde un respaldo guardado en el registro (historial).
 * Necesita que el registro conserve el `payload` (backups pequeños).
 * Usa `revert` cuando el registro es un snapshot previo (mode 'automatico').
 */
export async function restoreFromRecord(recordId) {
  const records = await getBackupRecords()
  const record = records.find((r) => r.id === recordId)
  if (!record) throw new Error('Registro de backup no encontrado')
  if (!record.payload) {
    throw new Error('El respaldo no tiene datos guardados en el dispositivo; seleccione el archivo manualmente')
  }
  return applyData(record.payload, { fromRecordId: recordId })
}

/**
 * Aplica un payload `data` de backup con `replace` atómico, snapshot previo,
 * configuración y auditoría. Es el núcleo compartido por importBackup/restoreFromRecord.
 */
async function applyData(data, { fromRecordId = null } = {}) {
  const pre = await createBackup({ scope: SCOPE_COMPLETO, mode: MODE_AUTOMATICO })
  const preRecord = { ...pre.record }
  if (pre.sizeBytes <= SMALL_PAYLOAD_LIMIT) preRecord.payload = pre.data

  await addBackupRecord(preRecord)

  await applyReplace(data)

  const restoredConfig = data.localStorage && Object.keys(data.localStorage).length > 0
  if (restoredConfig) {
    await restoreLocalStorage(data.localStorage)
  }

  try {
    await addLog(LOG_TYPES.INFO, 'Backup restaurado', {
      filename: preRecord.filename,
      scope: preRecord.scope,
      sizeBytes: preRecord.sizeBytes,
      mode: 'replace',
      fromRecordId,
    })
  } catch (_) {
    // Auditoría es best-effort.
  }

  return {
    success: true,
    mode: 'replace',
    count: Object.values(data.indexedDB).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
    storeCounts: buildStoreCounts(data),
    restoredConfig,
    preRestoreRecordId: preRecord.id,
  }
}

/**
 * Exportar + descargar (vía navegador). Mantiene compatibilidad con BackupModal.
 * Registra el respaldo en backup_registry y emite auditoría INFO.
 */
export async function exportBackup(options = {}) {
  const result = await createBackup(options)
  const record = { ...result.record }
  if (result.sizeBytes <= SMALL_PAYLOAD_LIMIT) record.payload = result.data
  await addBackupRecord(record)

  try {
    await addLog(LOG_TYPES.INFO, 'Backup creado', {
      filename: result.filename,
      scope: result.scope,
      sizeBytes: result.sizeBytes,
      mode: result.mode,
    })
  } catch (_) {
    // Auditoría es best-effort.
  }

  downloadBackup(result.backup, result.filename)
  return { success: true, filename: result.filename, sizeBytes: result.sizeBytes }
}

/**
 * Descarga un backup en el navegador (blob + enlace temporal).
 */
export function downloadBackup(backup, filename) {
  if (typeof document === 'undefined') return
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Construye un File del backup (para compartir con el share sheet).
 */
export function buildBackupFile(backup, filename) {
  if (typeof File === 'undefined') return null
  return new File([JSON.stringify(backup, null, 2)], filename, { type: 'application/json' })
}

/**
 * Compartir el backup fuera del dispositivo (copia de redundancia).
 * Usa la Web Share API cuando está disponible (PWA/móvil); si no, cae a descarga.
 * Registra el respaldo en backup_registry y emite auditoría INFO.
 */
export async function shareBackup(options = {}) {
  const result = await createBackup(options)
  const record = { ...result.record }
  if (result.sizeBytes <= SMALL_PAYLOAD_LIMIT) record.payload = result.data
  await addBackupRecord(record)

  try {
    await addLog(LOG_TYPES.INFO, 'Backup compartido', {
      filename: result.filename,
      scope: result.scope,
      sizeBytes: result.sizeBytes,
      mode: result.mode,
    })
  } catch (_) {
    // Auditoría es best-effort.
  }

  const file = buildBackupFile(result.backup, result.filename)
  const shared = file ? await tryShareFile(file) : false
  if (!shared) {
    downloadBackup(result.backup, result.filename)
  }

  return { success: true, shared, filename: result.filename, sizeBytes: result.sizeBytes }
}

async function tryShareFile(file) {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  try {
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return false
    await navigator.share({ files: [file], title: 'Backup Frutería POS' })
    return true
  } catch (_) {
    // Usuario canceló o el share falló → se cae a descarga.
    return false
  }
}

// ── Backup automático (SPEC-001) ──
// El respaldo automático cubre el DÍA PREVIO (no el actual): se dispara al abrir la app
// y solo si aún no hay un respaldo registrado para el día previo. Retención: 4 últimos.

export const AUTO_BACKUP_RETENTION = 4

/**
 * Clave de fecha local en formato 'YYYY-MM-DD'.
 */
export function todayDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Clave de fecha del día anterior al dado.
 */
export function previousDayDateKey(date = new Date()) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return todayDateKey(d)
}

/**
 * Crea un snapshot automático que cubre `periodDate` (por defecto, el día previo).
 * Lo registra en backup_registry con `mode: 'automatico'` y `periodDate`, y aplica la retención.
 */
export async function createAutomaticSnapshot({ periodDate = previousDayDateKey() } = {}) {
  const result = await createBackup({ scope: SCOPE_COMPLETO, mode: MODE_AUTOMATICO })
  const record = { ...result.record, periodDate }
  if (result.sizeBytes <= SMALL_PAYLOAD_LIMIT) record.payload = result.data
  await addBackupRecord(record)
  await cleanupAutoSnapshots(AUTO_BACKUP_RETENTION)

  try {
    await addLog(LOG_TYPES.INFO, 'Backup automático creado', {
      periodDate,
      filename: result.filename,
      sizeBytes: result.sizeBytes,
      mode: MODE_AUTOMATICO,
    })
  } catch (_) {
    // Auditoría es best-effort.
  }

  return { ...result, record }
}

/**
 * Indica si ya existe un respaldo automático que cubra `periodDate`.
 */
export async function hasAutoBackupFor(periodDate) {
  const records = await getBackupRecords()
  return records.some((r) => r.mode === MODE_AUTOMATICO && r.periodDate === periodDate)
}

/**
 * Mantiene solo los `max` respaldos automáticos más recientes (ventana rodante).
 * No toca los backups manuales ni los compartidos. Devuelve cuántos borró.
 */
export async function cleanupAutoSnapshots(max = AUTO_BACKUP_RETENTION) {
  const records = await getBackupRecords()
  const autos = records
    .filter((r) => r.mode === MODE_AUTOMATICO)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const toDelete = autos.slice(max)
  for (const r of toDelete) {
    await deleteBackupRecord(r.id)
  }
  return toDelete.length
}

/**
 * Al cargar la app: si aún no hay respaldo para el día previo, crea uno automáticamente.
 * `onStart` se invoca justo antes de ejecutar el snapshot (para mostrar el indicador de progreso).
 * Devuelve { didRun, periodDate }.
 */
export async function runAutoBackupIfDue({ date = new Date(), onStart = () => {} } = {}) {
  const periodDate = previousDayDateKey(date)
  if (await hasAutoBackupFor(periodDate)) {
    return { didRun: false, periodDate }
  }
  onStart()
  await createAutomaticSnapshot({ periodDate })
  return { didRun: true, periodDate }
}
