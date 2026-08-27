import { useEffect, useState } from 'react'
import { getProducts, addProduct, updateProduct, deleteProduct, seedProducts } from '../utils/db'
import { getCategories } from '../utils/categories'
import { defaultProducts } from '../data/products'
import { getRamoPorId } from '../data/ramos'
import { formatCurrency } from '../utils/format'
import './Products.css'

const EMPTY_PRODUCT = {
  name: '',
  icon: '🍎',
  group: 'frutas',
  um: 'kg',
  price: '',
  stockMin: '',
  puntoPedido: '',
  ramo: 'fruteria',
}

const ICONS = [
  '🍎', '🍊', '🍌', '🍇', '🍓', '🍍', '🍉', '🥭', '🍈', '🍋', '🥑', '🥬', '🍅', '🧅', '🥕', '🥒', '🥔', '🫑', '🧄', '🏷️', '📦'
]

// Convierte un valor de formulario a número >= 0; '' / inválido → null.
function numberOrNull(value) {
  if (value == null || value === '') return null
  const n = parseFloat(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export default function Products({ onClose, ramoId, tasa }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const emptyForm = () => ({ ...EMPTY_PRODUCT, ramo: ramoId || 'fruteria', priceBs: '' })
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  async function loadProducts() {
    try {
      const list = await getProducts()
      setProducts(
        list
          .filter((p) => p.ramo === ramoId)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
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
        list
          .filter((c) => c.ramo === ramoId)
          .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name))
      )
    } catch (error) {
      alert('Error al cargar categorías: ' + error.message)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const num = parseFloat(value)
    if (name === 'price') {
      const priceBs = !Number.isNaN(num) && tasa > 0 ? Math.round(num * tasa * 100) / 100 : ''
      setForm((prev) => ({ ...prev, price: value, priceBs }))
    } else if (name === 'priceBs') {
      const price = !Number.isNaN(num) && tasa > 0 ? Math.round((num / tasa) * 100) / 100 : ''
      setForm((prev) => ({ ...prev, priceBs: value, price }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.ramo) {
      alert('Debe seleccionar un Ramo Comercial.')
      return
    }
    const { priceBs, ...rest } = form
    const product = {
      ...rest,
      price: parseFloat(form.price) || 0,
      // Campos de stock como número >= 0; vacío o inválido → null (sin definir).
      stockMin: numberOrNull(form.stockMin),
      puntoPedido: numberOrNull(form.puntoPedido),
    }

    try {
      if (editingId) {
        await updateProduct({ ...product, id: editingId })
      } else {
        await addProduct(product)
      }
      await loadProducts()
      setForm(emptyForm())
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
      priceBs: tasa > 0 ? Math.round(product.price * tasa * 100) / 100 : '',
      stockMin: product.stockMin != null ? String(product.stockMin) : '',
      puntoPedido: product.puntoPedido != null ? String(product.puntoPedido) : '',
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
    setForm(emptyForm())
    setEditingId(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    setForm(emptyForm())
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
                        {product.ramo ? ` · ${getRamoPorId(product.ramo)?.name || product.ramo}` : ''}
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
          <div className="products-form-panel products-form-panel-top">
            <form className="products-form" onSubmit={handleSubmit}>
              <label className="products-field-label">Nombre Producto</label>
              <input
                name="name"
                type="text"
                placeholder="Nombre del producto"
                value={form.name}
                onChange={handleChange}
                required
              />

              <div className="products-field-grid">
                <div className="products-field">
                  <label className="products-field-label">Categoría</label>
                  <select name="group" value={form.group} onChange={handleChange}>
                    <option value="">Sin categoría</option>
                    {categories
                      .filter((cat) => cat.ramo === ramoId)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="products-field">
                  <label className="products-field-label">Unidad Medida</label>
                  <select name="um" value={form.um} onChange={handleChange}>
                    <option value="kg">kg</option>
                    <option value="unidad">unidad</option>
                  </select>
                </div>

                <div className="products-field">
                  <label className="products-field-label">Precio UM ($)</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="products-field">
                  <label className="products-field-label">Precio UM (Bs)</label>
                  <input
                    name="priceBs"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.priceBs}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="products-field-grid">
                <div className="products-field">
                  <label className="products-field-label">Stock mínimo</label>
                  <input
                    name="stockMin"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={form.stockMin}
                    onChange={handleChange}
                  />
                </div>

                <div className="products-field">
                  <label className="products-field-label">Punto de pedido</label>
                  <input
                    name="puntoPedido"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={form.puntoPedido}
                    onChange={handleChange}
                  />
                </div>
              </div>

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
                  {editingId ? 'Actualizar' : 'Grabar'}
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
