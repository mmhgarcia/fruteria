import { useState, useRef, useEffect, useMemo } from 'react'
import { getSalesByDateRange } from '../utils/db'
import { formatCurrency, formatQty } from '../utils/format'
import { exportarPDF, descargarPDF, compartirPDF } from '../utils/pdfExport'
import './SalesReportModal.css'

// ═══════════════════════════════════════════════════════════
// 📊 Resumen de Ventas — Datos reales desde IndexedDB.
//    Diseño basado en BrainStorm/09-administracion-analitica.md
// ═══════════════════════════════════════════════════════════

const PRESETS = ['Ayer', 'Hoy', 'Semana', 'Mes']
const PRODUCTOS_POR_PAGINA = 8

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function calcularRango(preset) {
  const hoy = new Date()
  const fin = new Date(hoy)
  let inicio

  switch (preset) {
    case 'Hoy':
      inicio = hoy
      break
    case 'Ayer':
      inicio = new Date(hoy)
      inicio.setDate(hoy.getDate() - 1)
      fin.setDate(hoy.getDate() - 1)
      break
    case 'Semana': {
      const diaSem = hoy.getDay()
      const diff = diaSem === 0 ? 6 : diaSem - 1
      inicio = new Date(hoy)
      inicio.setDate(hoy.getDate() - diff)
      break
    }
    case 'Mes':
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      break
    default:
      return null
  }

  return { desde: toDateStr(inicio), hasta: toDateStr(fin) }
}

function rangoAIntervalo(desde, hasta) {
  return {
    start: new Date(`${desde}T00:00:00`),
    end: new Date(`${hasta}T23:59:59.999`),
  }
}

