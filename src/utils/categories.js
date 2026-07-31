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

export async function getCategoriesByRamo(ramoId) {
  const all = await getCategories()
  return all
    .filter((c) => c.ramo === ramoId)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name))
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
  const existingById = new Map(existing.map((c) => [c.id, c]))
  const missing = defaultCategories.filter((c) => !existingById.has(c.id))
  const toFix = defaultCategories
    .filter((c) => existingById.has(c.id) && existingById.get(c.id).ramo !== c.ramo)
    .map((c) => ({ ...existingById.get(c.id), ramo: c.ramo }))

  if (missing.length === 0 && toFix.length === 0) return existing

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const result = [...existing]

    missing.forEach((category) => {
      store.put(category)
      result.push(category)
    })

    toFix.forEach((category) => {
      store.put(category)
    })

    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
  })
}
