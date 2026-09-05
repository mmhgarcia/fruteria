// filepath: src/utils/inventory.js
// Lógica de inventario: movimientos de stock, registro y consulta de historial.
// Convenciones:
//  - Los productos guardan `stock` (number|null), `stockMin` (number|null) y
//    `costoPromedio` (number|null). Los null representan "sin definir" para
//    productos legados (backfill al migrar a v7).
//  - Cada cambio de stock genera un movimiento en `stock_movements` con la
//    misma transacción IndexedDB que actualiza `products`, garantizando
//    atomicidad.

import { addLog, LOG_TYPES } from './logService.js'
import { clasificarStock } from './stockAlerts.js'
import { openDB } from './db.js'

const PRODUCTS_STORE = 'products'
const MOVEMENTS_STORE = 'stock_movements'

/**
 * Tipos de movimiento de stock.
 *  - 'entrada': compra al mayorista, suma al stock.
 *  - 'merma':   producto dañado/vencido, descuenta stock.
 *  - 'ajuste':  corrección manual por conteo físico, suma o resta.
 *  - 'venta':   descuento automático al confirmar una venta.
 */
export const MOVEMENT_TYPES = Object.freeze({
  ENTRADA: 'entrada',
  MERMA: 'merma',
  AJUSTE: 'ajuste',
  VENTA: 'venta',
})

/**
 * Métodos de valoración de inventario soportados.
 * Configurables desde Configuración del Sistema → Inventario.
 * Por defecto se usa WEIGHTED_AVG (promedio ponderado) para mantener
 * compatibilidad con productos existentes.
 */
export const VALUATION_METHODS = Object.freeze({
  WEIGHTED_AVG:  'WEIGHTED_AVG',  // Promedio ponderado (NIIF / VEN-NIF, estándar).
  LAST_COST:     'LAST_COST',     // Último costo de compra registrado.
  MAX_LAST_AVG:  'MAX_LAST_AVG',  // El mayor entre último costo y promedio ponderado.
})

export const VALUATION_LABELS = Object.freeze({
  WEIGHTED_AVG:  { label: 'Promedio Ponderado',  short: 'Costo prom.',  hint: 'Suaviza las variaciones de precio (estándar contable).' },
  LAST_COST:     { label: 'Último costo',        short: 'Último costo', hint: 'Refleja el precio de la compra más reciente.' },
  MAX_LAST_AVG:  { label: 'El más alto (último vs promedio)', short: 'Costo máx.', hint: 'Conservador: nunca acepta un costo inferior al anterior.' },
})

const SETTINGS_KEY = 'fruteria-settings'

/**
 * Lee el método de valoración activo desde localStorage.
 * Si no existe o es inválido, devuelve WEIGHTED_AVG (default seguro).
 */
export function getValuationMethod() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return VALUATION_METHODS.WEIGHTED_AVG
    const settings = JSON.parse(raw)
    const method = settings.valuationMethod
    if (method && Object.values(VALUATION_METHODS).includes(method)) {
      return method
    }
  } catch (_) {
    // localStorage inaccesible o JSON inválido → default seguro.
  }
  return VALUATION_METHODS.WEIGHTED_AVG
}

/**
 * Calcula el costo unitario del producto después de una entrada,
 * aplicando el método de valoración configurado.
 *
 * @param {number|null} costoAnterior   Costo promedio actual (puede ser null).
 * @param {number}      stockPrevio     Stock antes de la entrada.
 * @param {number}      cantidadEntrada Cantidad ingresada en este movimiento.
 * @param {number}      costoUnitario   Costo unitario de la nueva compra.
 * @param {string}      method          Método de valoración (VALUATION_METHODS).
 * @returns {number} Nuevo costo unitario por unidad.
 */
