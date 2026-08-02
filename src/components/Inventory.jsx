import { useMemo, useState } from 'react'
import './Inventory.css'

const MOCK_PRODUCTS = [
  { id: 1, icon: '🍎', name: 'Manzana',     um: 'kg',     stock: 12.5, stockMin: 5,  costoPromedio: 1.20 },
  { id: 2, icon: '🍌', name: 'Plátano',     um: 'kg',     stock: 3.2,  stockMin: 5,  costoPromedio: 0.80 },
  { id: 3, icon: '🍊', name: 'Naranja',     um: 'kg',     stock: 25.0, stockMin: 8,  costoPromedio: 0.60 },
  { id: 4, icon: '🥑', name: 'Aguacate',    um: 'kg',     stock: 0.8,  stockMin: 3,  costoPromedio: 2.50 },
  { id: 5, icon: '🍓', name: 'Fresa',       um: 'kg',     stock: 1.1,  stockMin: 2,  costoPromedio: 3.00 },
  { id: 6, icon: '🍇', name: 'Uva',         um: 'kg',     stock: 7.0,  stockMin: 3,  costoPromedio: 2.10 },
  { id: 7, icon: '🥬', name: 'Lechuga',     um: 'unidad', stock: 18,   stockMin: 10, costoPromedio: 0.50 },
  { id: 8, icon: '🍅', name: 'Tomate',      um: 'kg',     stock: 0,    stockMin: 5,  costoPromedio: 1.40 },
  { id: 9, icon: '🥕', name: 'Zanahoria',   um: 'kg',     stock: 9.5,  stockMin: 4,  costoPromedio: 0.70 },
  { id: 10, icon: '🍉', name: 'Patilla',    um: 'unidad', stock: 4,    stockMin: 2,  costoPromedio: 3.50 },
]

const MOCK_HISTORY = [
  { id: 1, productId: 1, tipo: 'entrada', cantidad: 20, motivo: 'Compra al mayorista',  timestamp: '2026-08-01T08:30:00.000Z' },
  { id: 2, productId: 2, tipo: 'venta',   cantidad: 1.8, motivo: 'Venta #042',          timestamp: '2026-08-01T10:15:00.000Z' },
  { id: 3, productId: 4, tipo: 'merma',   cantidad: 0.5, motivo: 'Dañada',              timestamp: '2026-08-01T11:00:00.000Z' },
  { id: 4, productId: 5, tipo: 'merma',   cantidad: 0.9, motivo: 'Vencida',             timestamp: '2026-08-01T12:20:00.000Z' },
  { id: 5, productId: 7, tipo: 'entrada', cantidad: 24,  motivo: 'Compra al mayorista', timestamp: '2026-08-01T14:00:00.000Z' },
  { id: 6, productId: 8, tipo: 'venta',   cantidad: 2,   motivo: 'Venta #058',          timestamp: '2026-08-01T15:45:00.000Z' },
]

const FILTERS = [
  { id: 'todo',    label: 'Todo' },
  { id: 'bajo',    label: 'Bajo' },
  { id: 'agotado', label: 'Agotado' },
]

const TIPO_BADGE = {
  entrada: { label: 'Entrada', icon: '📥' },
  venta:   { label: 'Venta',   icon: '🛒' },
  merma:   { label: 'Merma',   icon: '🗑️' },
  ajuste:  { label: 'Ajuste',  icon: '✎' },
}

function statusOf(p) {
  if (p.stock === 0) return { id: 'agotado', label: 'Agotado', cls: 'status-out' }
  if (p.stock < p.stockMin) return { id: 'bajo', label: 'Stock bajo', cls: 'status-low' }
  return { id: 'ok', label: 'OK', cls: 'status-ok' }
}

