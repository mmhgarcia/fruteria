import { useState, useRef, useEffect } from 'react'
import { hashPin } from '../utils/hash'
import { addLog, LOG_TYPES } from '../utils/logService'
import {
  getBloqueoFuerzaBruta,
  bloquearFuerzaBruta,
  PIN_CONFIG,
} from '../utils/session'
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
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [bloqueadoHasta, setBloqueadoHasta] = useState(getBloqueoFuerzaBruta)
  const ref = useRef(null)
  const loggedRef = useRef(false)

  // Detecta si el PIN almacenado ya está hasheado (64 chars hex) o es texto plano
  const isHashed = pin && /^[0-9a-f]{64}$/.test(pin)
  // Longitud real del PIN (solo se sabe si es texto plano)
  const pinLength = isHashed ? 6 : (pin ? pin.length : 4)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  // Cuenta regresiva del bloqueo por fuerza bruta
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!bloqueadoHasta) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [bloqueadoHasta])

  useEffect(() => {
    if (bloqueadoHasta && bloqueadoHasta <= new Date()) {
      setBloqueadoHasta(null)
      setFailedAttempts(0)
      loggedRef.current = false
    }
  }, [now, bloqueadoHasta])

  const segundosRestantes = bloqueadoHasta
    ? Math.max(0, Math.ceil((bloqueadoHasta - new Date()) / 1000))
    : 0

  const handleKey = async (key) => {
    if (bloqueadoHasta) return
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
        setFailedAttempts(0)
        loggedRef.current = false
        onSuccess()
        return
      }
      // PIN incorrecto → mostrar error si ya completó todos los dígitos
      if (next.length === pinLength || next.length === 6) {
        const newFailed = failedAttempts + 1
        setFailedAttempts(newFailed)
        setError(true)
        setShake(true)

        // 3 intentos fallidos → log tipo ALERT + bloqueo de fuerza bruta
        if (newFailed >= PIN_CONFIG.MAX_INTENTOS) {
          if (!loggedRef.current) {
            loggedRef.current = true
            addLog(LOG_TYPES.ALERT, 'Acceso no autorizado - 3 intentos fallidos de PIN', {
              failedAttempts: newFailed,
              intentos: newFailed,
              pinIngresado: entered,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
            })
          }
          bloquearFuerzaBruta()
          setBloqueadoHasta(getBloqueoFuerzaBruta())
          setDigits([])
          setError(false)
          setShake(false)
          setFailedAttempts(0)
          return
        }

        setTimeout(() => {
          setDigits([])
          setShake(false)
        }, 600)
      }
    }
  }

  const handleClose = () => {
    setFailedAttempts(0)
    loggedRef.current = false
    onClose()
  }

  const displayLen = pinLength
  const display = digits.join('').padEnd(displayLen, '○')

  return (
    <div className="modal-overlay pin-overlay" onClick={handleClose}>
      <div className="pin-prompt" onClick={(e) => e.stopPropagation()}>
        <div className="pin-prompt-header">
          <span className="pin-prompt-icon">🔒</span>
          <h2>Acceso a Configuración</h2>
          <button className="pin-prompt-close" onClick={handleClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="pin-prompt-body">
          <p className="pin-prompt-desc">Ingrese el PIN de administrador</p>

          {bloqueadoHasta ? (
            <>
              <div className="pin-blocked">
                🔒 Demasiados intentos fallidos
              </div>
              <div className="pin-blocked-countdown">
                Intente de nuevo en {Math.floor(segundosRestantes / 60)}:{String(segundosRestantes % 60).padStart(2, '0')}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
