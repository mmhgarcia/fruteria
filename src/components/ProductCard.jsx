import { formatQty, formatCurrency } from '../utils/format'
import { clasificarStock } from '../utils/stockAlerts'
import './ProductCard.css'

const STATUS_LABEL = {
  ok:          'Disponible',
  pedir:       'Pedir',
  agotado:     'Agotado',
  sin_definir: 'Sin definir',
}

function ProductCard({ product, cartItem, tasa, onSelect }) {
  const qty = cartItem ? cartItem.qty : 0
  const badgeText = qty > 0 ? formatQty(qty, product.um) : ''
  const status = clasificarStock(product)

  return (
    <button className="product-card" onClick={onSelect}>
      <div className={`product-badge ${qty > 0 ? '' : 'hidden'}`}>{badgeText}</div>
      <div className="product-img">{product.icon}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-price-usd">${formatCurrency(product.price)}</div>
      <div className="product-price-bs">Bs: {formatCurrency(product.price * tasa)}</div>
      <div className={`product-card-status product-card-status--${status}`}>
        {STATUS_LABEL[status]}
      </div>
    </button>
  )
}

export default ProductCard
