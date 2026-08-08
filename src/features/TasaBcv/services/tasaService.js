import { openDB } from '../../../utils/db'

const TASA_STORE_NAME = 'historico_tasas'

export async function getTasas() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASA_STORE_NAME, 'readonly')
    const store = tx.objectStore(TASA_STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const list = request.result
      list.sort((a, b) => b.id - a.id)
      resolve(list)
    }
    request.onerror = () => {
      console.error('getTasas error', request.error)
      reject(request.error)
    }
  })
}

export async function addTasa({ fecha_tasa, tasa }) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASA_STORE_NAME, 'readwrite')
    const store = tx.objectStore(TASA_STORE_NAME)
    const payload = { fecha_tasa, tasa: parseFloat(tasa) }
    const request = store.add(payload)

    request.onsuccess = () => resolve(request.result)

    request.onerror = () => {
      console.warn('addTasa.add failed, attempting put fallback', request.error)
      // If add failed due to constraint, try put as a fallback
      try {
        const putReq = store.put(payload)
        putReq.onsuccess = () => resolve(putReq.result)
        putReq.onerror = () => {
          console.error('addTasa.put fallback failed', putReq.error)
          reject(putReq.error)
        }
      } catch (err) {
        console.error('addTasa unexpected error', err)
        reject(err)
      }
    }
  })
}

export async function updateTasa(id, { fecha_tasa, tasa }) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASA_STORE_NAME, 'readwrite')
    const store = tx.objectStore(TASA_STORE_NAME)
    const request = store.put({ id, fecha_tasa, tasa: parseFloat(tasa) })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      console.error('updateTasa error', request.error)
      reject(request.error)
    }
  })
}

export async function deleteTasa(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASA_STORE_NAME, 'readwrite')
    const store = tx.objectStore(TASA_STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => {
      console.error('deleteTasa error', request.error)
      reject(request.error)
    }
  })
}

export async function getUltimaTasa() {
  const tasas = await getTasas()
  return tasas.length > 0 ? tasas[0].tasa : null
}
