import { useEffect, useState } from 'react'
import { getProducts, addProduct, updateProduct, deleteProduct, seedProducts } from '../utils/db'
import { getCategories } from '../utils/categories'
import { getRamos } from '../utils/ramos'
import { defaultProducts } from '../data/products'
import { formatCurrency } from '../utils/format'
import './Products.css'

const EMPTY_PRODUCT = {
  name: '',
  icon: '🍎',
  group: 'frutas',
  um: 'kg',
  price: '',
  ramo: 'fruteria',
}

const ICONS = [
  '🍎', '🍊', '🍌', '🍇', '🍓', '🍍', '🍉', '🥭', '🍈', '🍋', '🥑', '🥬', '🍅', '🧅', '🥕', '🥒', '🥔', '🫑', '🧄', '🏷️', '📦'
]

export default function Products({ onClose }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [ramos, setRamos] = useState([])
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadProducts()
    loadCategories()
    loadRamos()
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

  async function loadCategories() {
    try {
      const list = await getCategories()
      setCategories(
        list.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name))
      )
    } catch (error) {
      alert('Error al cargar categorías: ' + error.message)
    }
  }

  async function loadRamos() {
    try {
      const list = await getRamos()
      // Sort: fruteria first
      list.sort((a, b) => {
        if (a.id === 'fruteria') return -1
        if (b.id === 'fruteria') return 1
        return a.name.localeCompare(b.name)
      })
      setRamos(list)
    } catch (error) {
      console.error('Error al cargar ramos:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.ramo) {
      alert('Debe seleccionar un Ramo Comercial.')
      return
    }
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
      ramo: product.ramo || '',
    })
    setEditingId(product.id)
    setShowForm(true)
    setSearch('')
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
    setSearch('')
  }

  const handleImportData = async () => {
    if (!confirm('¿Importar productos de ejemplo? Esto solo añade los que no existen.')) return
    setLoading(true)
    try {
      const before = await getProducts()
      const result = await seedProducts(defaultProducts)
      const after = await getProducts()
      setProducts(after.sort((a, b) => a.name.localeCompare(b.name)))
      const added = after.length - before.length
      const message = added === 0
        ? 'Todos los productos de ejemplo ya estaban registrados.'
        : `Se importaron ${added} productos de ejemplo.`
      alert(message)
    } catch (error) {
      console.error('Error al importar productos:', error)
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
              <div className="products-search">
                <span className="products-search-icon">🔍</span>
                <input
                  className="products-search-input"
                  type="text"
                  placeholder="Buscar producto…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="products-search-clear"
                    onClick={() => setSearch('')}
                    aria-label="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
              <ul className="products-list">
                {products
                  .filter((p) =>
                    search
                      ? p.name.toLowerCase().includes(search.toLowerCase())
                      : true
                  )
                  .map((product) => (
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
                        {product.group} · {product.um} · ${formatCurrency(product.price)}
                        {product.ramo ? ` · ${ramos.find((r) => r.id === product.ramo)?.name || product.ramo}` : ''}
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
                <select name="ramo" value={form.ramo} onChange={handleChange}>
                  <option value="">-- Ramo --</option>
                  {ramos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <select name="group" value={form.group} onChange={handleChange}>
                  <option value="">Sin categoría</option>
                  {categories
                    .filter((cat) => !form.ramo || cat.ramo === form.ramo)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
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
