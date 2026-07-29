import { useEffect, useState } from 'react'
import { getCategories, addCategory, updateCategory, deleteCategory, seedCategories } from '../utils/categories'
import './Products.css'

const DEFAULT_CATEGORIES = [
  { name: 'Frutas', icon: '🍊', id: 'frutas', order: 1 },
  { name: 'Verduras', icon: '🥬', id: 'verduras', order: 2 },
  { name: 'Ofertas', icon: '🏷️', id: 'ofertas', order: 3 },
]

const EMPTY_CATEGORY = {
  name: '',
  icon: '🍊',
  id: '',
  order: 0,
}

const ICONS = ['🍎', '🍊', '🍌', '🍇', '🍓', '🍍', '🍉', '🥭', '🍈', '🍋', '🥑', '🥬', '🍅', '🧅', '🥕', '🥒', '🥔', '🫑', '🧄', '🏷️', '📦', '📂']

export default function Categories({ onClose }) {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_CATEGORY)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoading(true)
      await seedCategories(DEFAULT_CATEGORIES)
      const list = await getCategories()
      setCategories(
        list.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name))
      )
    } catch (error) {
      alert('Error al cargar categorías: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value, 10) || 0 : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const category = {
      ...form,
      id: form.id.trim().toLowerCase().replace(/\s+/g, '-'),
    }

    if (!category.id) {
      alert('El identificador es obligatorio.')
      return
    }

    try {
      if (editingId) {
        category.order = Number(form.order) || 0
        await updateCategory({ ...category, id: editingId })
      } else {
        const existing = await getCategories()
        if (existing.some((c) => c.id === category.id)) {
          alert('Ya existe una categoría con ese identificador.')
          return
        }
        category.order = existing.length + 1
        await addCategory(category)
      }
      await loadCategories()
      setForm(EMPTY_CATEGORY)
      setEditingId(null)
      setShowForm(false)
    } catch (error) {
      alert('Error al guardar categoría: ' + error.message)
    }
  }

  const moveUp = async (index) => {
    if (index === 0) return
    const reordered = [...categories]
    const temp = reordered[index]
    reordered[index] = reordered[index - 1]
    reordered[index - 1] = temp
    await persistOrder(reordered)
  }

  const moveDown = async (index) => {
    if (index === categories.length - 1) return
    const reordered = [...categories]
    const temp = reordered[index]
    reordered[index] = reordered[index + 1]
    reordered[index + 1] = temp
    await persistOrder(reordered)
  }

  async function persistOrder(reordered) {
    const withOrder = reordered.map((cat, i) => ({ ...cat, order: i + 1 }))
    try {
      for (const cat of withOrder) {
        await updateCategory(cat)
      }
      setCategories(withOrder)
    } catch (error) {
      alert('Error al reordenar: ' + error.message)
    }
  }

  const handleEdit = (category) => {
    setForm({
      name: category.name,
      icon: category.icon,
      id: category.id,
      order: category.order ?? 0,
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (error) {
      alert('Error al eliminar categoría: ' + error.message)
    }
  }

  const handleCancel = () => {
    setForm(EMPTY_CATEGORY)
    setEditingId(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    setForm(EMPTY_CATEGORY)
    setEditingId(null)
    setShowForm(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="products-modal" onClick={(e) => e.stopPropagation()}>
        <div className="products-header">
          <h2>Gestión de categorías</h2>
          <button className="products-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="products-body">
          {loading ? (
            <p className="products-empty">Cargando...</p>
          ) : categories.length === 0 ? (
            <div className="products-empty">
              <p>No hay categorías registradas.</p>
            </div>
          ) : (
            <ul className="products-list categories-list">
              {categories.map((category, index) => (
                <li
                  key={category.id}
                  className="products-item"
                >
                  <div className="categories-order-group">
                    <button
                      className="categories-order-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveUp(index)
                      }}
                      disabled={index === 0}
                      aria-label="Subir"
                    >
                      ▲
                    </button>
                    <span className="categories-order-num">{index + 1}</span>
                    <button
                      className="categories-order-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveDown(index)
                      }}
                      disabled={index === categories.length - 1}
                      aria-label="Bajar"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="products-item-info" onClick={() => handleEdit(category)} role="button" tabIndex={0}>
                    <span className="products-item-avatar">{category.icon}</span>
                    <div>
                      <strong>{category.name}</strong>
                      <span>ID: {category.id}</span>
                    </div>
                  </div>
                  <button
                    className="products-item-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(category.id)
                    }}
                    aria-label="Eliminar categoría"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="products-fab" onClick={handleAdd} aria-label="Añadir categoría">
          +
        </button>

        {showForm && (
          <div className="products-form-panel">
            <form className="products-form" onSubmit={handleSubmit}>
              <input
                name="name"
                type="text"
                placeholder="Nombre de la categoría"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                name="id"
                type="text"
                placeholder="Identificador (ej: frutas)"
                value={form.id}
                onChange={handleChange}
                disabled={!!editingId}
                required
              />

              <div className="products-icons">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`products-icon ${form.icon === icon ? 'selected' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, icon }))}
                  >
                    {icon}
                  </button>
                ))}
              </div>

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
