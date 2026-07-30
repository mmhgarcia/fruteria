import { useState, useRef, useEffect } from 'react'
import './SalesReportModal.css'

// ═══════════════════════════════════════════════════════════
// 🎨 MOCK ESTÁTICO — Solo interfaz visual, cero lógica.
//    Diseño basado en BrainStorm/09-administracion-analitica.md
// ═══════════════════════════════════════════════════════════

const MOCK_FECHA_DESDE = '01/07/2026'
const MOCK_FECHA_HASTA = '30/07/2026'

const MOCK_TARJETAS = [
  { label: 'Total Ventas', valor: '150 operaciones', icon: '🧾' },
  { label: 'Ticket Promedio', valor: '$8,33', icon: '🎫' },
  { label: 'Total USD', valor: '$1.250,00', icon: '💵' },
  { label: 'Total Bs', valor: 'Bs 91.875,00', icon: '💶' },
]

const MOCK_METODOS = [
  { metodo: 'Efectivo $', usd: '$450,00', bs: '—', total: '$450,00' },
  { metodo: 'Efectivo Bs', usd: '—', bs: 'Bs 18.000', total: 'Bs 18.000' },
  { metodo: 'Pago Móvil', usd: '$500,00', bs: 'Bs 36.750', total: '$500 + Bs 36.750' },
  { metodo: 'Punto', usd: '$200,00', bs: 'Bs 14.700', total: '$200 + Bs 14.700' },
  { metodo: 'Divisa', usd: '$100,00', bs: '—', total: '$100,00' },
]

const MOCK_PRODUCTOS = [
  { id: 1, nombre: 'Lechuga', icon: '🥬', cant: '45 un', totalUSD: '$67,50', totalBS: 'Bs 4.961' },
  { id: 2, nombre: 'Tomate', icon: '🍅', cant: '30 un', totalUSD: '$45,00', totalBS: 'Bs 3.307' },
  { id: 3, nombre: 'Cebolla', icon: '🧅', cant: '25 un', totalUSD: '$37,50', totalBS: 'Bs 2.756' },
  { id: 4, nombre: 'Lechosa', icon: '🍈', cant: '18 un', totalUSD: '$36,00', totalBS: 'Bs 2.646' },
  { id: 5, nombre: 'Cambur', icon: '🍌', cant: '22 kg', totalUSD: '$33,00', totalBS: 'Bs 2.425' },
  { id: 6, nombre: 'Parchita', icon: '🍊', cant: '15 un', totalUSD: '$30,00', totalBS: 'Bs 2.205' },
  { id: 7, nombre: 'Aguacate', icon: '🥑', cant: '12 un', totalUSD: '$28,80', totalBS: 'Bs 2.116' },
  { id: 8, nombre: 'Mango', icon: '🥭', cant: '20 un', totalUSD: '$26,00', totalBS: 'Bs 1.911' },
]

const PRESETS = ['Hoy', 'Ayer', 'Semana', 'Mes']

