export function formatCurrency(value) {
  return value.toFixed(2)
}

export function formatQty(qty, um) {
  return um === 'unidad' ? Math.round(qty).toString() : qty.toFixed(2)
}
