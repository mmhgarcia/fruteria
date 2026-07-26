const DB_NAME = 'fruteria-db'
const DB_VERSION = 1
const STORE_NAME = 'products'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export async function seedProducts(defaultProducts) {
  const existing = await getProducts()
  const existingNames = new Set(existing.map((p) => p.name.toLowerCase()))
  const missing = defaultProducts.filter((p) => !existingNames.has(p.name.toLowerCase()))

  if (missing.length === 0) {
    console.log('seedProducts: todos los productos de ejemplo ya existen')
    return existing
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const added = []

    missing.forEach((product) => {
      const { id, ...productWithoutId } = product
      const request = store.add(productWithoutId)
      request.onsuccess = () => added.push({ ...productWithoutId, id: request.result })
      request.onerror = () => {
        console.error('Error adding product:', product, request.error)
      }
    })

    tx.oncomplete = () => resolve([...existing, ...added])
    tx.onerror = () => reject(tx.error)
  })
}

export async function getProducts() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function addProduct(product) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(product)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function updateProduct(product) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(product)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteProduct(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
