import { useState, useEffect } from 'react'
import { getRamos } from '../utils/ramos'
import './SettingsModal.css'

const COLOR_PRESETS = [
  { label: 'Verde frutería', bg: '#4a8c5e', text: '#ffffff' },
  { label: 'Azul marino', bg: '#1a2a44', text: '#ffffff' },
  { label: 'Pizarra oscura', bg: '#1e293b', text: '#ffffff' },
  { label: 'Café tierra', bg: '#5c4033', text: '#ffffff' },
  { label: 'Uva/vino', bg: '#6b2e4a', text: '#ffffff' },
  { label: 'Gris elegante', bg: '#334155', text: '#ffffff' },
  { label: 'Azul cielo', bg: '#2c6e9c', text: '#ffffff' },
  { label: 'Verde oliva', bg: '#556b2f', text: '#ffffff' },
]

export default function SettingsModal({ settings, onSave, onClose }) {
  const [companyName, setCompanyName] = useState(settings.companyName || '')
  const [bgColor, setBgColor] = useState(settings.bgColor || '#4a8c5e')
  const [textColor, setTextColor] = useState(settings.textColor || '#ffffff')
  const [ramoId, setRamoId] = useState(settings.ramoId || '')
  const [ramos, setRamos] = useState([])

  useEffect(() => {
    getRamos()
      .then((list) => {
        setRamos(list.sort((a, b) => a.name.localeCompare(b.name)))
        // If no ramo selected yet and we have ramos, set first as default
        if (!settings.ramoId && list.length > 0) {
          setRamoId(list[0].id)
        }
      })
      .catch(console.error)
  }, [])

  const handleSave = () => {
    onSave({
      companyName: companyName.trim() || 'Mi Negocio',
      bgColor,
      textColor,
      ramoId,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">⚙️</span>
          <h2>Configuración del Sistema</h2>
        </div>

        <div className="settings-body">
          <label className="settings-field">
            <span>Nombre de la empresa</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Frutería Doña Ana"
              autoFocus
            />
          </label>

          <label className="settings-field">
            <span>Ramo Comercial</span>
            <select
              className="settings-select"
              value={ramoId}
              onChange={(e) => setRamoId(e.target.value)}
            >
              <option value="">-- Seleccionar Ramo --</option>
              {ramos.map((r) => (
                <option key={r.id} value={r.id} disabled={!r.activo}>
                  {r.activo ? '' : '⛔ '}{r.name}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-field">
            <span>Color de fondo del POS</span>
            <div className="color-input-row">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="color-hex"
                placeholder="#4a8c5e"
              />
            </div>
          </label>

          <label className="settings-field">
            <span>Color del texto del POS</span>
            <div className="color-input-row">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="color-hex"
                placeholder="#ffffff"
              />
            </div>
          </label>

          <div className="settings-presets">
            <span>Paletas rápidas:</span>
            <div className="preset-grid">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className="preset-btn"
                  style={{ background: preset.bg, color: preset.text }}
                  onClick={() => {
                    setBgColor(preset.bg)
                    setTextColor(preset.text)
                  }}
                  title={preset.label}
                >
                  {preset.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-preview">
            <span>Vista previa:</span>
            <div
              className="preview-bar"
              style={{ background: bgColor, color: textColor }}
            >
              <span>☰</span>
              <span>{companyName || 'Mi Negocio'}</span>
              <span>💱 36,50</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-confirm" onClick={handleSave}>
            Guardar configuración
          </button>
        </div>
      </div>
    </div>
  )
}
