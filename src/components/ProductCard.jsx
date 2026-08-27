import { formatQty, formatCurrency } from '../utils/format'
import { clasificarStock } from '../utils/stockAlerts'
import './ProductCard.css'

const STOCK_LABEL = {
  ok:          (qty, um) => `DISP. ${qty} ${um.toUpperCase()}`,
  pedir:       (qty, um) => `PEDIR ${qty} ${um.toUpperCase()}`,
  agotado:     () => 'AGOTADO',
  sin_definir: () => 'SIN DEFINIR',
}

function ProductCard({ product, cartItem, tasa, onSelect }) {
  const qty = cartItem ? cartItem.qty : 0
  const badgeText = qty > 0 ? formatQty(qty, product.um) : ''
  const status = clasificarStock(product)
  const statusText = STOCK_LABEL[status](formatQty(product.stock, product.um), product.um)

  return (
    <button className="product-card" onClick={onSelect}>
      <div className={`product-badge ${qty > 0 ? '' : 'hidden'}`}>{badgeText}</div>
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
