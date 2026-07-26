const DB_NAME = 'fruteria-db'
const DB_VERSION = 3

const STORES = ['products', 'categories', 'historico_tasas']

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('historico_tasas')) {
        db.createObjectStore('historico_tasas', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function readAllStores() {
  const db = await openDB()
  const result = {}

  for (const storeName of STORES) {
    if (!db.objectStoreNames.contains(storeName)) {
      result[storeName] = []
      continue
    }
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    result[storeName] = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return result
}

async function clearStore(db, storeName) {
  if (!db.objectStoreNames.contains(storeName)) return
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)
  const request = store.clear()
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function writeStore(db, storeName, records) {
  if (!db.objectStoreNames.contains(storeName)) return
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)

  for (const record of records) {
    await new Promise((resolve, reject) => {
      const request = store.put(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export async function exportBackup() {
  const data = await readAllStores()
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }

  const dataStr = JSON.stringify(backup, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `fruteria_backup_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return { success: true }
}

export async function importBackup(file, options = {}) {
  const { clearBeforeImport = true } = options
  const text = await file.text()
  const backup = JSON.parse(text)

  if (!backup || !backup.data) {
    throw new Error('Archivo de backup inválido')
  }

  const db = await openDB()

  if (clearBeforeImport) {
    for (const storeName of STORES) {
      await clearStore(db, storeName)
    }
  }

  for (const storeName of STORES) {
    const records = backup.data[storeName] || []
    await writeStore(db, storeName, records)
  }

  return { success: true, count: Object.values(backup.data).flat().length }
}
