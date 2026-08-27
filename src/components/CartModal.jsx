import { useState } from 'react'
import { formatQty, formatCurrency } from '../utils/format'
import WeightModal from './WeightModal'
import './CartModal.css'

function CartModal({ cart, totals, onClose, onRemoveItem, onEditItem, tasa }) {
  const [editingIdx, setEditingIdx] = useState(null)
  const editingItem = editingIdx !== null ? cart[editingIdx] : null
  const hasItems = cart.length > 0

  return (
    <>
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
                    <div className="cart-item-info" onClick={() => setEditingIdx(idx)}>
                      <div className="cart-item-name">
                        {item.icon} {item.name}
                      </div>
                      <div className="cart-item-detail">
                        {formatQty(item.qty, item.um)} {item.um} × ${formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="cart-item-total">
                      ${formatCurrency(item.totalUSD)}
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
              <div className="cart-summary-row total-bs">
                <span>Total Bs</span>
                <span>{formatCurrency(totals.totalBS)}</span>
              </div>
              <div className="cart-summary-row total">
                <span>Total $</span>
                <span>{formatCurrency(totals.totalUSD)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingItem && (
        <WeightModal
          product={editingItem}
          tasa={tasa}
          initialQty={editingItem.qty}
          onClose={() => setEditingIdx(null)}
          onConfirm={(qty) => {
            onEditItem(editingIdx, qty)
            setEditingIdx(null)
          }}
          maxQty={
            typeof editingItem.stock === 'number' ? editingItem.stock : undefined
          }
        />
      )}
    </>
  )
}

export default CartModal
