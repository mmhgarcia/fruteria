// Lógica pura de totales del carrito. Sin dependencias de UI ni IndexedDB.
// Se extrajo de App.jsx (useMemo de `totals`) para hacerla testeable.

/**
 * Calcula los totales de un carrito.
 * @param {Array<{totalUSD?: number}>} items Items del carrito.
 * @param {number} tasa Tasa USD→Bs activa.
 * @returns {{ totalUSD: number, totalBS: number, count: number }}
 */
export function calcularTotales(items, tasa) {
  const lista = Array.isArray(items) ? items : []
  const totalUSD = lista.reduce((sum, item) => sum + (Number(item.totalUSD) || 0), 0)
  const totalBS = totalUSD * (Number(tasa) || 0)
  return { totalUSD, totalBS, count: lista.length }
}
