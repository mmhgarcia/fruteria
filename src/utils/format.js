export function formatCurrency(value) {
  const [int, dec] = value.toFixed(2).split('.')
  const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedInt},${dec}`
}

export function formatQty(qty, um) {
  return um === 'unidad' ? Math.round(qty).toString() : qty.toFixed(2)
}
