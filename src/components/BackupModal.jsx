import { useState, useRef, useEffect } from 'react'
import { exportBackup, importBackup, previewBackup, shareBackup, restoreFromRecord } from '../utils/backupService'
import { getBackupRecords } from '../utils/db'
import PinPrompt from './PinPrompt'
import './Products.css'

const thStyle = { textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }
const tdStyle = { padding: '4px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }

export default function BackupModal({ settings = {}, onClose, onImportComplete }) {
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showPin, setShowPin] = useState(false)
  const [history, setHistory] = useState([])
  const fileInputRef = useRef(null)

  const loadHistory = async () => {
    try {
      const records = await getBackupRecords()
      const sorted = records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setHistory(sorted)
    } catch (_) {
      setHistory([])
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const showMessage = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 5000)
  }

  const reset = () => {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    try {
      const result = await exportBackup()
      showMessage(`✅ Backup descargado: ${result.filename}`)
    } catch (err) {
      showMessage('❌ Error al exportar: ' + err.message)
    }
  }

  const handleShare = async () => {
    try {
      const result = await shareBackup()
      showMessage(
        result.shared
          ? `✅ Backup enviado: ${result.filename}`
          : `✅ Backup descargado (no se pudo compartir): ${result.filename}`,
      )
    } catch (err) {
      showMessage('❌ Error al compartir: ' + err.message)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const res = await previewBackup(file)
      if (!res.valid) {
        showMessage('❌ ' + res.errors.join('; '))
      } else {
        setPreview(res)
        setSelectedFile(file)
      }
    } catch (err) {
      showMessage('❌ Error al leer el archivo: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  const requestRestore = () => {
    if (!selectedFile) return
    if (settings.pin) {
      setShowPin(true)
    } else {
      confirmRestore()
    }
  }

  const confirmRestore = async () => {
    setShowPin(false)
    setImporting(true)
    try {
      const result = await importBackup(selectedFile)
      showMessage(`✅ Backup restaurado: ${result.count} registros. El PIN volvió a 000000.`)
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (err) {
      showMessage('❌ Error al importar: ' + err.message)
      reset()
    } finally {
      setImporting(false)
    }
  }

  const handleRestoreRecord = async (recordId) => {
    setImporting(true)
    try {
      const result = await restoreFromRecord(recordId)
      showMessage(`✅ Restaurado desde historial: ${result.count} registros. El PIN volvió a 000000.`)
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (err) {
      showMessage('❌ Error al restaurar: ' + err.message)
      setImporting(false)
      loadHistory()
    }
  }

  const handleRevert = async () => {
    const snapshot = history.find((r) => r.mode === 'automatico')
    if (!snapshot) {
      showMessage('ℹ️ No hay un estado previo para revertir.')
      return
    }
    if (!snapshot.payload) {
      showMessage('⚠️ El estado previo no quedó guardado en el dispositivo.')
      return
    }
    await handleRestoreRecord(snapshot.id)
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
              Exporta todos tus datos (productos, ventas, tasas, inventario y configuración) a un
              archivo JSON. También puedes restaurar desde un backup previo.
            </p>

            {!preview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <button
                  className="products-btn products-btn-primary"
                  onClick={handleExport}
                  disabled={importing}
                >
                  📤 Exportar backup
                </button>

                <button
                  className="products-btn"
                  onClick={handleShare}
                  disabled={importing}
                >
                  📲 Compartir / enviar
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
            )}

            {preview && (
              <div style={{ marginTop: '16px' }}>
                <div className="products-backup-preview">
                  <h3 style={{ marginBottom: '8px' }}>Vista previa de la restauración</h3>
                  <p style={{ marginBottom: '8px' }}>
                    Se aplicará un <strong>reemplazo total</strong>. Esta es la lista de impactos:
                  </p>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Tienda</th>
                        <th style={thStyle}>Actual</th>
                        <th style={thStyle}>Backup</th>
                        <th style={thStyle}>Añadir</th>
                        <th style={thStyle}>Actualizar</th>
                        <th style={thStyle}>Quitar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.impacts.map((i) => (
                        <tr key={i.store}>
                          <td style={tdStyle}>{i.store}</td>
                          <td style={tdStyle}>{i.currentCount}</td>
                          <td style={tdStyle}>{i.incomingCount}</td>
                          <td style={tdStyle}>{i.added}</td>
                          <td style={tdStyle}>{i.updated}</td>
                          <td style={tdStyle}>{i.removed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {preview.localStorage.count > 0 && (
                    <p style={{ marginTop: '10px' }}>
                      ⚙️ Se reemplazará la <strong>configuración local</strong> ({preview.localStorage.keys.length} claves).
                    </p>
                  )}

                  <p style={{ marginTop: '10px', fontWeight: 600 }}>
                    ⚠️ Tras restaurar, el PIN volverá a <code>000000</code>.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    className="products-btn products-btn-primary"
                    onClick={requestRestore}
                    disabled={importing}
                  >
                    {importing ? 'Restaurando...' : '🔓 Confirmar y restaurar'}
                  </button>
                  <button className="products-btn" onClick={reset} disabled={importing}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {importing && !preview && <p style={{ textAlign: 'center', marginTop: '10px' }}>Importando...</p>}
            {message && (
              <div style={{ marginTop: '12px', textAlign: 'center', fontWeight: 600 }}>
                {message}
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '8px' }}>📜 Historial de respaldos</h3>
              {history.length === 0 ? (
                <p>Sin respaldos registrados aún.</p>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {history.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 0',
                        borderBottom: '1px solid #eee',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.filename || r.id}
                        </div>
                        <div style={{ opacity: 0.7 }}>
                          {new Date(r.createdAt).toLocaleString()} · {r.scope} · {r.mode}
                        </div>
                      </div>
                      <button
                        className="products-btn"
                        disabled={importing || !r.payload}
                        title={r.payload ? 'Restaurar desde este respaldo' : 'El archivo no está guardado en el dispositivo'}
                        onClick={() => handleRestoreRecord(r.id)}
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="products-btn"
                onClick={handleRevert}
                disabled={importing}
                style={{ marginTop: '8px' }}
              >
                ↩️ Revertir al estado previo
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPin && (
        <PinPrompt
          pin={settings.pin}
          mode="config"
          required
          onSuccess={confirmRestore}
          onClose={() => setShowPin(false)}
        />
      )}
    </div>
  )
}
