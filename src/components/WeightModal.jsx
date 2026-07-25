import { useState } from 'react'
import './WeightModal.css'

const digits = [
  '7', '8', '9',
  '4', '5', '6',
  '1', '2', '3',
  '.', '0', 'clear'
]

function WeightModal({ product, tasa, onClose, onConfirm }) {
  const [weight, setWeight] = useState('')

  const appendDigit = (digit) => {
    if (digit === 'clear') {
      setWeight('')
      return
    }
    if (digit === '.' && weight.includes('.')) return
    if (weight === '' && digit === '.') {
      setWeight('0.')
      return
    }
    if (weight === '0' && digit !== '.') {
      setWeight(digit)
      return
    }
    setWeight((prev) => prev + digit)
  }

  const qty = parseFloat(weight) || 0
  const totalUSD = qty * product.price
  const totalBS = totalUSD * tasa

  const handleConfirm = () => {
    if (qty <= 0) return
    onConfirm(qty)
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-product">
          <div className="modal-icon">{product.icon}</div>
          <div className="modal-name">{product.name}</div>
          <div className="modal-price">
            ${product.price.toFixed(2)} / {product.um}
          </div>
        </div>
        <div className="weight-display">
          <div className="weight-label">{product.um === 'unidad' ? 'CANTIDAD' : 'PESO'}</div>
          <div>
            <span className="weight-value">{weight || '0'}</span>
            <span className="weight-unit">&nbsp;{product.um}</span>
          </div>
          <div className="weight-preview">
            {qty > 0
              ? `= $${totalUSD.toFixed(2)} • Bs ${totalBS.toFixed(2)}`
              : ''}
          </div>
        </div>
        <div className="numpad">
          {digits.map((d) => (
            <button
              key={d}
              className={d === 'clear' ? 'btn-clear' : d === '.' ? 'btn-dot' : ''}
              onClick={() => appendDigit(d)}
            >
              {d === 'clear' ? 'BORRAR' : d}
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={qty <= 0}
          >
            Agregar al ticket
          </button>
        </div>
      </div>
    </div>
  )
}

export default WeightModal
