import { useState, useEffect, useMemo } from 'react'
import { getProducts, getSalesByDateRange } from '../utils/db'
import { getDashboardData } from '../utils/dashboard'
import { calcularRango, rangoAIntervalo } from '../utils/dateRange'
import { formatCurrency } from '../utils/format'
import './DashboardModal.css'

const PERIODOS = ['Hoy', 'Semana', 'Mes']

function formatQty(n, um) {
  if (n == null) return '—'
  if (um === 'unidad') return String(Math.round(n))
  return Number(n).toFixed(1)
}

const MEDALLAS = ['🥇', '🥈', '🥉']

export default function DashboardModal({ onClose, ramoId, companyName, mostrarAlInicio, onToggleInicio }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState('Hoy')

  useEffect(() => {
    let cancelled = false
    const cargar = async () => {
      setLoading(true)
      const rango = calcularRango(preset)
      const { start, end } = rangoAIntervalo(rango.desde, rango.hasta)
      const [products, sales] = await Promise.all([
        getProducts(),
        getSalesByDateRange(start, end),
      ])
      if (!cancelled) {
        setData(getDashboardData(products, sales, ramoId))
        setLoading(false)
      }
    }
    cargar()
    return () => { cancelled = true }
  }, [preset, ramoId])

  const totalTopUSD = useMemo(
    () => (data?.top ? data.top.reduce((s, p) => s + p.totalUSD, 0) : 0),
    [data]
  )

  const horaGeneracion = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="modal-overlay dash-overlay" onClick={onClose}>
      <div
        className="modal dashboard-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="dash-close"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
        >
          ✕
        </button>

        <div className="dashboard-modal-body">
          <header className="dashboard-header">
            <span className="dashboard-icon">📊</span>
            <div className="dashboard-titulo">
              <h2>Dashboard</h2>
              <span className="dashboard-fecha">{new Date().toLocaleDateString('es-VE')} · {horaGeneracion}</span>
            </div>
            <div className="dashboard-tabs">
              {PERIODOS.map((p) => (
                <button
                  key={p}
                  className={`dashboard-tab ${preset === p ? 'active' : ''}`}
                  onClick={() => setPreset(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </header>

          {loading && (
            <div className="dashboard-cargando">Cargando resumen…</div>
          )}

          {!loading && data && (
            <div className="dashboard-content">
              {/* KPIs */}
              <div className="dashboard-kpis">
                <div className="dashboard-kpi">
                  <span className="dashboard-kpi-icon">💰</span>
                  <span className="dashboard-kpi-label">Ventas hoy</span>
                  <span className="dashboard-kpi-valor">${formatCurrency(data.kpis.ventasUSD)}</span>
                  <span className="dashboard-kpi-sub">Bs {formatCurrency(data.kpis.ventasBS)}</span>
                </div>
                <div className="dashboard-kpi">
                  <span className="dashboard-kpi-icon">🧾</span>
                  <span className="dashboard-kpi-label">Tickets</span>
                  <span className="dashboard-kpi-valor">{data.kpis.tickets}</span>
                </div>
                <div className="dashboard-kpi">
                  <span className="dashboard-kpi-icon">⚡</span>
                  <span className="dashboard-kpi-label">Ticket prom.</span>
                  <span className="dashboard-kpi-valor">${formatCurrency(data.kpis.ticketPromedio)}</span>
                </div>
                <div className="dashboard-kpi">
                  <span className="dashboard-kpi-icon">📦</span>
                  <span className="dashboard-kpi-label">Stock &gt; 0</span>
                  <span className="dashboard-kpi-valor">{data.alerts.total - data.alerts.sinDefinir}</span>
                </div>
              </div>

              {/* Alertas de stock */}
              <section className="dashboard-section">
                <h3 className="dashboard-section-titulo">⚠️ Alertas de stock</h3>
                {data.alerts.agotados === 0 && data.alerts.pedidos === 0 ? (
                  <div className="dashboard-ok">✅ Todo en stock</div>
                ) : (
                  <div className="dashboard-alertas">
                    {data.alerts.agotados > 0 && (
                      <div className="dashboard-alerta dashboard-alerta-agotado">
                        <span className="dashboard-alerta-badge">⛔ {data.alerts.agotados} agotado(s)</span>
                      </div>
                    )}
                    {data.alerts.pedidos > 0 && (
                      <div className="dashboard-alerta dashboard-alerta-pedir">
                        <span className="dashboard-alerta-badge">⚠️ {data.alerts.pedidos} para pedir</span>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Top productos */}
              <section className="dashboard-section">
                <h3 className="dashboard-section-titulo">🏆 Más vendidos ({preset.toLowerCase()})</h3>
                {data.top.length === 0 ? (
                  <div className="dashboard-ok">Sin ventas para ranking</div>
                ) : (
                  <ul className="dashboard-top">
                    {data.top.map((p, idx) => (
                      <li key={p.id ?? p.name} className="dashboard-top-row">
                        <span className="dashboard-top-medalla">
                          {idx < 3 ? MEDALLAS[idx] : `#${idx + 1}`}
                        </span>
                        <span className="dashboard-top-nombre">{p.icon} {p.name}</span>
                        <span className="dashboard-top-valor">${formatCurrency(p.totalUSD)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Valor inventario */}
              <section className="dashboard-section">
                <h3 className="dashboard-section-titulo">💰 Valor del inventario</h3>
                <div className="dashboard-inventario">
                  <span className="dashboard-inventario-valor">${formatCurrency(data.inventory.totalGeneral)}</span>
                  <span className="dashboard-inventario-detalle">
                    {data.inventory.totalProductos} producto(s) · {data.inventory.categories.length} categoría(s)
                  </span>
                </div>
              </section>
            </div>
          )}
        </div>

        <footer className="dashboard-footer">
          <label className="dashboard-check">
            <input
              type="checkbox"
              checked={mostrarAlInicio}
              onChange={(e) => onToggleInicio(e.target.checked)}
            />
            <span>Mostrar al inicio</span>
          </label>
          <button className="dashboard-vender" onClick={onClose}>🛒 Vender</button>
        </footer>
      </div>
    </div>
  )
}