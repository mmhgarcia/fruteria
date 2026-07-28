import { formatQty, formatCurrency } from '../utils/format'
import './ProductCard.css'

function ProductCard({ product, cartItem, tasa, onSelect }) {
  const qty = cartItem ? cartItem.qty : 0
  const badgeText = qty > 0 ? formatQty(qty, product.um) : ''

  return (
    <button className="product-card" onClick={onSelect}>
      <div className={`product-badge ${qty > 0 ? '' : 'hidden'}`}>{badgeText}</div>
      <div className="product-img">{product.icon}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-price-usd">${formatCurrency(product.price)}</div>
      <div className="product-price-bs">Bs: {formatCurrency(product.price * tasa)}</div>
    </button>
  )
}

export default ProductCard
