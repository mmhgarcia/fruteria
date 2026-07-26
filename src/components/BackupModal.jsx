import { useState, useRef } from 'react'
import { exportBackup, importBackup } from '../utils/backupService'
import './Products.css'

export default function BackupModal({ onClose, onImportComplete }) {
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)

  const showMessage = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  const handleExport = async () => {
    try {
      await exportBackup()
      showMessage('✅ Backup descargado')
    } catch (err) {
      showMessage('❌ Error al exportar: ' + err.message)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const result = await importBackup(file)
      showMessage(`✅ Backup importado: ${result.count} registros`)
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (err) {
      showMessage('❌ Error al importar: ' + err.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="products-modal" onClick={(e) => e.stopPropagation()}>
        <div className="products-header">
          <h2>💾 Backup de datos</h2>
          <button className="products-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="products-body">
          <div className="products-empty" style={{ textAlign: 'left', alignItems: 'stretch' }}>
            <p>
              Exporta todos tus datos (productos, categorías, tasas) a un archivo JSON.
              También puedes restaurar desde un backup previo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <button
                className="products-btn products-btn-primary"
                onClick={handleExport}
                disabled={importing}
              >
                📤 Exportar backup
              </button>

              <label className="products-btn" style={{ cursor: 'pointer', textAlign: 'center' }}>
                📥 Importar backup
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={importing}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {importing && <p style={{ textAlign: 'center', marginTop: '10px' }}>Importando...</p>}
            {message && (
              <div style={{ marginTop: '12px', textAlign: 'center', fontWeight: 600 }}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
