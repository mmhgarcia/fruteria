const DB_NAME = 'fruteria-db'
const DB_VERSION = 7
const STORE_NAME = 'products'
const TASA_STORE_NAME = 'historico_tasas'
const SALES_STORE_NAME = 'sales'
const RAMOS_STORE_NAME = 'ramos'
const LOG_STORE_NAME = 'logs'
const STOCK_MOVEMENTS_STORE_NAME = 'stock_movements'

const REQUIRED_STORES = [
  STORE_NAME,
  'categories',
  TASA_STORE_NAME,
  SALES_STORE_NAME,
  RAMOS_STORE_NAME,
  LOG_STORE_NAME,
  STOCK_MOVEMENTS_STORE_NAME,
]

function createMissingStores(db) {
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
  }
  if (!db.objectStoreNames.contains('categories')) {
    db.createObjectStore('categories', { keyPath: 'id' })
  }
  if (!db.objectStoreNames.contains(TASA_STORE_NAME)) {
    db.createObjectStore(TASA_STORE_NAME, { keyPath: 'id', autoIncrement: true })
  }
  if (!db.objectStoreNames.contains(SALES_STORE_NAME)) {
    db.createObjectStore(SALES_STORE_NAME, { keyPath: 'id', autoIncrement: true })
  }
  if (!db.objectStoreNames.contains(RAMOS_STORE_NAME)) {
    db.createObjectStore(RAMOS_STORE_NAME, { keyPath: 'id' })
  }
  if (!db.objectStoreNames.contains(LOG_STORE_NAME)) {
    db.createObjectStore(LOG_STORE_NAME, { keyPath: 'id', autoIncrement: true })
  }
  if (!db.objectStoreNames.contains(STOCK_MOVEMENTS_STORE_NAME)) {
    db.createObjectStore(STOCK_MOVEMENTS_STORE_NAME, { keyPath: 'id', autoIncrement: true })
  }
}

export function openDB() {
  return new Promise((resolve, reject) => {
    // Open without explicit version to avoid VersionError when DB already has a higher version.
    const request = indexedDB.open(DB_NAME)

    request.onerror = () => reject(request.error)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      createMissingStores(db)
    }

    request.onsuccess = (event) => {
      const db = event.target.result

      // If some required stores are missing (possible when DB was created by older code),
      // close and reopen with an incremented version to trigger onupgradeneeded and create them.
      const missing = REQUIRED_STORES.filter((s) => !db.objectStoreNames.contains(s))
      if (missing.length > 0) {
        db.close()
        const newVersion = db.version + 1
        const upgradeReq = indexedDB.open(DB_NAME, newVersion)

        upgradeReq.onerror = () => reject(upgradeReq.error)
        upgradeReq.onupgradeneeded = (ev) => {
          const db2 = ev.target.result
          createMissingStores(db2)
        }
        upgradeReq.onsuccess = () => resolve(upgradeReq.result)
      } else {
        resolve(db)
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

export async function addSale(sale) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SALES_STORE_NAME, 'readwrite')
    const store = tx.objectStore(SALES_STORE_NAME)
    const request = store.add(sale)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getSales() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SALES_STORE_NAME, 'readonly')
    const store = tx.objectStore(SALES_STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getSalesByDateRange(start, end) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SALES_STORE_NAME, 'readonly')
    const store = tx.objectStore(SALES_STORE_NAME)
    const request = store.openCursor()
    const sales = []

    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (!cursor) {
        resolve(sales)
        return
      }
      const sale = cursor.value
      const saleDate = new Date(sale.date)
      if (saleDate >= start && saleDate <= end) {
        sales.push(sale)
      }
      cursor.continue()
    }

    request.onerror = () => reject(request.error)
  })
}

export async function deleteSale(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SALES_STORE_NAME, 'readwrite')
    const store = tx.objectStore(SALES_STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
