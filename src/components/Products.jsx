import { useEffect, useState } from 'react'
import { getProducts, addProduct, updateProduct, deleteProduct, seedProducts } from '../utils/db'
import { defaultProducts } from '../data/products'
import './Products.css'

const EMPTY_PRODUCT = {
  name: '',
  icon: '🍎',
  group: 'frutas',
  um: 'kg',
  price: '',
}

const ICONS = [
  '🍎', '🍊', '🍌', '🍇', '🍓', '🍍', '🍉', '🥭', '🍈', '🍋', '🥑', '🥬', '🍅', '🧅', '🥕', '🥒', '🥔', '🫑', '🧄', '🏷️', '📦'
]

export default function Products({ onClose }) {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const list = await getProducts()
      setProducts(list.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      alert('Error al cargar productos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const product = {
      ...form,
      price: parseFloat(form.price) || 0,
    }

    try {
      if (editingId) {
        await updateProduct({ ...product, id: editingId })
      } else {
        await addProduct(product)
      }
      await loadProducts()
      setForm(EMPTY_PRODUCT)
      setEditingId(null)
    } catch (error) {
      alert('Error al guardar producto: ' + error.message)
    }
  }

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      icon: product.icon,
      group: product.group,
      um: product.um,
      price: product.price.toString(),
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await deleteProduct(id)
      await loadProducts()
    } catch (error) {
      alert('Error al eliminar producto: ' + error.message)
    }
  }

  const handleCancel = () => {
    setForm(EMPTY_PRODUCT)
    setEditingId(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    setForm(EMPTY_PRODUCT)
    setEditingId(null)
    setShowForm(true)
  }

  const handleImportData = async () => {
    if (!confirm('¿Importar productos de ejemplo? Esto no sobrescribirá los existentes.')) return
    setLoading(true)
    try {
      await seedProducts(defaultProducts)
      const list = await getProducts()
      setProducts(list.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      alert('Error al importar productos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="products-modal" onClick={(e) => e.stopPropagation()}>
        <div className="products-header">
          <h2>Gestión de productos</h2>
          <button className="products-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="products-body">
          {loading ? (
            <p className="products-empty">Cargando...</p>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <p>No hay productos registrados.</p>
              <button className="products-import-btn" onClick={handleImportData}>
                📥 Importar data
              </button>
            </div>
          ) : (
            <>
              <ul className="products-list">
                {products.map((product) => (
                  <li
                    key={product.id}
                    className="products-item"
                    onClick={() => handleEdit(product)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="products-item-avatar">{product.icon}</span>
                    <div className="products-item-info">
                      <strong>{product.name}</strong>
                      <span>
                        {product.um} · ${product.price.toFixed(2)}
                      </span>
                    </div>
                    <button
                      className="products-item-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(product.id)
                      }}
                      aria-label="Eliminar producto"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
              <button className="products-import-text-btn" onClick={handleImportData}>
                📥 Importar data de ejemplo
              </button>
            </>
          )}
        </div>

        <button className="products-fab" onClick={handleAdd} aria-label="Añadir producto">
          +
        </button>

        {showForm && (
          <div className="products-form-panel">
            <form className="products-form" onSubmit={handleSubmit}>
              <input
                name="name"
                type="text"
                placeholder="Nombre del producto"
                value={form.name}
                onChange={handleChange}
                required
              />

              <div className="products-form-row">
                <select name="group" value={form.group} onChange={handleChange}>
                  <option value="frutas">Frutas</option>
                  <option value="verduras">Verduras</option>
                  <option value="ofertas">Ofertas</option>
                </select>

                <select name="um" value={form.um} onChange={handleChange}>
                  <option value="kg">kg</option>
                  <option value="unidad">unidad</option>
                </select>

                <input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Precio ($)"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>

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
