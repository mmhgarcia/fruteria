import { useEffect, useState } from 'react'
import { getRamos, addRamo, updateRamo, deleteRamo } from '../utils/ramos'
import './Products.css'

const EMPTY_RAMO = {
  name: '',
  id: '',
  activo: true,
}

export default function RamosComerciales({ onClose }) {
  const [ramos, setRamos] = useState([])
  const [form, setForm] = useState(EMPTY_RAMO)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRamos()
  }, [])

  async function loadRamos() {
    try {
      setLoading(true)
      const list = await getRamos()
      setRamos(list.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      alert('Error al cargar ramos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ramo = {
      ...form,
      id: form.id.trim().toLowerCase().replace(/\s+/g, '-'),
    }

    if (!ramo.id) {
      alert('El identificador es obligatorio.')
      return
    }

    try {
      if (editingId) {
        await updateRamo({ ...ramo, id: editingId })
      } else {
        const existing = await getRamos()
        if (existing.some((r) => r.id === ramo.id)) {
          alert('Ya existe un ramo con ese identificador.')
          return
        }
        await addRamo(ramo)
      }
      await loadRamos()
      setForm(EMPTY_RAMO)
      setEditingId(null)
      setShowForm(false)
    } catch (error) {
      alert('Error al guardar ramo: ' + error.message)
    }
  }

  const handleEdit = (ramo) => {
    setForm({
      name: ramo.name,
      id: ramo.id,
      activo: ramo.activo,
    })
    setEditingId(ramo.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ramo?')) return
    try {
      await deleteRamo(id)
      await loadRamos()
    } catch (error) {
      alert('Error al eliminar ramo: ' + error.message)
    }
  }

  const handleCancel = () => {
    setForm(EMPTY_RAMO)
    setEditingId(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    setForm(EMPTY_RAMO)
    setEditingId(null)
    setShowForm(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="products-modal" onClick={(e) => e.stopPropagation()}>
        <div className="products-header">
          <h2>Gestión de Ramos Comerciales</h2>
          <button className="products-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="products-body">
          {loading ? (
            <p className="products-empty">Cargando...</p>
          ) : ramos.length === 0 ? (
            <div className="products-empty">
              <p>No hay ramos registrados.</p>
            </div>
          ) : (
            <ul className="products-list">
              {ramos.map((ramo) => (
                <li
                  key={ramo.id}
                  className="products-item"
                  onClick={() => handleEdit(ramo)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="products-item-avatar">
                    {ramo.activo ? '✅' : '⛔'}
                  </span>
                  <div className="products-item-info">
                    <strong>{ramo.name}</strong>
                    <span>
                      ID: {ramo.id} · {ramo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <button
                    className="products-item-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(ramo.id)
                    }}
                    aria-label="Eliminar ramo"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="products-fab" onClick={handleAdd} aria-label="Añadir ramo">
          +
        </button>

        {showForm && (
          <div className="products-form-panel">
            <form className="products-form" onSubmit={handleSubmit}>
              <input
                name="name"
                type="text"
                placeholder="Nombre del ramo"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                name="id"
                type="text"
                placeholder="Identificador (ej: carniceria)"
                value={form.id}
                onChange={handleChange}
                disabled={!!editingId}
                required
              />

              <label className="ramos-toggle">
                <input
                  name="activo"
                  type="checkbox"
                  checked={form.activo}
                  onChange={handleChange}
                />
                <span>Ramo activo</span>
              </label>

              <div className="products-actions">
                <button type="submit" className="products-btn products-btn-primary">
                  {editingId ? 'Actualizar' : 'Añadir'}
                </button>
                <button type="button" className="products-btn" onClick={handleCancel}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