export default function SalesReportModal({ onClose }) {
  const [fechaDesde, setFechaDesde] = useState(MOCK_FECHA_DESDE)
  const [fechaHasta, setFechaHasta] = useState(MOCK_FECHA_HASTA)
  const [presetActivo, setPresetActivo] = useState('Mes')
  const [pagina, setPagina] = useState(1)
  const totalPaginas = 3
  const modalRef = useRef(null)

  // Scroll al tope cada vez que se abre el modal
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0
    }
  }, [])

  // Secciones colapsables: solo Dashboard abierto por defecto
  const [openSections, setOpenSections] = useState({
    dashboard: true,
    metodosPago: false,
    productos: false,
  })

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sales-report-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="modal-header">
          <span className="modal-icon">📊</span>
          <h2>Resumen de Ventas</h2>
          <div className="sr-header-actions">
            <button className="btn-action">📥 CSV</button>
            <button className="btn-action">🖨️ Imprimir</button>
            <button className="btn-cancel" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── SELECTOR DE FECHAS (siempre visible) ── */}
        <div className="sr-filtros">
          <div className="sr-filtros-fechas">
            <label>
              <span>Desde</span>
              <input type="text" value={fechaDesde} readOnly className="sr-input-fecha" />
            </label>
            <label>
              <span>Hasta</span>
              <input type="text" value={fechaHasta} readOnly className="sr-input-fecha" />
            </label>
          </div>
          <div className="sr-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={`sr-preset-btn ${presetActivo === p ? 'active' : ''}`}
                onClick={() => setPresetActivo(p)}
              >
                {p}
              </button>
            ))}
            <button
              className={`sr-preset-btn ${presetActivo === 'Personalizado' ? 'active' : ''}`}
              onClick={() => setPresetActivo('Personalizado')}
            >
              Personalizado
            </button>
          </div>
        </div>

        {/* ── SECCIÓN 1: DASHBOARD ── */}
        <div className="sr-collapsible">
          <button
            className={`sr-collapsible-header ${openSections.dashboard ? 'open' : ''}`}
            onClick={() => toggleSection('dashboard')}
          >
            <span className="sr-collapsible-icon">{openSections.dashboard ? '▼' : '▶'}</span>
            <span className="sr-collapsible-title">📊 Dashboard</span>
          </button>
          {openSections.dashboard && (
            <div className="sr-collapsible-body">
              <div className="sr-tarjetas">
                {MOCK_TARJETAS.map((t) => (
                  <div key={t.label} className="sr-tarjeta">
                    <span className="sr-tarjeta-icono">{t.icon}</span>
                    <div className="sr-tarjeta-info">
                      <span className="sr-tarjeta-label">{t.label}</span>
                      <span className="sr-tarjeta-valor">{t.valor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 2: DESGLOSE POR MÉTODO DE PAGO ── */}
        <div className="sr-collapsible">
          <button
            className={`sr-collapsible-header ${openSections.metodosPago ? 'open' : ''}`}
            onClick={() => toggleSection('metodosPago')}
          >
            <span className="sr-collapsible-icon">{openSections.metodosPago ? '▼' : '▶'}</span>
            <span className="sr-collapsible-title">💰 Desglose por Método de Pago</span>
          </button>
          {openSections.metodosPago && (
            <div className="sr-collapsible-body">
              <table className="sr-tabla">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th>USD</th>
                    <th>Bs</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_METODOS.map((m) => (
                    <tr key={m.metodo}>
                      <td className="sr-td-metodo">{m.metodo}</td>
                      <td>{m.usd}</td>
                      <td>{m.bs}</td>
                      <td className="sr-td-total">{m.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>TOTALES</strong></td>
                    <td><strong>$1.250,00</strong></td>
                    <td><strong>Bs 69.450</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              <div className="sr-igtf">IGTF 3%: No aplicado</div>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 3: PRODUCTOS VENDIDOS ── */}
        <div className="sr-collapsible">
          <button
            className={`sr-collapsible-header ${openSections.productos ? 'open' : ''}`}
            onClick={() => toggleSection('productos')}
          >
            <span className="sr-collapsible-icon">{openSections.productos ? '▼' : '▶'}</span>
            <span className="sr-collapsible-title">📋 Productos Vendidos</span>
          </button>
          {openSections.productos && (
            <div className="sr-collapsible-body">
              <div className="sr-productos-header">
                <input type="text" className="sr-buscar" placeholder="Buscar producto..." readOnly />
              </div>
              <div className="sr-prod-lista">
                {MOCK_PRODUCTOS.map((p) => (
                  <div key={p.id} className="sr-prod-card">
                    <span className="sr-prod-card-icon">{p.icon}</span>
                    <div className="sr-prod-card-body">
                      <span className="sr-prod-card-name">{p.nombre}</span>
                      <span className="sr-prod-card-qty">{p.cant}</span>
                    </div>
                    <div className="sr-prod-card-montos">
                      <span className="sr-prod-card-usd">{p.totalUSD}</span>
                      <span className="sr-prod-card-bs">{p.totalBS}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sr-paginacion">
                <button className="sr-page-btn" onClick={() => setPagina(Math.max(1, pagina - 1))}>← Anterior</button>
                <span className="sr-page-info">Página {pagina} de {totalPaginas}</span>
                <button className="sr-page-btn" onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}>Siguiente →</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
