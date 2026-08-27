import { useEffect, useMemo, useState } from 'react'
import './Inventory.css'
import { getProducts } from '../utils/db'
import {
  registrarMovimiento,
  getMovimientosRecientes,
  setStockMinimo,
  getValuationMethod,
  VALUATION_LABELS,
  MOVEMENT_TYPES,
} from '../utils/inventory'
import { clasificarStock } from '../utils/stockAlerts'

const FILTERS = [
  { id: 'todo',    label: 'Todo' },
  { id: 'pedir',   label: 'Advertir' },
  { id: 'reponer', label: 'Reponer' },
  { id: 'agotado', label: 'Agotado' },
  { id: 'sin_definir', label: 'Sin definir' },
]

const STATUS_META = {
  sin_definir: { label: 'Sin definir', cls: 'status-undef' },
  agotado:     { label: 'Agotado',     cls: 'status-out' },
  reponer:     { label: 'Reponer',     cls: 'status-reponer' },
  pedir:       { label: 'Advertir',    cls: 'status-warn' },
  ok:          { label: 'OK',          cls: 'status-ok' },
}

const TIPO_BADGE = {
  entrada: { label: 'Entrada', icon: '📥' },
  venta:   { label: 'Venta',   icon: '🛒' },
  merma:   { label: 'Merma',   icon: '🗑️' },
  ajuste:  { label: 'Ajuste',  icon: '✎' },
}

function statusOf(p) {
  const id = clasificarStock(p)
  return { id, ...STATUS_META[id] }
}

function formatQty(n, um) {
  if (n == null) return '—'
  if (um === 'unidad') return String(Math.round(n))
  return Number(n).toFixed(1)
}

