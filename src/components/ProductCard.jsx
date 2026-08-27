import { formatCurrency } from '../utils/format'
import { clasificarStock } from '../utils/stockAlerts'
import './ProductCard.css'

function formatStockQty(stock, um) {
  if (stock == null) return null
  if (um === 'unidad') return String(Math.round(stock))
  return Number(stock).toFixed(1)
}

const STOCK_LABEL = {
  ok:          (qty, um) => `DISP. ${qty} ${(um || '').toUpperCase()}`,
  pedir:       (qty, um) => `PEDIR ${qty} ${(um || '').toUpperCase()}`,
  agotado:     () => 'AGOTADO',
  sin_definir: () => 'SIN DEFINIR',
}

function ProductCard({ product, cartItem, tasa, onSelect }) {
  const cartQty = cartItem ? cartItem.qty : 0
  const badgeText = cartQty > 0 ? formatStockQty(cartQty, product.um) ?? '' : ''
  const status = clasificarStock(product)
  const stockQty = formatStockQty(product.stock, product.um)
  const statusText = stockQty != null
    ? STOCK_LABEL[status](stockQty, product.um)
    : STOCK_LABEL[status]()

  return (
    <button className="product-card" onClick={onSelect}>
      <div className={`product-badge ${cartQty > 0 ? '' : 'hidden'}`}>{badgeText}</div>
      <div className="product-img">{product.icon}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-price-usd">${formatCurrency(product.price)}</div>
      <div className="product-price-bs">Bs: {formatCurrency(product.price * tasa)}</div>
      <div className={`product-card-status product-card-status--${status}`}>
        {statusText}
      </div>
    </button>
  )
}

export default ProductCard
