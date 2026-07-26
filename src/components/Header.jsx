import { useState } from 'react'
import CartModal from './CartModal'
import './Header.css'

function Header({
  cartCount,
  totalUSD,
  totalBS,
  tasa,
  onTasaChange,
  searchTerm,
  onSearchChange,
  onMenuToggle,
  cart,
  totals,
  onRemoveItem,
}) {
  const [listening, setListening] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  const handleTasaChange = (e) => {
    const value = parseFloat(e.target.value)
    onTasaChange(value > 0 ? value : 36.5)
  }

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-VE'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onSearchChange(transcript)
    }
    recognition.onerror = () => setListening(false)

    recognition.start()
  }

  return (
    <>
      <header className="header">
        <div className="header-top">
          <button
            className="menu-btn"
            onClick={onMenuToggle}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <button
            className={`mic-btn ${listening ? 'listening' : ''}`}
            onClick={toggleMic}
            aria-label="Buscar por voz"
          >
            🎤
          </button>
          <input
            type="text"
            className="search-box"
            placeholder="Ej: 2 manzanas / ¿quedan plátanos?"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="header-stats">
          <div className="stat-group">
            <span className="icon">�</span>
            <span>Tasa $:</span>
            <input
              type="number"
              className="tasa-input"
              value={tasa.toFixed(2)}
              step="0.01"
              onChange={handleTasaChange}
            />
          </div>
          <div className="stat-group">
            <span className="icon">🛒</span>
            <button
              className="cart-badge"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir carrito con ${cartCount} items`}
            >
              {cartCount}
            </button>
          </div>
        </div>
      </header>

      {cartOpen && (
        <CartModal
          cart={cart}
          totals={{ totalUSD, totalBS }}
          onClose={() => setCartOpen(false)}
          onRemoveItem={(idx) => {
            onRemoveItem(idx)
          }}
        />
      )}
    </>
  )
}

export default Header