function formatMoney(n) {
  if (n == null) return '—'
  return `$${Number(n).toFixed(2)}`
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
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  )
  const [productId, setProductId] = useState(sortedProducts[0]?.id ?? '')
  const [cantidad, setCantidad] = useState('')
  const [costo, setCosto] = useState('')
  const [motivo, setMotivo] = useState(config.reasonDefault)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selected = sortedProducts.find((p) => String(p.id) === String(productId))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!productId || !cantidad) return
    const c = parseFloat(cantidad)
    if (!c || c <= 0) {
      setError('La cantidad debe ser mayor a 0')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        type,
        productId: Number(productId),
        cantidad: c,
        costo: costo ? parseFloat(costo) : null,
        motivo,
      })
    } catch (err) {
      setError(err.message || 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
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
              {sortedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name} (stock: {formatQty(p.stock, p.um)} {p.um})
                </option>
              ))}
            </select>
          </label>
          {selected && selected.stock != null && (
            <div className="inventory-hint">
              Stock actual: <strong>{formatQty(selected.stock, selected.um)} {selected.um}</strong>
            </div>
          )}
          <label className="inventory-field">
            <span>{config.qtyLabel}</span>
            <input
              type="number"
              step={selected?.um === 'unidad' ? '1' : '0.01'}
              min="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
              autoFocus
            />
          </label>
          {config.showCost && (
            <label className="inventory-field">
              <span>Costo total de la compra ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                placeholder="Opcional, recalcula costo promedio"
              />
            </label>
          )}
          {config.showReason && (
            <label className="inventory-field">
              <span>Motivo</span>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={type === 'merma' ? 'Dañada, vencida, regalo...' : 'Corrección, conteo físico...'}
              />
            </label>
          )}
          {error && <div className="inventory-error">{error}</div>}
          <div className="inventory-form-actions">
            <button type="button" className="inventory-btn inventory-btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="inventory-btn inventory-btn-primary" disabled={submitting}>
              {submitting ? 'Registrando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Inventory({ onClose, ramoId }) {
  const [products, setProducts] = useState([])
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todo')
  const [actionType, setActionType] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingMin, setEditingMin] = useState(null)
  const [minInput, setMinInput] = useState('')
  const [valuation, setValuation] = useState(getValuationMethod)

  async function refresh() {
    const [prods, movs] = await Promise.all([
      getProducts(),
      getMovimientosRecientes(300),
    ])
    const list = ramoId ? prods.filter((p) => !p.ramo || p.ramo === ramoId) : prods
    setProducts(list)
    setHistory(movs)
    setValuation(getValuationMethod())
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refresh()
      } catch (err) {
        console.error('Inventory load error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ramoId])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products
      .filter((p) => {
        if (!term) return true
        return p.name.toLowerCase().includes(term)
      })
      .filter((p) => {
        const s = statusOf(p)
        if (filter === 'pedir') return s.id === 'pedir'
        if (filter === 'reponer') return s.id === 'reponer'
        if (filter === 'agotado') return s.id === 'agotado'
        if (filter === 'sin_definir') return s.id === 'sin_definir'
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, search, filter])

  const counts = useMemo(() => ({
    todo: products.length,
    pedir: products.filter((p) => statusOf(p).id === 'pedir').length,
    reponer: products.filter((p) => statusOf(p).id === 'reponer').length,
    agotado: products.filter((p) => statusOf(p).id === 'agotado').length,
    sin_definir: products.filter((p) => statusOf(p).id === 'sin_definir').length,
  }), [products])

  const handleSubmitAction = async ({ type, productId, cantidad, motivo, costo }) => {
    const tipoMap = {
      entrada: MOVEMENT_TYPES.ENTRADA,
      merma: MOVEMENT_TYPES.MERMA,
      ajuste: MOVEMENT_TYPES.AJUSTE,
    }
    const tipo = tipoMap[type]
    await registrarMovimiento({
      productId,
      tipo,
      cantidad,
      motivo: motivo || (type === 'entrada' ? 'Compra al mayorista' : ''),
      costoUnitario: type === 'entrada' && costo != null ? Number(costo) : null,
    })
    await refresh()
    setActionType(null)
  }

  const handleSaveMin = async (productId) => {
    const value = minInput === '' ? null : Number(minInput)
    if (value != null && (Number.isNaN(value) || value < 0)) return
    await setStockMinimo(productId, value)
    setEditingMin(null)
    setMinInput('')
    await refresh()
  }

  const productById = (id) => products.find((p) => p.id === id)
  const productName = (id) => productById(id)?.name ?? '—'
  const productIcon = (id) => productById(id)?.icon ?? '📦'
  const productUm = (id) => productById(id)?.um ?? 'kg'

  const historyDecorated = useMemo(() => history.map((m) => ({
    ...m,
    productName: productName(m.productId),
    productIcon: productIcon(m.productId),
    productUm: productUm(m.productId),
  })), [history, products])

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
                  <th className="num">{VALUATION_LABELS[valuation]?.short ?? 'Costo prom.'}</th>
                  <th className="num">P. Pedido</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="6" className="inventory-empty">Cargando…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan="6" className="inventory-empty">Sin resultados</td></tr>
                )}
                {filtered.map((p) => {
                  const s = statusOf(p)
                  return (
                    <tr key={p.id}>
                      <td><span className="inventory-product"><span className="inventory-product-icon">{p.icon}</span>{p.name}</span></td>
                      <td>{p.um}</td>
                      <td className="num"><strong>{formatQty(p.stock, p.um)}</strong></td>
                      <td><span className={`inventory-status ${s.cls}`}>{s.label}</span></td>
                      <td className="num">{formatMoney(p.costoPromedio)}</td>
                      <td className="num inventory-min-cell">
                        {editingMin === p.id ? (
                          <span className="inventory-min-edit">
                            <input
                              type="number"
                              min="0"
                              step={p.um === 'unidad' ? '1' : '0.1'}
                              value={minInput}
                              onChange={(e) => setMinInput(e.target.value)}
                              autoFocus
                            />
                            <button className="inventory-min-save" onClick={() => handleSaveMin(p.id)}>✓</button>
                            <button className="inventory-min-cancel" onClick={() => { setEditingMin(null); setMinInput('') }}>✕</button>
                          </span>
                        ) : (
                          <button
                            className="inventory-min-button"
                            onClick={() => { setEditingMin(p.id); setMinInput(p.stockMin ?? '') }}
                            title="Editar stock mínimo"
                          >
                            {p.stockMin ?? '—'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="inventory-history-section">
            <button className="inventory-history-toggle" onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? '▼' : '▶'} 📜 Historial de movimientos ({historyDecorated.length})
            </button>
            {showHistory && (
              <ul className="inventory-history">
                {historyDecorated.length === 0 && (
                  <li className="inventory-empty">Aún no hay movimientos registrados.</li>
                )}
                {historyDecorated.map((m) => {
                  const badge = TIPO_BADGE[m.tipo] || { label: m.tipo, icon: '·' }
                  const sign = m.tipo === 'entrada' ? '+' : '−'
                  return (
                    <li key={m.id} className={`inventory-history-item history-${m.tipo}`}>
                      <span className="history-badge">{badge.icon} {badge.label}</span>
                      <span className="history-product">{m.productIcon} {m.productName}</span>
                      <span className="history-qty">{sign}{formatQty(m.cantidad, m.productUm)} {m.productUm}</span>
                      <span className="history-motivo">{m.motivo || '—'}</span>
                      <span className="history-time">{formatDateTime(m.timestamp)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

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
