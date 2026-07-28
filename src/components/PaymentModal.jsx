import { useState } from 'react'
import { formatCurrency } from '../utils/format'
import './PaymentModal.css'

const paymentOptions = [
  { id: 'efectivo', label: 'Efectivo', icon: '💵' },
  { id: 'tarjeta', label: 'Tarjeta', icon: '💳' },
  { id: 'transfer', label: 'Transferencia', icon: '📱' },
  { id: 'pagomovil', label: 'Pago Móvil', icon: '📱' },
]

function PaymentModal({ totals, onClose, onConfirm }) {
  const [method, setMethod] = useState('efectivo')

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-product">
          <div className="modal-icon">💰</div>
          <div className="modal-name">Confirmar Pago</div>
          <div className="modal-price">
            Total: ${formatCurrency(totals.totalUSD)} / Bs {formatCurrency(totals.totalBS)}
          </div>
        </div>
        <div className="payment-options">
          {paymentOptions.map((opt) => (
            <div
              key={opt.id}
              className={`payment-option ${method === opt.id ? 'selected' : ''}`}
              onClick={() => setMethod(opt.id)}
            >
              <div className="pay-icon">{opt.icon}</div>
              <div className="pay-label">{opt.label}</div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Volver
          </button>
          <button className="btn-confirm" onClick={() => onConfirm(method)}>
            ✅ Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
