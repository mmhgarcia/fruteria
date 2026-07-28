import { formatQty, formatCurrency } from '../utils/format'
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
      <div className="ticket-footer">
        <div className="summary-row total-bs">
          <span>Total Bs</span>
          <span>{formatCurrency(totals.totalBS)}</span>
        </div>
        <div className="summary-row total">
          <span>Total $</span>
          <span>{formatCurrency(totals.totalUSD)}</span>
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
