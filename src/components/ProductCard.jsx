import { formatQty } from '../utils/format'
import './ProductCard.css'

function ProductCard({ product, cartItem, tasa, onSelect }) {
  const qty = cartItem ? cartItem.qty : 0
  const badgeText = qty > 0 ? formatQty(qty, product.um) : ''

  return (
    <button className="product-card" onClick={onSelect}>
      <div className={`product-badge ${qty > 0 ? '' : 'hidden'}`}>{badgeText}</div>
      <div className="product-img">{product.icon}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-price-usd">${product.price.toFixed(2)}</div>
      <div className="product-price-bs">Bs: {(product.price * tasa).toFixed(2)}</div>
    </button>
  )
}

export default ProductCard
