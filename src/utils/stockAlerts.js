// filepath: src/utils/stockAlerts.js
// Cómputo de alertas de stock (semáforo) para mostrar en el Header y las cards.
// Estados (de mayor a menor stock):
//   - 'ok'         VERDE   (disponibilidad)   stock > punto de pedido
//   - 'pedir'      ÁMBAR   (advertencia)      stockMínimo < stock <= puntoPedido
//   - 'reponer'    NARANJA (reponer)          0 < stock <= stockMínimo
//   - 'agotado'    ROJO    (agotado)          stock === 0
//   - 'sin_definir' GRIS   (sin definir)      stock === null
//
// Los umbrales se normalizan con max/min para que el pedido de ingreso
// (mínimo / punto de pedido) no rompa el semáforo.

/**
 * @typedef {Object} StockAlertSummary
 * @property {number} agotados   Cantidad de productos con stock === 0.
 * @property {number} pedidos    Cantidad de productos con 0 < stock < stockMin.
 * @property {number} sinDefinir Cantidad de productos con stock === null.
 * @property {number} total      Total de productos evaluados.
 * @property {Array} items       Productos con alerta (agotado o pedir).
 */

/**
 * Clasifica un producto individual según el semáforo de stock.
 * Devuelve una de: 'ok' | 'pedir' | 'reponer' | 'agotado' | 'sin_definir'.
 *
 * Con ambos umbrales definidos:
 *   - 'ok'       si stock > max(min, pp)
 *   - 'pedir'    si min < stock <= max(...)   (ámbar)
 *   - 'reponer'  si 0 < stock <= min          (naranja)
 * Con solo punto de pedido: 'ok' / 'pedir'. Con solo mínimo: 'ok' / 'reponer'.
 * @param {{stock: number|null, stockMin?: number|null, puntoPedido?: number|null}} product
 */
export function clasificarStock(product) {
  if (product.stock == null) return 'sin_definir'
  if (product.stock === 0) return 'agotado'

  const min = typeof product.stockMin === 'number' && product.stockMin > 0 ? product.stockMin : null
  const pp = typeof product.puntoPedido === 'number' && product.puntoPedido > 0 ? product.puntoPedido : null

  if (min != null && pp != null) {
    const bajo = Math.min(min, pp)
    const alto = Math.max(min, pp)
    if (product.stock > alto) return 'ok'
    if (product.stock > bajo) return 'pedir'
    return 'reponer'
  }
  if (pp != null) {
    return product.stock > pp ? 'ok' : 'pedir'
  }
  if (min != null) {
    return product.stock > min ? 'ok' : 'reponer'
  }
  return 'ok'
}

/**
 * @param {Array} products Lista de productos (típicamente de getProducts()).
 * @param {string} [ramoId] Si se indica, filtra a ese ramo.
 * @returns {StockAlertSummary}
 */
export function computeStockAlerts(products, ramoId) {
  const list = ramoId
    ? products.filter((p) => !p.ramo || p.ramo === ramoId)
    : products

  let agotados = 0
  let pedidos = 0
  let sinDefinir = 0
  const items = []

  for (const p of list) {
    const cls = clasificarStock(p)
    if (cls === 'agotado') {
      agotados += 1
      items.push({ product: p, severity: 'agotado' })
    } else if (cls === 'pedir' || cls === 'reponer') {
      pedidos += 1
      items.push({ product: p, severity: cls })
    } else if (cls === 'sin_definir') {
      sinDefinir += 1
    }
  }

  return { agotados, pedidos, sinDefinir, total: list.length, items }
}