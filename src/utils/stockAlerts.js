// filepath: src/utils/stockAlerts.js
// Cómputo de alertas de stock para mostrar en el Header.
// Convenciones espejo de Inventory.jsx:
//   - product.stock === null       => "Sin definir" (no alerta)
//   - product.stock === 0          => AGOTADO
//   - 0 < stock < (stockMin ?? 0)  => BAJO
//   - resto                        => OK

/**
 * @typedef {Object} StockAlertSummary
 * @property {number} agotados   Cantidad de productos con stock === 0.
 * @property {number} bajos      Cantidad de productos con 0 < stock < stockMin.
 * @property {number} sinDefinir Cantidad de productos con stock === null.
 * @property {number} total      Total de productos evaluados.
 * @property {Array} items       Productos con alerta (agotado o bajo).
 */

/**
 * Clasifica un producto individual. Devuelve una de: 'ok' | 'agotado' | 'bajo' | 'sin_definir'.
 * @param {{stock: number|null, stockMin?: number|null}} product
 */
export function clasificarStock(product) {
  if (product.stock == null) return 'sin_definir'
  if (product.stock === 0) return 'agotado'
  const min = product.stockMin ?? 0
  if (product.stock < min) return 'bajo'
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
  let bajos = 0
  let sinDefinir = 0
  const items = []

  for (const p of list) {
    const cls = clasificarStock(p)
    if (cls === 'agotado') {
      agotados += 1
      items.push({ product: p, severity: 'agotado' })
    } else if (cls === 'bajo') {
      bajos += 1
      items.push({ product: p, severity: 'bajo' })
    } else if (cls === 'sin_definir') {
      sinDefinir += 1
    }
  }

  return { agotados, bajos, sinDefinir, total: list.length, items }
}
