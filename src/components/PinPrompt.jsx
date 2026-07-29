import { useState, useRef, useEffect } from 'react'
import './PinPrompt.css'

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
]

export default function PinPrompt({ pin, onSuccess, onClose }) {
  const [digits, setDigits] = useState([])
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const handleKey = (key) => {
    if (key === '⌫') {
      setDigits((prev) => prev.slice(0, -1))
      setError(false)
      return
    }
    if (digits.length >= 6) return
    const next = [...digits, key]
    setDigits(next)
    setError(false)

    // Auto-check when enough digits entered
    if (next.length >= 4) {
      const entered = next.join('')
      if (entered === pin) {
        setDigits([])
        onSuccess()
      } else if (next.length >= pin.length || next.length === 6) {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setDigits([])
          setShake(false)
        }, 600)
      }
    }
  }

  const displayLen = Math.max(pin.length || 4, 4)
  const display = digits.join('').padEnd(displayLen, '○')

  return (
    <div className="modal-overlay pin-overlay" onClick={onClose}>
      <div className="pin-prompt" onClick={(e) => e.stopPropagation()}>
        <div className="pin-prompt-header">
          <span className="pin-prompt-icon">🔒</span>
          <h2>Acceso a Configuración</h2>
          <button className="pin-prompt-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="pin-prompt-body">
          <p className="pin-prompt-desc">Ingrese el PIN de administrador</p>

          <div className={`pin-display ${shake ? 'shake' : ''} ${error ? 'error' : ''}`}>
            {display.split('').map((ch, i) => (
              <span key={i} className={`pin-dot ${ch !== '○' ? 'filled' : ''}`}>
                {ch === '○' ? '○' : '●'}
              </span>
            ))}
          </div>

          {error && <p className="pin-error">PIN incorrecto</p>}

          <div className="pin-keypad">
            {KEYS.map((row, ri) => (
              <div key={ri} className="pin-keypad-row">
                {row.map((key) =>
                  key === '' ? (
                    <span key="empty" className="pin-key-placeholder" />
                  ) : (
                    <button
                      key={key}
                      className={`pin-key ${key === '⌫' ? 'pin-key-backspace' : ''}`}
                      onClick={() => handleKey(key)}
                      aria-label={key === '⌫' ? 'Borrar' : key}
                    >
                      {key === '⌫' ? '⌫' : key}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
