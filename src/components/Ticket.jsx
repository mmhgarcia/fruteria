import { formatQty } from '../utils/format'
import './Ticket.css'

function Ticket({
  cart,
  totals,
  onRemoveItem,
  onClearCart,
  onOpenPayment,
  onOpenPreview,
}) {
  const hasItems = cart.length > 0

  return (
    <aside className="right-panel">
      <div className="ticket-header">
        <h2>🧾 Ticket</h2>
        <span className="items-count">
          {cart.length} item{cart.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="ticket-items">
        {!hasItems ? (
          <div className="ticket-empty">
            <div className="empty-icon">🛒</div>
            <p>Toca un producto para agregarlo</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div className="ticket-item" key={item.id}>
              <div className="item-num">#{idx + 1}</div>
              <div className="item-info">
                <div className="item-name">
                  {item.name} {item.icon}
                </div>
                <div className="item-detail">
                  {formatQty(item.qty, item.um)} {item.um} × ${item.price.toFixed(2)}
                </div>
              </div>
              <div className="item-total">${item.totalUSD.toFixed(2)}</div>
              <button
                className="item-remove"
                onClick={() => onRemoveItem(idx)}
                aria-label={`Eliminar ${item.name}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
      <div className="ticket-footer">
        <div className="summary-row">
          <span>Items</span>
          <span>{cart.length}</span>
        </div>
        <div className="summary-row total">
          <span>TOTAL $</span>
          <span>{totals.totalUSD.toFixed(2)}</span>
        </div>
        <div className="summary-row total-bs">
          <span>TOTAL Bs</span>
          <span>{totals.totalBS.toFixed(2)}</span>
        </div>
        <div className="action-buttons">
          <button className="action-btn btn-cancel" onClick={onClearCart}>
            ❌ Cancelar
          </button>
          <button
            className="action-btn btn-preview"
            onClick={onOpenPreview}
            disabled={!hasItems}
          >
            👁️ Ver Ticket
          </button>
          <button
            className="action-btn btn-pay"
            onClick={onOpenPayment}
            disabled={!hasItems}
          >
            ✅ Cobrar
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Ticket