function formatQty(n, um) {
  if (um === 'unidad') return String(Math.round(n))
  return n.toFixed(1)
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function MovementForm({ type, products, onSubmit, onClose }) {
  const config = {
    entrada: { title: 'Registrar entrada', icon: '📥', showCost: true,  showReason: false, reasonDefault: 'Compra al mayorista', qtyLabel: 'Cantidad a ingresar' },
    merma:   { title: 'Registrar merma',   icon: '🗑️', showCost: false, showReason: true,  reasonDefault: '',                    qtyLabel: 'Cantidad a descontar' },
    ajuste:  { title: 'Ajustar stock',     icon: '✎',  showCost: false, showReason: true,  reasonDefault: '',                    qtyLabel: 'Cantidad (+/-)' },
  }[type]
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [cantidad, setCantidad] = useState('')
  const [costo, setCosto] = useState('')
  const [motivo, setMotivo] = useState(config.reasonDefault)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!productId || !cantidad) return
    onSubmit({ type, productId: Number(productId), cantidad: parseFloat(cantidad), costo: costo ? parseFloat(costo) : null, motivo })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="inventory-action-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>{config.icon} {config.title}</h2>
          <button className="inventory-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <form className="inventory-form" onSubmit={handleSubmit}>
          <label className="inventory-field">
            <span>Producto</span>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.icon} {p.name} ({formatQty(p.stock, p.um)} {p.um})</option>
              ))}
            </select>
          </label>
          <label className="inventory-field">
            <span>{config.qtyLabel}</span>
            <input type="number" step="0.1" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required autoFocus />
          </label>
          {config.showCost && (
            <label className="inventory-field">
              <span>Costo total ($)</span>
              <input type="number" step="0.01" min="0" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="Opcional, actualiza costo promedio" />
            </label>
          )}
          {config.showReason && (
            <label className="inventory-field">
              <span>Motivo</span>
              <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={type === 'merma' ? 'Dañada, vencida, regalo...' : 'Corrección, conteo físico...'} />
            </label>
          )}
          <div className="inventory-form-actions">
            <button type="button" className="inventory-btn inventory-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="inventory-btn inventory-btn-primary">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Inventory({ onClose }) {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [history, setHistory] = useState(MOCK_HISTORY)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todo')
  const [actionType, setActionType] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products
      .filter((p) => {
        if (!term) return true
        return p.name.toLowerCase().includes(term)
      })
      .filter((p) => {
        if (filter === 'bajo') return p.stock > 0 && p.stock < p.stockMin
        if (filter === 'agotado') return p.stock === 0
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, search, filter])

  const counts = useMemo(() => ({
    todo: products.length,
    bajo: products.filter((p) => p.stock > 0 && p.stock < p.stockMin).length,
    agotado: products.filter((p) => p.stock === 0).length,
  }), [products])

  const handleSubmitAction = ({ type, productId, cantidad, motivo }) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== productId) return p
      let next = p.stock
      if (type === 'entrada') next = p.stock + cantidad
      else if (type === 'merma') next = Math.max(0, p.stock - cantidad)
      else if (type === 'ajuste') next = Math.max(0, p.stock + cantidad)
      return { ...p, stock: next }
    }))
    setHistory((prev) => [
      { id: Date.now(), productId, tipo: type, cantidad, motivo: motivo || '—', timestamp: new Date().toISOString() },
      ...prev,
    ])
    setActionType(null)
  }

  const productName = (id) => products.find((p) => p.id === id)?.name ?? '—'
  const productIcon = (id) => products.find((p) => p.id === id)?.icon ?? '📦'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="inventory-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>📊 Inventario</h2>
          <button className="inventory-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="inventory-toolbar">
          <input
            className="inventory-search"
            type="search"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="inventory-actions">
            <button className="inventory-btn inventory-btn-primary" onClick={() => setActionType('entrada')}>+ Entrada</button>
            <button className="inventory-btn" onClick={() => setActionType('merma')}>🗑️ Merma</button>
            <button className="inventory-btn" onClick={() => setActionType('ajuste')}>✎ Ajustar</button>
          </div>
        </div>

        <div className="inventory-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`inventory-filter ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <span className="inventory-filter-count">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        <div className="inventory-body">
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>U/M</th>
                  <th className="num">Stock</th>
                  <th>Estado</th>
                  <th className="num">Costo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan="5" className="inventory-empty">Sin resultados</td></tr>
                )}
                {filtered.map((p) => {
                  const s = statusOf(p)
                  return (
                    <tr key={p.id}>
                      <td><span className="inventory-product"><span className="inventory-product-icon">{p.icon}</span>{p.name}</span></td>
                      <td>{p.um}</td>
                      <td className="num"><strong>{formatQty(p.stock, p.um)}</strong></td>
                      <td><span className={`inventory-status ${s.cls}`}>{s.label}</span></td>
                      <td className="num">${p.costoPromedio.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="inventory-history-section">
            <button className="inventory-history-toggle" onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? '▼' : '▶'} 📜 Historial de movimientos ({history.length})
            </button>
            {showHistory && (
              <ul className="inventory-history">
                {history.map((m) => {
                  const badge = TIPO_BADGE[m.tipo]
                  const sign = m.tipo === 'entrada' ? '+' : '−'
                  return (
                    <li key={m.id} className={`inventory-history-item history-${m.tipo}`}>
                      <span className="history-badge">{badge.icon} {badge.label}</span>
                      <span className="history-product">{productIcon(m.productId)} {productName(m.productId)}</span>
                      <span className="history-qty">{sign}{formatQty(m.cantidad, products.find((p) => p.id === m.productId)?.um || 'kg')}</span>
                      <span className="history-motivo">{m.motivo}</span>
                      <span className="history-time">{formatDateTime(m.timestamp)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="inventory-footer-note">UI mock — datos no persistidos</div>

        {actionType && (
          <MovementForm
            type={actionType}
            products={products}
            onSubmit={handleSubmitAction}
            onClose={() => setActionType(null)}
          />
        )}
      </div>
    </div>
  )
}
