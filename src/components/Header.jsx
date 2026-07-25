import { useState } from 'react'
import './Header.css'

function Header({
  cartCount,
  totalUSD,
  totalBS,
  tasa,
  onTasaChange,
  searchTerm,
  onSearchChange,
}) {
  const [listening, setListening] = useState(false)

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
    <header className="header">
      <div className="header-top">
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
          <span className="icon">🛒</span>
          <span>
            Items: <span className="value">{cartCount}</span>
          </span>
        </div>
        <div className="stat-group">
          <span className="icon">💰</span>
          <span>Tasa $:</span>
          <input
            type="number"
            className="tasa-input"
            value={tasa.toFixed(2)}
            step="0.01"
            onChange={handleTasaChange}
          />
        </div>
      </div>
      <div className="header-stats" style={{ marginTop: 6 }}>
        <div className="stat-group">
          <span>
            Total $: <span className="value">{totalUSD.toFixed(2)}</span>
          </span>
        </div>
        <div className="stat-group">
          <span>
            Total Bs: <span className="value">{totalBS.toFixed(2)}</span>
          </span>
        </div>
      </div>
    </header>
  )
}

export default Header
