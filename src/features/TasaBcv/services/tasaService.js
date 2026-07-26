const DB_NAME = 'fruteria-db'
const DB_VERSION = 3
const TASA_STORE_NAME = 'historico_tasas'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(TASA_STORE_NAME)) {
        db.createObjectStore(TASA_STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export async function getTasas() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASA_STORE_NAME, 'readonly')
    const store = tx.objectStore(TASA_STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const list = request.result
      list.sort((a, b) => new Date(b.fecha_tasa) - new Date(a.fecha_tasa))
      resolve(list)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function addTasa({ fecha_tasa, tasa }) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASA_STORE_NAME, 'readwrite')
    const store = tx.objectStore(TASA_STORE_NAME)
    const request = store.add({ fecha_tasa, tasa: parseFloat(tasa) })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function updateTasa(id, { fecha_tasa, tasa }) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASA_STORE_NAME, 'readwrite')
    const store = tx.objectStore(TASA_STORE_NAME)
    const request = store.put({ id, fecha_tasa, tasa: parseFloat(tasa) })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteTasa(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASA_STORE_NAME, 'readwrite')
    const store = tx.objectStore(TASA_STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getUltimaTasa() {
  const tasas = await getTasas()
  return tasas.length > 0 ? tasas[0].tasa : null
}
