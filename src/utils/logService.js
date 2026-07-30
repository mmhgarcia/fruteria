const LOG_STORE = 'logs'

/**
 * Tipos de log disponibles
 */
export const LOG_TYPES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  FATAL: 'FATAL',
  ALERT: 'ALERT',
}

/**
 * Abre la base de datos IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('fruteria-db', 6)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(LOG_STORE)) {
        db.createObjectStore(LOG_STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

/**
 * Registra un log en IndexedDB
 * @param {string} type - Tipo de log (INFO, WARNING, ERROR, FATAL, ALERTA)
 * @param {string} message - Mensaje descriptivo del evento
 * @param {object} [details={}] - Datos adicionales opcionales
 * @returns {Promise<number>} ID del log creado
 */
export async function addLog(type, message, details = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOG_STORE, 'readwrite')
    const store = tx.objectStore(LOG_STORE)
    const entry = {
      type,
      message,
      details,
      timestamp: new Date().toISOString(),
    }
    const request = store.add(entry)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Obtiene todos los logs, ordenados del más reciente al más antiguo
 * @param {object} [options]
 * @param {number} [options.limit] - Cantidad máxima de logs a retornar
 * @param {string} [options.type] - Filtrar por tipo de log
 * @returns {Promise<Array>}
 */
export async function getLogs(options = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOG_STORE, 'readonly')
    const store = tx.objectStore(LOG_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      let logs = request.result

      // Filtrar por tipo si se especifica
      if (options.type) {
        logs = logs.filter((log) => log.type === options.type)
      }

      // Ordenar descendente por timestamp
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      // Limitar cantidad si se especifica
      if (options.limit && options.limit > 0) {
        logs = logs.slice(0, options.limit)
      }

      resolve(logs)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Elimina todos los logs
 * @returns {Promise<void>}
 */
export async function clearLogs() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOG_STORE, 'readwrite')
    const store = tx.objectStore(LOG_STORE)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
