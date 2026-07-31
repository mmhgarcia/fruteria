import { useEffect, useState, useRef } from 'react'
import { getCategories, addCategory, updateCategory, deleteCategory, seedCategories } from '../utils/categories'
import { getRamoPorId } from '../data/ramos'
import './Products.css'

const EMPTY_CATEGORY = {
  name: '',
  icon: '🍊',
  id: '',
  order: 0,
}

const ICONS = ['🍎', '🍊', '🍌', '🍇', '🍓', '🍍', '🍉', '🥭', '🍈', '🍋', '🥑', '🥬', '🍅', '🧅', '🥕', '🥒', '🥔', '🫑', '🧄', '🏷️', '📦', '📂']

export default function Categories({ onClose, ramoId }) {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_CATEGORY)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const listRef = useRef(null)
  const touchDragRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const ramo = getRamoPorId(ramoId)
      if (ramo) {
        await seedCategories(ramo.categories.map((c) => ({ ...c, ramo: ramo.id })))
      }
      await loadCategories(ramoId)
    } catch (error) {
      alert('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories(filtroRamo = ramoId) {
    try {
      const list = await getCategories()
      const filtered = list.filter((c) => c.ramo === filtroRamo)
      setCategories(
        filtered.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name))
      )
    } catch (error) {
      alert('Error al cargar categorías: ' + error.message)
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
      ramo: ramoId,
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
        category.order = existing.filter((c) => c.ramo === ramoId).length + 1
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

  /* ── Drag & Drop (HTML5 + Touch) ── */

  const handleDragStart = (index) => (e) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index)
    // Small delay so the browser shows the drag feedback
    setTimeout(() => e.target.classList.add('dragging'), 0)
  }

  const handleDragOver = (index) => (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragIndex !== null && dragIndex !== index) {
      setOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setOverIndex(null)
  }

  const handleDrop = (index) => async (e) => {
    e.preventDefault()
    e.target.classList.remove('dragging')
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    await swapAndPersist(dragIndex, index)
    setDragIndex(null)
    setOverIndex(null)
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging')
    setDragIndex(null)
    setOverIndex(null)
  }

  /* ── Touch Drag & Drop ── */

  const handleTouchStart = (index) => (e) => {
    const touch = e.touches[0]
    touchDragRef.current = {
      index,
      startY: touch.clientY,
      moved: false,
    }
  }

  const handleTouchMove = (e) => {
    if (!touchDragRef.current) return
    const touch = e.touches[0]
    const dy = touch.clientY - touchDragRef.current.startY
    if (Math.abs(dy) > 10) {
      touchDragRef.current.moved = true
      e.preventDefault() // prevent scroll while dragging

      // Calculate target index based on touch position
      if (listRef.current) {
        const items = listRef.current.querySelectorAll('.products-item')
        let targetIdx = touchDragRef.current.index
        for (let i = 0; i < items.length; i++) {
          const rect = items[i].getBoundingClientRect()
          const midY = rect.top + rect.height / 2
          if (touch.clientY < midY) {
            targetIdx = i
            break
          }
          targetIdx = i
        }
        setOverIndex(targetIdx)
      }
    }
  }

  const handleTouchEnd = async () => {
    const ref = touchDragRef.current
    if (!ref) return
    if (ref.moved && overIndex !== null && overIndex !== ref.index) {
      await swapAndPersist(ref.index, overIndex)
    }
    touchDragRef.current = null
    setOverIndex(null)
  }

  async function swapAndPersist(fromIdx, toIdx) {
    const reordered = [...categories]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
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

  const moveUp = async (index) => {
    if (index === 0) return
    await swapAndPersist(index, index - 1)
  }

  const moveDown = async (index) => {
    if (index === categories.length - 1) return
    await swapAndPersist(index, index + 1)
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
              <p>No hay categorías para este ramo.</p>
            </div>
          ) : (
            <ul className="products-list categories-list" ref={listRef}>
              {categories.map((category, index) => (
                <li
                  key={category.id}
                  className={`products-item${overIndex === index ? ' drag-over' : ''}${dragIndex === index ? ' dragging' : ''}`}
                  draggable
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={handleTouchStart(index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
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
                  <div className="categories-item-content" onClick={() => handleEdit(category)} role="button" tabIndex={0}>
                    <span className="categories-drag-handle" aria-label="Arrastrar">⠿</span>
                    <span className="products-item-avatar">{category.icon}</span>
                    <div>
                      <strong>{category.name}</strong>
                      <span>ID: {category.id} · {getRamoPorId(category.ramo)?.name || category.ramo || 'Sin ramo'}</span>
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
              <div className="categories-ramo-badge">
                Ramo: <strong>{getRamoPorId(ramoId)?.name || ramoId}</strong>
              </div>

              <label className="products-field-label">Id Categoría</label>
              <input
                name="id"
                type="text"
                placeholder="ej: frutas"
                value={form.id}
                onChange={handleChange}
                disabled={!!editingId}
                required
              />

              <label className="products-field-label">Nombre Categoría</label>
              <input
                name="name"
                type="text"
                placeholder="ej: Frutas"
                value={form.name}
                onChange={handleChange}
                required
              />

              <label className="products-field-label">Icono</label>
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
                  Grabar
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
