import { useState } from 'react'
import { getRamoPorId } from '../data/ramos'
// import RamoSelector from './RamoSelector'
import { hashPin } from '../utils/hash'
import { tiempoRestanteSesion, bloquearSesion } from '../utils/session'
import BackupModal from './BackupModal'
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

export default function SettingsModal({ settings, onSave, onClose, onRefreshBackup, onOpenTasa }) {
  const [companyName, setCompanyName] = useState(settings.companyName || '')
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress || '')
  const [companyContact, setCompanyContact] = useState(settings.companyContact || '')
  const [companyMobile, setCompanyMobile] = useState(settings.companyMobile || '')
  const [bgColor, setBgColor] = useState(settings.bgColor || '#4a8c5e')
  const [textColor, setTextColor] = useState(settings.textColor || '#ffffff')
  const currentRamoId = settings.ramoId || ''
  const [pin, setPin] = useState('') // always start empty; hashed on save
  const hasPin = settings.pin ? true : false
  const ramoNombre = currentRamoId ? (getRamoPorId(currentRamoId)?.name || '') : ''
  const [showBackup, setShowBackup] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [openSection, setOpenSection] = useState(null)
  const [showPin, setShowPin] = useState(false)
  const [sessionHoras, setSessionHoras] = useState(settings.sessionHoras ?? 8)
  const [sessionMinutos, setSessionMinutos] = useState(settings.sessionMinutos ?? 0)
  const [sesionInfo, setSesionInfo] = useState(tiempoRestanteSesion)

  const handleSave = async () => {
    // If pin is empty and there was one before, clear it. Otherwise hash the new one.
    const hashedPin = pin ? await hashPin(pin) : (settings.pin || '')
    onSave({
      companyName: companyName.trim() || 'Mi Negocio',
      companyAddress: companyAddress.trim(),
      companyContact: companyContact.trim(),
      companyMobile: companyMobile.trim(),
      bgColor,
      textColor,
      ramoId: settings.ramoId || '',
      pin: hashedPin,
      sessionHoras,
      sessionMinutos,
    })
    onClose()
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-icon">⚙️</span>
            <h2>Configuración del Sistema</h2>
          </div>

          <div className="settings-body">
            <section className="settings-accordion">
              <button
                type="button"
                className="settings-accordion-trigger"
                onClick={() => setOpenSection(openSection === 'empresa' ? null : 'empresa')}
                aria-expanded={openSection === 'empresa'}
              >
                <strong>LA EMPRESA</strong><span className={openSection === 'empresa' ? 'open' : ''}>⌄</span>
              </button>
              {openSection === 'empresa' && (
                <div className="settings-accordion-content">
                  <div className="company-settings-card">
                    <label className="settings-field">
                      <span>Nombre</span>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ej: Frutería Doña Ana" autoFocus />
                    </label>
                    <label className="settings-field">
                      <span>Dirección fiscal</span>
                      <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} rows={3} placeholder="Dirección fiscal de la empresa" />
                    </label>
                    <label className="settings-field">
                      <span>Contacto</span>
                      <input type="text" value={companyContact} onChange={(e) => setCompanyContact(e.target.value)} placeholder="Persona de contacto" />
                    </label>
                    <label className="settings-field">
                      <span>Móvil</span>
                      <input type="tel" value={companyMobile} onChange={(e) => setCompanyMobile(e.target.value)} placeholder="Ej: 0412-1234567" />
                    </label>
                    <label className="settings-field">
                      <span>Ramo comercial</span>
                      <input type="text" value={ramoNombre || currentRamoId || 'No establecido.'} readOnly className="settings-field-readonly" />
                    </label>
                  </div>
                </div>
              )}
            </section>

            <section className="settings-accordion">
              <button type="button" className="settings-accordion-trigger" onClick={() => setOpenSection(openSection === 'tasas' ? null : 'tasas')} aria-expanded={openSection === 'tasas'}><strong>TASAS BCV</strong><span className={openSection === 'tasas' ? 'open' : ''}>⌄</span></button>
              {openSection === 'tasas' && <div className="settings-accordion-content"><button type="button" className="settings-admin-btn" onClick={onOpenTasa}><span className="settings-admin-btn-icon">📈</span><div className="settings-admin-btn-text"><strong>Gestionar tasas BCV</strong><span>Registrar y consultar el histórico de tasas</span></div><span className="settings-admin-btn-arrow">›</span></button></div>}
            </section>

            <section className="settings-accordion">
              <button type="button" className="settings-accordion-trigger" onClick={() => setOpenSection(openSection === 'seguridad' ? null : 'seguridad')} aria-expanded={openSection === 'seguridad'}><strong>SEGURIDAD</strong><span className={openSection === 'seguridad' ? 'open' : ''}>⌄</span></button>
              {openSection === 'seguridad' && <div className="settings-accordion-content">
                <div className="utility-pin-settings">
                  <label className="settings-field">
                    <span>PIN de administrador {hasPin ? <span className="pin-set-badge">✓ Configurado</span> : ''}</span>
                    <div className="pin-input-row">
                      <input type={showPin ? 'text' : 'password'} inputMode="numeric" pattern="[0-9]*" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={hasPin ? 'Escriba para cambiar el PIN' : 'Mín. 4, máx. 6 dig.'} className="pin-input" />
                      <button type="button" className="pin-toggle-btn" onClick={() => setShowPin(!showPin)} aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}>{showPin ? '🙈' : '👁️'}</button>
                    </div>
                    {pin && pin.length < 4 && <span className="pin-hint">Mín. 4 dig.</span>}
                    <span className="settings-field-desc">Solo para entrar a Configuración.</span>
                  </label>
                </div>
                
                <div className="utility-session-settings">
                  <label className="settings-field">
                    <span>Duración de la sesión</span>
                    <div className="pin-session-row">
                      <div className="pin-duration">
                        <label>
                          <span>Horas</span>
                          <input type="number" inputMode="numeric" min={0} max={24} value={sessionHoras} onChange={(e) => setSessionHoras(Math.max(0, Math.min(24, Number(e.target.value) || 0)))} className="pin-duration-input" />
                        </label>
                        <label>
                          <span>Minutos</span>
                          <input type="number" inputMode="numeric" min={0} max={59} value={sessionMinutos} onChange={(e) => setSessionMinutos(Math.max(0, Math.min(59, Number(e.target.value) || 0)))} className="pin-duration-input" />
                        </label>
                      </div>
                      <div className="pin-duration-hint">
                        {sessionHoras === 0 && sessionMinutos === 0 ? 'Mínimo 1 minuto' : `La sesión dura ${sessionHoras}h ${sessionMinutos}m desde el PIN`}
                      </div>
                      {sesionInfo && (
                        <div className="pin-session-active">
                          <span>🔓 Desbloqueado: {sesionInfo.horas}h {sesionInfo.minutos}m restantes</span>
                          <button type="button" className="pin-lock-now-btn" onClick={() => { bloquearSesion(); setSesionInfo(null) }}>🔒 Bloquear ahora</button>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>}
            </section>

            <section className="settings-accordion">
              <button type="button" className="settings-accordion-trigger" onClick={() => setOpenSection(openSection === 'utilitarios' ? null : 'utilitarios')} aria-expanded={openSection === 'utilitarios'}><strong>UTILITARIOS</strong><span className={openSection === 'utilitarios' ? 'open' : ''}>⌄</span></button>
              {openSection === 'utilitarios' && <div className="settings-accordion-content">
                <button type="button" className="settings-admin-btn" onClick={() => setShowBackup(true)}><span className="settings-admin-btn-icon">💾</span><div className="settings-admin-btn-text"><strong>Backup</strong><span>Exportar e importar datos del sistema</span></div><span className="settings-admin-btn-arrow">›</span></button>
              <button
                type="button"
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
              </div>}
            </section>
          </div>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-confirm" onClick={handleSave}>
              Grabar
            </button>
          </div>
        </div>

        {showBackup && (
          <BackupModal
            onClose={() => setShowBackup(false)}
            onImportComplete={() => {
              setShowBackup(false)
              if (onRefreshBackup) onRefreshBackup()
              window.location.reload()
            }}
          />
        )}
      </div>
    </>
  )
}
