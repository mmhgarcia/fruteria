import { useState } from 'react'
import { formatCurrency } from '../utils/format'
import './PaymentModal.css'

const paymentOptions = [
  { id: 'pagomovil', label: 'Pago Móvil', icon: '📱' },
  { id: 'divisa', label: 'Divisa', icon: '💵' },
  { id: 'debito', label: 'Débito', icon: '💳' },
  { id: 'transfer', label: 'Transferencia', icon: '🏦' },
]

function PaymentModal({ totals, onClose, onConfirm }) {
  const [method, setMethod] = useState('pagomovil')
  const [cashUSD, setCashUSD] = useState('')
  const [cashBS, setCashBS] = useState('')
  const [referencia, setReferencia] = useState('')
  const [banco, setBanco] = useState('')
  const isDivisa = method === 'divisa'
  const isPagoMovil = method === 'pagomovil'

  const today = new Date()
  const fechaStr = today.toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  const handleConfirm = () => {
    onConfirm(method, cashUSD, cashBS, referencia, banco)
  }

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
              onClick={() => {
                setMethod(opt.id)
                setCashUSD('')
                setCashBS('')
                setReferencia('')
                setBanco('')
              }}
            >
              <div className="pay-icon">{opt.icon}</div>
              <div className="pay-label">{opt.label}</div>
            </div>
          ))}
        </div>

        {isDivisa && (
          <div className="cash-fields">
            <div className="cash-field">
              <label className="cash-label">Efectivo recibido $</label>
              <div className="cash-input-wrap">
                <span className="cash-prefix">$</span>
                <input
                  type="number"
                  className="cash-input"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  value={cashUSD}
                  onChange={(e) => setCashUSD(e.target.value)}
                />
              </div>
            </div>
            <div className="cash-field">
              <label className="cash-label">Efectivo recibido Bs</label>
              <div className="cash-input-wrap">
                <span className="cash-prefix">Bs</span>
                <input
                  type="number"
                  className="cash-input"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  value={cashBS}
                  onChange={(e) => setCashBS(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {isPagoMovil && (
          <div className="pm-form">
            <div className="pm-field">
              <label className="cash-label">Fecha</label>
              <div className="pm-static">{fechaStr}</div>
            </div>
            <div className="pm-field">
              <label className="cash-label">Referencia</label>
              <div className="cash-input-wrap">
                <input
                  type="text"
                  className="cash-input"
                  placeholder="Número de referencia"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                />
              </div>
            </div>
            <div className="pm-field">
              <label className="cash-label">Banco</label>
              <div className="cash-input-wrap">
                <input
                  type="text"
                  className="cash-input"
                  placeholder="Nombre del banco"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                />
              </div>
            </div>
            <div className="pm-field">
              <label className="cash-label">Monto</label>
              <div className="pm-static monto">Bs {formatCurrency(totals.totalBS)}</div>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Volver
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            ✅ Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
