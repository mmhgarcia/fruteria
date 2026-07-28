import { formatQty } from '../utils/format'
import './CartModal.css'

function CartModal({ cart, totals, onClose, onRemoveItem }) {
  const hasItems = cart.length > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h2>🛒 Mi Carrito</h2>
          <button
            className="cart-modal-close"
            onClick={onClose}
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        <div className="cart-modal-body">
          {!hasItems ? (
            <div className="cart-empty">
              <div className="empty-icon">🛒</div>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item, idx) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-num">#{idx + 1}</div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">
                      {item.icon} {item.name}
                    </div>
                    <div className="cart-item-detail">
                      {formatQty(item.qty, item.um)} {item.um} × ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="cart-item-total">
                    ${item.totalUSD.toFixed(2)}
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => onRemoveItem(idx)}
                    aria-label={`Eliminar ${item.name}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasItems && (
          <div className="cart-modal-footer">
            <div className="cart-summary-row">
              <span>Items</span>
              <span>{cart.length}</span>
            </div>
            <div className="cart-summary-row total">
              <span>Total $</span>
              <span>{totals.totalUSD.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row total-bs">
              <span>Total Bs</span>
              <span>{totals.totalBS.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartModal
