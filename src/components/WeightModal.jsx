import { useState } from 'react'
import { formatCurrency, formatQty } from '../utils/format'
import './WeightModal.css'

const digits = [
  '7', '8', '9',
  '4', '5', '6',
  '1', '2', '3',
  '.', '0', 'clear'
]

function WeightModal({ product, tasa, onClose, onConfirm, initialQty, maxQty }) {
  const [weight, setWeight] = useState(initialQty ? String(initialQty) : '')
  const isUnit = product.um === 'unidad'

  const appendDigit = (digit) => {
    if (digit === 'clear') {
      setWeight('')
      return
    }
    // Los productos por unidad no admiten fracciones
    if (digit === '.' && isUnit) return
    if (digit === '.' && weight.includes('.')) return
    // Limitar a 3 decimales para productos por peso
    if (!isUnit && weight.includes('.')) {
      const decimals = weight.split('.')[1]
      if (decimals && decimals.length >= 3) return
    }
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

  // Límite de stock disponible. `maxQty` llega calculado desde quien abre el
  // modal (ya descontado lo que haya en el carrito). Si no llega (o es null/
  // undefined), no se limita (productos sin stock definido).
  const maxQtyNumber = typeof maxQty === 'number' && maxQty >= 0 ? maxQty : Infinity
  const overLimit = qty > 0 && qty > maxQtyNumber

  const handleConfirm = () => {
    if (qty <= 0) return
    if (overLimit) return
    onConfirm(qty)
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-product">
          <div className="modal-icon">{product.icon}</div>
          <div className="modal-name">{product.name}</div>
          <div className="modal-price">
            ${formatCurrency(product.price)} / {product.um}
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
              ? `= $${formatCurrency(totalUSD)} • Bs ${formatCurrency(totalBS)}`
              : ''}
          </div>
        </div>

        {overLimit && (
          <div className="weight-alert" role="alert">
            ⚠️ Stock disponible: {formatQty(maxQtyNumber, product.um)} {product.um}.
            Ingresa una cantidad menor o igual.
          </div>
        )}

        <div className="numpad">
          {digits.map((d) => {
            const isDot = d === '.'
            const dotDisabled = isDot && isUnit
            return (
              <button
                key={d}
                className={d === 'clear' ? 'btn-clear' : isDot ? 'btn-dot' : ''}
                onClick={() => appendDigit(d)}
                disabled={dotDisabled}
                aria-disabled={dotDisabled || undefined}
              >
                {d === 'clear' ? 'BORRAR' : d}
              </button>
            )
          })}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={qty <= 0 || overLimit}
          >
            {initialQty ? 'Actualizar' : 'Agregar al ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WeightModal
