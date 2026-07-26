import { useState } from 'react'
import { useTasas } from '../hooks/useTasas'
import './TasaBcv.css'

export default function TasaBcv({ onClose, onTasaChange }) {
  const { tasas, loading, message, create, update, remove } = useTasas()
  const [editandoId, setEditandoId] = useState(null)
  const [formData, setFormData] = useState({
    fecha_tasa: new Date().toISOString().split('T')[0],
    tasa: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.tasa || !formData.fecha_tasa) return

    const data = {
      fecha_tasa: formData.fecha_tasa,
      tasa: parseFloat(formData.tasa),
    }

    const result = editandoId
      ? await update(editandoId, data)
      : await create(data)

    if (result.success) {
      if (onTasaChange) {
        onTasaChange(data.tasa)
      }
      resetForm()
    }
  }

  const startEdit = (reg) => {
    setEditandoId(reg.id)
    setFormData({
      fecha_tasa: reg.fecha_tasa,
      tasa: reg.tasa.toString(),
    })
  }

  const resetForm = () => {
    setEditandoId(null)
    setFormData({
      fecha_tasa: new Date().toISOString().split('T')[0],
      tasa: '',
    })
  }

  const handleDelete = async (id) => {
    const result = await remove(id)
    if (result.success && editandoId === id) {
      resetForm()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tasa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tasa-header">
          <h2>📈 Gestión de Tasas BCV</h2>
          <button className="tasa-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="tasa-body">
          <form className="tasa-form" onSubmit={handleSubmit}>
            <div className="tasa-row">
              <div className="tasa-field">
                <label>Fecha de tasa</label>
                <input
                  type="date"
                  value={formData.fecha_tasa}
                  onChange={(e) => setFormData({ ...formData, fecha_tasa: e.target.value })}
                  required
                />
              </div>
              <div className="tasa-field">
                <label>Valor tasa (Bs.)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.tasa}
                  onChange={(e) => setFormData({ ...formData, tasa: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="tasa-actions">
              <button type="submit" className="tasa-btn tasa-btn-primary">
                {editandoId ? 'Actualizar' : 'Grabar'}
              </button>
              {editandoId && (
                <button type="button" className="tasa-btn" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>

            {message && <div className="tasa-message">{message}</div>}
          </form>

          <div className="tasa-list-container">
            <div className="tasa-list-header">Registros en histórico</div>
            {loading ? (
              <p className="tasa-empty">Cargando...</p>
            ) : tasas.length === 0 ? (
              <p className="tasa-empty">No hay registros en el historial.</p>
            ) : (
              <ul className="tasa-list">
                {tasas.map((reg) => (
                  <li key={reg.id} className="tasa-item">
                    <div className="tasa-item-info">
                      <strong>{reg.fecha_tasa}</strong>
                      <span>Bs. {reg.tasa.toFixed(2)}</span>
                    </div>
                    <div className="tasa-item-actions">
                      <button
                        className="tasa-item-btn"
                        onClick={() => startEdit(reg)}
                        title="Editar"
                        aria-label="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="tasa-item-btn"
                        onClick={() => handleDelete(reg.id)}
                        title="Eliminar"
                        aria-label="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