export function calcularCostoEntrada(costoAnterior, stockPrevio, cantidadEntrada, costoUnitario, method) {
  const stockFinal = stockPrevio + cantidadEntrada
  if (stockFinal <= 0) return costoUnitario

  if (method === VALUATION_METHODS.LAST_COST) {
    return costoUnitario
  }

  const promedioPonderado = (stockPrevio > 0 && typeof costoAnterior === 'number')
    ? ((costoAnterior * stockPrevio) + (costoUnitario * cantidadEntrada)) / stockFinal
    : costoUnitario

  if (method === VALUATION_METHODS.MAX_LAST_AVG) {
    return Math.max(costoUnitario, promedioPonderado)
  }

  // WEIGHTED_AVG (default).
  return promedioPonderado
}

function nextStock(stockActual, tipo, cantidad) {
  // Productos sin stock definido (null) arrancan en 0 al primer movimiento.
  const base = typeof stockActual === 'number' ? stockActual : 0
  if (tipo === MOVEMENT_TYPES.ENTRADA) return base + cantidad
  if (tipo === MOVEMENT_TYPES.MERMA) return Math.max(0, base - cantidad)
  if (tipo === MOVEMENT_TYPES.AJUSTE) return Math.max(0, base + cantidad)
  if (tipo === MOVEMENT_TYPES.VENTA) return Math.max(0, base - cantidad)
  return base
}

/**
 * Registra una venta y descuenta stock de los items en UNA transacción atómica.
 *
 * Atomicidad: si CUALQUIER escritura falla (venta, stock, movimiento), la
 * transacción entera se revierte y NADA queda persistido. El carrito queda
 * intacto y el llamador puede reintentar.
 *
 * - Inserta la venta en `sales`
 * - Por cada item: lee el producto, calcula el descuento, actualiza `products`
 *   y registra un movimiento en `stock_movements`
 * - Detecta cruce de umbral (`agotado`/`pedir`/`reponer`) para emitir alertas
 * - Si un producto no existe o el stock es insuficiente, descuenta hasta 0 y
 *   lo marca como faltante (no falla la tx)
 *
 * @param {object} params
 * @param {object} params.sale          Objeto venta (sin id, se genera auto).
 * @param {Array<{id:number, name?:string, qty:number}>} params.items
 * @returns {Promise<{saleId:number, descontados:Array, faltantes:Array, alertas:Array}>}
 */
export async function registrarVentaAtomica({ sale, items }) {
  if (!sale) throw new Error('registrarVentaAtomica: sale requerida')
  if (!Array.isArray(items)) throw new Error('registrarVentaAtomica: items debe ser array')

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      ['sales', 'products', 'stock_movements'],
      'readwrite'
    )
    const salesStore = tx.objectStore('sales')
    const productsStore = tx.objectStore('products')
    const movementsStore = tx.objectStore('stock_movements')

    const descontados = []
    const faltantes = []
    const alertas = []
    let saleId = null
    let settled = false

    // (1) Insertar la venta
    const saleReq = salesStore.add(sale)
    saleReq.onsuccess = () => { saleId = saleReq.result }
    saleReq.onerror = () => reject(saleReq.error)

    // (2) Por cada item: descuento de stock + movimiento
    items.forEach((item) => {
      const getReq = productsStore.get(item.id)
      getReq.onsuccess = () => {
        const product = getReq.result
        if (!product) {
          faltantes.push({ ...item, motivo: 'producto_no_existe' })
          return
        }

        const stockActual = typeof product.stock === 'number' ? product.stock : 0
        const solicitado = Number(item.qty) || 0
        const aplicar = Math.min(solicitado, stockActual)
        const faltante = solicitado - aplicar
        const stockNuevo = Math.max(0, stockActual - aplicar)

        // Cruce de umbral → alerta consolidada
        const stockMin = product.stockMin ?? 0
        const puntoPedido = product.puntoPedido ?? 0
        const estadoPrevio = clasificarStock({ stock: stockActual, stockMin, puntoPedido })
        const estadoNuevo = clasificarStock({ stock: stockNuevo, stockMin, puntoPedido })
        if (['agotado', 'pedir', 'reponer'].includes(estadoNuevo) && estadoNuevo !== estadoPrevio) {
          alertas.push({
            id: item.id,
            name: item.name,
            icon: product.icon || '',
            um: product.um || '',
            stockAnterior: stockActual,
            stockNuevo,
            stockMin,
            estado: estadoNuevo,
          })
        }

        const updated = { ...product, stock: stockNuevo }
        const putReq = productsStore.put(updated)
        putReq.onsuccess = () => {
          const movement = {
            productId: item.id,
            tipo: MOVEMENT_TYPES.VENTA,
            cantidad: aplicar,
            stockAnterior: stockActual,
            stockNuevo,
            motivo: 'Venta',
            ref: { saleId },
            timestamp: new Date().toISOString(),
          }
          const addReq = movementsStore.add(movement)
          addReq.onsuccess = () => {
            descontados.push({ ...item, stockAnterior: stockActual, stockNuevo })
            if (faltante > 0) {
              faltantes.push({ ...item, faltante })
            }
          }
          addReq.onerror = () => reject(addReq.error)
        }
        putReq.onerror = () => reject(putReq.error)
      }
      getReq.onerror = () => reject(getReq.error)
    })

    tx.oncomplete = () => {
      if (settled) return
      settled = true
      resolve({ saleId, descontados, faltantes, alertas })
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
  })
}

