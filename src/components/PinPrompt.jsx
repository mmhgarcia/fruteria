import { useState, useRef, useEffect } from 'react'
import { hashPin } from '../utils/hash'
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

  // Detecta si el PIN almacenado ya está hasheado (64 chars hex) o es texto plano
  const isHashed = pin && /^[0-9a-f]{64}$/.test(pin)
  // Longitud real del PIN (solo se sabe si es texto plano)
  const pinLength = isHashed ? 6 : (pin ? pin.length : 4)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const handleKey = async (key) => {
    if (key === '⌫') {
      setDigits((prev) => prev.slice(0, -1))
      setError(false)
      return
    }
    if (digits.length >= 6) return
    const next = [...digits, key]
    setDigits(next)
    setError(false)

    // Auto-check al alcanzar la longitud esperada
    if (next.length >= Math.min(pinLength, 4)) {
      const entered = next.join('')
      const enteredHash = await hashPin(entered)
      if (enteredHash === pin || entered === pin) {
        // PIN correcto (hash o texto plano legacy)
        setDigits([])
        onSuccess()
        return
      }
      // PIN incorrecto → mostrar error si ya completó todos los dígitos
      if (next.length === pinLength || next.length === 6) {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setDigits([])
          setShake(false)
        }, 600)
      }
    }
  }

  const displayLen = pinLength
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
