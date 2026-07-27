import { openDB } from './db.js'

const STORE_NAME = 'categories'

export async function getCategories() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function addCategory(category) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(category)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function updateCategory(category) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(category)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteCategory(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function seedCategories(defaultCategories) {
  const existing = await getCategories()
  const existingIds = new Set(existing.map((c) => c.id))
  const missing = defaultCategories.filter((c) => !existingIds.has(c.id))

  if (missing.length === 0) return existing

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const added = []

    missing.forEach((category) => {
      const request = store.put(category)
      request.onsuccess = () => added.push(category)
      request.onerror = () => {
        console.error('Error adding category:', category, request.error)
      }
    })

    tx.oncomplete = () => resolve([...existing, ...added])
    tx.onerror = () => reject(tx.error)
  })
}