/**
 * Aplica un movimiento de stock: actualiza el producto y registra el historial
 * en una sola transacción.
 *
 * @param {object} params
 * @param {number} params.productId
 * @param {'entrada'|'merma'|'ajuste'|'venta'} params.tipo
 * @param {number} params.cantidad
 * @param {string} [params.motivo]
 * @param {number|null} [params.costoUnitario]  Solo en 'entrada'. Si se envía,
 *        recalcula el costoPromedio ponderado por stock actual.
 * @param {object} [params.ref]  Referencia externa opcional (ej. { saleId }).
 * @returns {Promise<{ movement: object, product: object }>}
 */
export async function registrarMovimiento({ productId, tipo, cantidad, motivo = '', costoUnitario = null, ref = null }) {
  if (!productId) throw new Error('registrarMovimiento: productId requerido')
  cantidad = Number(cantidad)
  if (!Number.isFinite(cantidad) || cantidad === 0) throw new Error('registrarMovimiento: cantidad inválida')
  if (tipo !== MOVEMENT_TYPES.AJUSTE && cantidad < 0) throw new Error('registrarMovimiento: cantidad debe ser > 0')
  if (!Object.values(MOVEMENT_TYPES).includes(tipo)) {
    throw new Error(`registrarMovimiento: tipo inválido "${tipo}"`)
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([PRODUCTS_STORE, MOVEMENTS_STORE], 'readwrite')
    const productsStore = tx.objectStore(PRODUCTS_STORE)
    const movementsStore = tx.objectStore(MOVEMENTS_STORE)

    let resultProduct = null
    let stockAnterior = null

    const getReq = productsStore.get(productId)
    getReq.onsuccess = () => {
      const product = getReq.result
      if (!product) {
        reject(new Error(`Producto ${productId} no encontrado`))
        return
      }
      stockAnterior = typeof product.stock === 'number' ? product.stock : 0
      const stockNuevo = nextStock(product.stock, tipo, cantidad)

      // Recalcular costo unitario en entradas, según método configurado.
      let costoPromedio = product.costoPromedio ?? null
      if (tipo === MOVEMENT_TYPES.ENTRADA && typeof costoUnitario === 'number' && costoUnitario >= 0) {
        const method = getValuationMethod()
        costoPromedio = calcularCostoEntrada(
          product.costoPromedio,
          stockAnterior,
          cantidad,
          costoUnitario,
          method,
        )
      }

      const updated = {
        ...product,
        stock: stockNuevo,
        costoPromedio,
      }
      const putReq = productsStore.put(updated)
      putReq.onsuccess = () => {
        resultProduct = updated
        const movement = {
          productId,
          tipo,
          cantidad,
          stockAnterior: stockAnterior,
          stockNuevo,
          motivo,
          costoUnitario: tipo === MOVEMENT_TYPES.ENTRADA ? costoUnitario : null,
          ref,
          timestamp: new Date().toISOString(),
        }
        const addReq = movementsStore.add(movement)
        addReq.onsuccess = () => {
          resolve({ movement: { ...movement, id: addReq.result }, product: resultProduct })
        }
        addReq.onerror = () => reject(addReq.error)
      }
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)

    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/**
 * Aplica el descuento de stock de un carrito completo. Se usa al confirmar
 * una venta. NO registra el movimiento dentro de la transacción de la venta
 * (esa la maneja App.jsx) pero sí descuenta atómicamente.
 *
 * Si un item intenta vender más del stock disponible, descuenta hasta 0 y
 * registra un log WARNING con la diferencia.
 *
 * @param {Array<{id:number, qty:number, name?:string}>} items
 * @returns {Promise<{ descontados: Array, faltantes: Array, alertas: Array }>}
 *
 * `alertas` contiene los productos que, a causa de esta venta, cruzaron a
 * estatus 'agotado' o 'pedir' (antes estaban en 'ok'). Se usa para notificar
 * al cajero que hay productos por reponer.
 */
export async function descontarStockVenta(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { descontados: [], faltantes: [], alertas: [] }
  }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([PRODUCTS_STORE, MOVEMENTS_STORE], 'readwrite')
    const productsStore = tx.objectStore(PRODUCTS_STORE)
    const movementsStore = tx.objectStore(MOVEMENTS_STORE)

    const descontados = []
    const faltantes = []
    const alertas = []
    let pending = items.length

    items.forEach((item) => {
      const getReq = productsStore.get(item.id)
      getReq.onsuccess = () => {
        const product = getReq.result
        if (!product) {
          faltantes.push({ ...item, motivo: 'producto_no_existe' })
          if (--pending === 0) finish()
          return
        }
        const stockActual = typeof product.stock === 'number' ? product.stock : 0
        const solicitado = Number(item.qty) || 0
        const aplicar = Math.min(solicitado, stockActual)
        const faltante = solicitado - aplicar
        const stockNuevo = Math.max(0, stockActual - aplicar)

        // Detectar cruce de umbral: si tras descontar el producto pasó a
        // 'agotado' o 'pedir' y antes no lo estaba, se agrega a las alertas.
        const stockMin = product.stockMin ?? 0
        const puntoPedido = product.puntoPedido ?? 0
        const estadoPrevio = clasificarStock({ stock: stockActual, stockMin, puntoPedido })
        const estadoNuevo = clasificarStock({ stock: stockNuevo, stockMin, puntoPedido })
        if (['agotado', 'pedir', 'reponer'].includes(estadoNuevo) && estadoNuevo !== estadoPrevio) {
          alertas.push({
            id: item.id,
            name: item.name,
            icon: product.icon || '',
            um: product.um || '',
            stockAnterior: stockActual,
            stockNuevo,
            stockMin,
            estado: estadoNuevo,
          })
        }

        const updated = { ...product, stock: stockNuevo }
        const putReq = productsStore.put(updated)
        putReq.onsuccess = () => {
          const movement = {
            productId: item.id,
            tipo: MOVEMENT_TYPES.VENTA,
            cantidad: aplicar,
            stockAnterior: stockActual,
            stockNuevo,
            motivo: 'Venta',
            ref: null,
            timestamp: new Date().toISOString(),
          }
          const addReq = movementsStore.add(movement)
          addReq.onsuccess = () => {
            descontados.push({ ...item, stockAnterior: stockActual, stockNuevo })
            if (faltante > 0) {
              faltantes.push({ ...item, faltante })
              addLog(LOG_TYPES.WARNING, 'Stock insuficiente al cobrar', {
                productId: item.id,
                productName: item.name,
                solicitado,
                disponible: stockActual,
                faltante,
              }).catch(() => {})
            }
            if (--pending === 0) finish()
          }
          addReq.onerror = () => reject(addReq.error)
        }
        putReq.onerror = () => reject(putReq.error)
      }
      getReq.onerror = () => reject(getReq.error)
    })

    function finish() {
      resolve({ descontados, faltantes, alertas })
    }
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/**
 * Devuelve el historial de movimientos de un producto, más reciente primero.
 */
export async function getMovimientosByProduct(productId, { limit } = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOVEMENTS_STORE, 'readonly')
    const store = tx.objectStore(MOVEMENTS_STORE)
    const req = store.openCursor()
    const results = []
    req.onsuccess = (event) => {
      const cursor = event.target.result
      if (!cursor) {
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        resolve(limit ? results.slice(0, limit) : results)
        return
      }
      const m = cursor.value
      if (m.productId === productId) results.push(m)
      cursor.continue()
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * Devuelve los últimos N movimientos globales (de cualquier producto).
 */
export async function getMovimientosRecientes(limit = 200) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOVEMENTS_STORE, 'readonly')
    const store = tx.objectStore(MOVEMENTS_STORE)
    const req = store.getAll()
    req.onsuccess = () => {
      const all = req.result || []
      all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      resolve(all.slice(0, limit))
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * Actualiza solo los metadatos de stock mínimo de un producto, sin generar
 * movimiento (es solo configuración).
 */
export async function setStockMinimo(productId, stockMin) {
  if (stockMin != null && (typeof stockMin !== 'number' || stockMin < 0)) {
    throw new Error('stockMin debe ser un número >= 0 o null')
  }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PRODUCTS_STORE, 'readwrite')
    const store = tx.objectStore(PRODUCTS_STORE)
    const getReq = store.get(productId)
    getReq.onsuccess = () => {
      const product = getReq.result
      if (!product) {
        reject(new Error(`Producto ${productId} no encontrado`))
        return
      }
      const updated = { ...product, stockMin }
      const putReq = store.put(updated)
      putReq.onsuccess = () => resolve(updated)
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

/**
 * Construye el reporte de inventario valorizado a partir de la lista de productos.
 * Usa el método de valoración activo y agrupa por categoría (`product.group`).
 *
 * Solo incluye productos con `stock > 0`. Los productos sin `costoPromedio`
 * registrado se incluyen con costo 0 y se cuentan en `sinCostoCount`.
 *
 * @param {Array} products Lista cruda de productos (de getProducts()).
 * @param {string} [ramoId] Si se indica, filtra a ese ramo.
 * @returns {{
 *   method: string,
 *   methodLabel: string,
 *   generatedAt: string,
 *   categories: Array<{ name: string, items: Array, subtotal: number }>,
 *   totalGeneral: number,
 *   sinCostoCount: number,
 *   totalProductos: number,
 *   totalItems: number,
 * }}
 */
export function getInventoryValuation(products, ramoId) {
  const method = getValuationMethod()
  const methodLabel = VALUATION_LABELS[method]?.label ?? method

  const conStock = products.filter((p) => {
    if (typeof p.stock !== 'number' || p.stock <= 0) return false
    if (ramoId && p.ramo && p.ramo !== ramoId) return false
    return true
  })

  const gruposMap = new Map()
  let totalGeneral = 0
  let sinCostoCount = 0
  let totalItems = 0

  for (const p of conStock) {
    const tieneCosto = typeof p.costoPromedio === 'number'
    if (!tieneCosto) sinCostoCount++
    const costoUnitario = tieneCosto ? p.costoPromedio : 0
    const valor = p.stock * costoUnitario
    const grupo = p.group && String(p.group).trim() ? String(p.group) : 'Sin categoría'

    if (!gruposMap.has(grupo)) {
      gruposMap.set(grupo, { name: grupo, items: [], subtotal: 0 })
    }
    const entry = gruposMap.get(grupo)
    entry.items.push({
      id: p.id,
      name: p.name,
      icon: p.icon || '',
      stock: p.stock,
      um: p.um || '',
      costoUnitario,
      valor,
      tieneCosto,
    })
    entry.subtotal += valor
    totalGeneral += valor
    totalItems++
  }

  const categories = Array.from(gruposMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    method,
    methodLabel,
    generatedAt: new Date().toISOString(),
    categories,
    totalGeneral,
    sinCostoCount,
    totalProductos: conStock.length,
    totalItems,
  }
}
