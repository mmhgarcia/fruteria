// filepath: src/utils/dashboard.js
// Cómputo del dashboard: KPIs de hoy, alertas de stock, top productos y
// valor del inventario. Todo síncrono; sin IO. Reutiliza la lógica de
// stockAlerts.js e inventory.js (fuente única de verdad).

import { computeStockAlerts } from './stockAlerts'
import { getInventoryValuation } from './inventory'

/**
 * Agrega las ventas por producto y devuelve los N mejores por monto USD.
 * Mismo criterio de agregación que BestSellingProductsModal, pero ordenado
 * por ingresos (no por cantidad).
 *
 * @param {Array} sales  Ventas del período (de getSalesByDateRange()).
 * @param {number} [limit=5]
 * @returns {Array<{id, name, icon, um, qty, totalUSD}>}
 */
export function computeTopProducts(sales, limit = 5) {
  const map = new Map()
  for (const sale of sales || []) {
    for (const item of sale.items || []) {
      const key = item.id ?? item.name
      const prev = map.get(key) || {
        id: item.id,
        name: item.name,
        icon: item.icon || '📦',
        um: item.um || '',
        totalUSD: 0,
        qty: 0,
      }
      prev.totalUSD += item.totalUSD || 0
      prev.qty += item.qty || 0
      map.set(key, prev)
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.totalUSD - a.totalUSD)
    .slice(0, limit)
}

/**
 * Construye el objeto completo de datos del dashboard.
 *
 * @param {Array} products Lista de productos (de getProducts()).
 * @param {Array} sales    Ventas del día (de getSalesByDateRange()).
 * @param {string} [ramoId]
 * @returns {{
 *   kpis: { ventasUSD: number, ventasBS: number, tickets: number, ticketPromedio: number },
 *   alerts: ReturnType<typeof computeStockAlerts>,
 *   inventory: ReturnType<typeof getInventoryValuation>,
 *   top: ReturnType<typeof computeTopProducts>,
 * }}
 */
export function getDashboardData(products, sales, ramoId) {
  const ventasUSD = (sales || []).reduce((sum, s) => sum + (s.totalUSD || 0), 0)
  const ventasBS = (sales || []).reduce((sum, s) => sum + (s.totalBS || 0), 0)
  const tickets = (sales || []).length

  return {
    kpis: {
      ventasUSD,
      ventasBS,
      tickets,
      ticketPromedio: tickets > 0 ? ventasUSD / tickets : 0,
    },
    alerts: computeStockAlerts(products, ramoId),
    inventory: getInventoryValuation(products, ramoId),
    top: computeTopProducts(sales, 5),
  }
}