export default function SalesReportModal({ onClose, companyName }) {
  const rangoInicial = calcularRango('Hoy')
  const [fechaDesde, setFechaDesde] = useState(rangoInicial.desde)
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.hasta)
  const [presetActivo, setPresetActivo] = useState('Hoy')
  const [pagina, setPagina] = useState(1)
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const modalRef = useRef(null)

  // Scroll al tope cada vez que se abre el modal
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0
    }
  }, [])

  // Cargar ventas reales según el rango de fechas
  useEffect(() => {
    let cancelled = false
    const cargar = async () => {
      setCargando(true)
      const { start, end } = rangoAIntervalo(fechaDesde, fechaHasta)
      const ventasEnRango = await getSalesByDateRange(start, end)
      if (!cancelled) {
        setVentas(ventasEnRango)
        setPagina(1)
        setCargando(false)
      }
    }
    cargar()
    return () => {
      cancelled = true
    }
  }, [fechaDesde, fechaHasta])

  // Secciones colapsables: solo Dashboard abierto por defecto
  const [openSections, setOpenSections] = useState({
    dashboard: true,
    metodosPago: false,
    productos: false,
  })

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  // ── Cálculo del reporte ──
  const reporte = useMemo(() => {
    let totalVentas = 0
    let totalUSD = 0
    let totalBS = 0
    let divisaUSD = 0
    let efectivoBS = 0
    let pagomovilBS = 0
    let puntoBS = 0
    const productosMap = new Map()

    ventas.forEach((sale) => {
      const tasa = sale.tasa || 0
      totalVentas += 1
      totalUSD += sale.totalUSD || 0
      totalBS += sale.totalBS || 0
      divisaUSD += sale.divisaUSD || 0
      efectivoBS += sale.efectivoBS || 0
      pagomovilBS += sale.pagomovilMonto || 0
      puntoBS += sale.puntoMonto || 0

      ;(sale.items || []).forEach((item) => {
        const key = item.id ?? item.name
        const prev = productosMap.get(key) || {
          nombre: item.name,
          icon: item.icon || '📦',
          um: item.um || 'unidad',
          cant: 0,
          totalUSD: 0,
          totalBS: 0,
        }
        prev.cant += item.qty || 0
        prev.totalUSD += item.totalUSD || 0
        prev.totalBS += (item.totalUSD || 0) * tasa
        productosMap.set(key, prev)
      })
    })

    const ticketPromedio = totalVentas > 0 ? totalUSD / totalVentas : 0

    const metodos = [
      { metodo: 'Efectivo $', usd: divisaUSD, bs: 0 },
      { metodo: 'Efectivo Bs', usd: 0, bs: efectivoBS },
      { metodo: 'Pago Móvil', usd: 0, bs: pagomovilBS },
      { metodo: 'Punto', usd: 0, bs: puntoBS },
    ].filter((m) => m.usd > 0 || m.bs > 0)

    const productos = Array.from(productosMap.values())
      .sort((a, b) => b.totalUSD - a.totalUSD)

    return { totalVentas, totalUSD, totalBS, ticketPromedio, metodos, productos }
  }, [ventas])

  const totalPaginas = Math.max(1, Math.ceil(reporte.productos.length / PRODUCTOS_POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const productosPagina = reporte.productos.slice(
    (paginaSegura - 1) * PRODUCTOS_POR_PAGINA,
    paginaSegura * PRODUCTOS_POR_PAGINA
  )

  const tarjetas = [
    { label: 'Total Ventas', valor: `${reporte.totalVentas} ${reporte.totalVentas === 1 ? 'operación' : 'operaciones'}`, icon: '🧾' },
    { label: 'Ticket Promedio', valor: `$${formatCurrency(reporte.ticketPromedio)}`, icon: '🎫' },
    { label: 'Total USD', valor: `$${formatCurrency(reporte.totalUSD)}`, icon: '💵' },
    { label: 'Total Bs', valor: `Bs ${formatCurrency(reporte.totalBS)}`, icon: '💶' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sales-report-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="modal-header">
          <span className="modal-icon">📊</span>
          <h2>Resumen de Ventas</h2>
          <div className="sr-header-actions">
            <span className="sr-pdf-label">PDF:</span>
            <button className="btn-action" onClick={() => descargarPDF({ companyName, desde: fechaDesde, hasta: fechaHasta, modalidad: presetActivo, reporte })}>Descargar</button>
            <button className="btn-action" onClick={() => compartirPDF({ companyName, desde: fechaDesde, hasta: fechaHasta, modalidad: presetActivo, reporte })}>Compartir</button>
            <button className="btn-action" onClick={() => exportarPDF({ companyName, desde: fechaDesde, hasta: fechaHasta, modalidad: presetActivo, reporte })}>Ver</button>
            <button className="btn-cancel" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── SELECTOR DE FECHAS (siempre visible) ── */}
        <div className="sr-filtros">
          <div className="sr-filtros-fechas">
            <label>
              <span>Desde</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPresetActivo('Personalizado') }}
                className="sr-input-fecha"
              />
            </label>
            <label>
              <span>Hasta</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPresetActivo('Personalizado') }}
                className="sr-input-fecha"
              />
            </label>
          </div>
          <div className="sr-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={`sr-preset-btn ${presetActivo === p ? 'active' : ''}`}
                onClick={() => {
                  setPresetActivo(p)
                  const rango = calcularRango(p)
                  if (rango) {
                    setFechaDesde(rango.desde)
                    setFechaHasta(rango.hasta)
                  }
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {cargando && <div className="sr-cargando">Cargando ventas…</div>}

        {!cargando && reporte.totalVentas === 0 && (
          <div className="sr-vacio">Sin ventas en el período seleccionado</div>
        )}

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
                {tarjetas.map((t) => (
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
                  </tr>
                </thead>
                <tbody>
                  {reporte.metodos.length === 0 && (
                    <tr>
                      <td colSpan={3} className="sr-td-vacio">Sin pagos registrados</td>
                    </tr>
                  )}
                  {reporte.metodos.map((m) => (
                    <tr key={m.metodo}>
                      <td className="sr-td-metodo">{m.metodo}</td>
                      <td>{m.usd > 0 ? `$${formatCurrency(m.usd)}` : '—'}</td>
                      <td>{m.bs > 0 ? `Bs ${formatCurrency(m.bs)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>TOTALES</strong></td>
                    <td><strong>${formatCurrency(reporte.totalUSD)}</strong></td>
                    <td><strong>Bs {formatCurrency(reporte.totalBS)}</strong></td>
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
              <div className="sr-prod-lista">
                {productosPagina.map((p) => (
                  <div key={p.nombre} className="sr-prod-card">
                    <span className="sr-prod-card-icon">{p.icon}</span>
                    <div className="sr-prod-card-body">
                      <span className="sr-prod-card-name">{p.nombre}</span>
                      <span className="sr-prod-card-qty">{formatQty(p.cant, p.um)} {p.um}</span>
                    </div>
                    <div className="sr-prod-card-montos">
                      <span className="sr-prod-card-usd">${formatCurrency(p.totalUSD)}</span>
                      <span className="sr-prod-card-bs">Bs {formatCurrency(p.totalBS)}</span>
                    </div>
                  </div>
                ))}
                {productosPagina.length === 0 && (
                  <div className="sr-vacio">Sin productos vendidos en el período</div>
                )}
              </div>
              <div className="sr-paginacion">
                <button className="sr-page-btn" onClick={() => setPagina(Math.max(1, paginaSegura - 1))} disabled={paginaSegura <= 1}>← Anterior</button>
                <span className="sr-page-info">Página {paginaSegura} de {totalPaginas}</span>
                <button className="sr-page-btn" onClick={() => setPagina(Math.min(totalPaginas, paginaSegura + 1))} disabled={paginaSegura >= totalPaginas}>Siguiente →</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
