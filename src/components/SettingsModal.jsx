import { useState, useEffect } from 'react'
import { getRamos } from '../utils/ramos'
// import RamoSelector from './RamoSelector'
import TasaBcv from '../features/TasaBcv/components/TasaBcv'
import RamosComerciales from './RamosComerciales'
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

export default function SettingsModal({ settings, onSave, onClose, onTasaChange }) {
  const [companyName, setCompanyName] = useState(settings.companyName || '')
  const [bgColor, setBgColor] = useState(settings.bgColor || '#4a8c5e')
  const [textColor, setTextColor] = useState(settings.textColor || '#ffffff')
  const ramoId = settings.ramoId || ''
  const [pin, setPin] = useState(settings.pin || '')
  const [ramoNombre, setRamoNombre] = useState('')
  const [showTasa, setShowTasa] = useState(false)
  const [showRamos, setShowRamos] = useState(false)
  const [showColors, setShowColors] = useState(false)

  // const [ramos, setRamos] = useState([]) ← dropdown
  // const [setRamoId, ] ← commented out

  const closeRamos = () => {
    setShowRamos(false)
    getRamos()
      .then((list) => {
        const found = list.find((r) => r.id === ramoId)
        if (found) setRamoNombre(found.name)
      })
      .catch(console.error)
  }

  useEffect(() => {
    if (ramoId) {
      getRamos()
        .then((list) => {
          const found = list.find((r) => r.id === ramoId)
          if (found) setRamoNombre(found.name)
        })
        .catch(console.error)
    }
  }, [ramoId])

  const handleSave = () => {
    onSave({
      companyName: companyName.trim() || 'Mi Negocio',
      bgColor,
      textColor,
      ramoId: settings.ramoId || '',
      pin,
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
            <span>Ramo Comercial Asignado</span>
            <input
              type="text"
              value={ramoNombre || ramoId || 'No establecido.'}
              readOnly
              className="settings-field-readonly"
            />
            {/* ↓ dropdown comentado
            <RamoSelector
              value={ramoId}
              onChange={setRamoId}
              ramos={ramos}
              className="settings-select"
            />
            */}
          </label>

          <label className="settings-field">
            <span>PIN de administrador</span>
            <div className="pin-input-row">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Mín. 4, máx. 6 dígitos"
                className="pin-input"
              />
              {pin && pin.length < 4 && (
                <span className="pin-hint">Mín. 4 dígitos</span>
              )}
            </div>
            <span className="settings-field-desc">
              Vacío = sin PIN. Protege acceso a Productos, Categorías, Tasa y Ramos
            </span>
          </label>

          <hr className="settings-divider" />

          <div className="settings-section-group">

            <h3 className="settings-admin-title">Administración</h3>

            <button
              className="settings-admin-btn"
              onClick={() => setShowTasa(true)}
            >
              <span className="settings-admin-btn-icon">💱</span>
              <div className="settings-admin-btn-text">
                <strong>Tasa BCV</strong>
                <span>Registrar y gestionar tasas de cambio</span>
              </div>
              <span className="settings-admin-btn-arrow">›</span>
            </button>

            <button
              className="settings-admin-btn"
              onClick={() => setShowRamos(true)}
            >
              <span className="settings-admin-btn-icon">🏪</span>
              <div className="settings-admin-btn-text">
                <strong>Ramos Comerciales</strong>
                <span>Crear y gestionar ramos del negocio</span>
              </div>
              <span className="settings-admin-btn-arrow">›</span>
            </button>
          </div>

          <hr className="settings-divider" />

          <div className="settings-section-group">
            <button
              className="settings-toggle-btn"
              onClick={() => setShowColors(!showColors)}
            >
              <span className="settings-toggle-btn-icon">🎨</span>
              <div className="settings-toggle-btn-text">
                <strong>Personalizar colores</strong>
                <span>Fondo, texto y paletas del POS</span>
              </div>
              <span className={`settings-toggle-btn-arrow ${showColors ? 'open' : ''}`}>▼</span>
            </button>

            {showColors && (
              <div className="settings-toggle-content">
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
            )}
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

      {showTasa && (
        <TasaBcv
          onClose={() => setShowTasa(false)}
          onTasaChange={onTasaChange}
        />
      )}

      {showRamos && (
        <RamosComerciales
          onClose={closeRamos}
        />
      )}
    </div>
  )
}
