import { useState, useRef, useEffect, useMemo } from 'react'
import { getSalesByDateRange } from '../utils/db'
import { formatCurrency, formatQty } from '../utils/format'
import {
  exportarBestSellingPDF,
  descargarBestSellingPDF,
  compartirBestSellingPDF,
} from '../utils/pdfExport'
import './BestSellingProductsModal.css'

// ═══════════════════════════════════════════════════════════
// 🏆 Productos Más Vendidos — Ranking por cantidad vendida.
// ═══════════════════════════════════════════════════════════

const PRESETS = ['Hoy', 'Semana', 'Mes']
const TOP_POR_PAGINA = 10
const MEDALLAS = ['🥇', '🥈', '🥉']

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

export default function BestSellingProductsModal({ onClose, companyName }) {
  const rangoInicial = calcularRango('Hoy')
  const [fechaDesde, setFechaDesde] = useState(rangoInicial.desde)
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.hasta)
  const [presetActivo, setPresetActivo] = useState('Hoy')
  const [pagina, setPagina] = useState(1)
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const modalRef = useRef(null)

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0
    }
  }, [])

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

  const ranking = useMemo(() => {
    const productosMap = new Map()

    ventas.forEach((sale) => {
      const tasa = sale.tasa || 0
      ;(sale.items || []).forEach((item) => {
        const key = item.id ?? item.name
        const prev = productosMap.get(key) || {
          nombre: item.name,
          icon: item.icon || '📦',
          um: item.um || 'unidad',
          cant: 0,
          totalUSD: 0,
          totalBS: 0,
          operaciones: 0,
        }
        prev.cant += item.qty || 0
        prev.totalUSD += item.totalUSD || 0
        prev.totalBS += (item.totalUSD || 0) * tasa
        prev.operaciones += 1
        productosMap.set(key, prev)
      })
    })

    return Array.from(productosMap.values())
      .sort((a, b) => {
        if (b.cant !== a.cant) return b.cant - a.cant
        return b.totalUSD - a.totalUSD
      })
  }, [ventas])

  const totalProductos = ranking.length
  const totalUnidades = ranking.reduce((sum, p) => sum + p.cant, 0)
  const totalIngresos = ranking.reduce((sum, p) => sum + p.totalUSD, 0)
  const top1 = ranking[0]

  const totalPaginas = Math.max(1, Math.ceil(ranking.length / TOP_POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const rankingPagina = ranking.slice(
    (paginaSegura - 1) * TOP_POR_PAGINA,
    paginaSegura * TOP_POR_PAGINA
  )

  const offsetRanking = (paginaSegura - 1) * TOP_POR_PAGINA

  const reporte = {
    ranking,
    totalProductos,
    totalUnidades,
    totalIngresos,
    top1,
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal bsp-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="modal-header">
          <div className="bsp-header-top">
            <span className="modal-icon">🏆</span>
            <h2>Productos Más Vendidos</h2>
            <button className="btn-cancel" onClick={onClose}>✕</button>
          </div>
          <div className="bsp-pdf-bar">
            <span className="bsp-pdf-label">PDF:</span>
            <button className="btn-action" onClick={() => exportarBestSellingPDF({ companyName, desde: fechaDesde, hasta: fechaHasta, modalidad: presetActivo, reporte })}>VER</button>
            <button className="btn-action" onClick={() => compartirBestSellingPDF({ companyName, desde: fechaDesde, hasta: fechaHasta, modalidad: presetActivo, reporte })}>COMPARTIR</button>
            <button className="btn-action" onClick={() => descargarBestSellingPDF({ companyName, desde: fechaDesde, hasta: fechaHasta, modalidad: presetActivo, reporte })}>DESCARGAR</button>
          </div>
        </div>

        {/* ── FILTROS ── */}
        <div className="bsp-filtros">
          <div className="bsp-filtros-fechas">
            <label>
              <span>Desde</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPresetActivo('Personalizado') }}
                className="bsp-input-fecha"
              />
            </label>
            <label>
              <span>Hasta</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPresetActivo('Personalizado') }}
                className="bsp-input-fecha"
              />
            </label>
          </div>
          <div className="bsp-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={`bsp-preset-btn ${presetActivo === p ? 'active' : ''}`}
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

        {/* ── TARJETAS DE RESUMEN ── */}
        <div className="bsp-resumen">
          <div className="bsp-tarjeta">
            <span className="bsp-tarjeta-icono">📦</span>
            <div className="bsp-tarjeta-info">
              <span className="bsp-tarjeta-label">Productos vendidos</span>
              <span className="bsp-tarjeta-valor">{totalProductos}</span>
            </div>
          </div>
          <div className="bsp-tarjeta">
            <span className="bsp-tarjeta-icono">🔢</span>
            <div className="bsp-tarjeta-info">
              <span className="bsp-tarjeta-label">Unidades totales</span>
              <span className="bsp-tarjeta-valor">{formatQty(totalUnidades, 'unidad')}</span>
            </div>
          </div>
          <div className="bsp-tarjeta">
            <span className="bsp-tarjeta-icono">💵</span>
            <div className="bsp-tarjeta-info">
              <span className="bsp-tarjeta-label">Ingresos USD</span>
              <span className="bsp-tarjeta-valor">${formatCurrency(totalIngresos)}</span>
            </div>
          </div>
        </div>

        {cargando && <div className="bsp-cargando">Cargando ventas…</div>}

        {!cargando && ranking.length === 0 && (
          <div className="bsp-vacio">Sin ventas en el período seleccionado</div>
        )}

        {/* ── RANKING ── */}
        {!cargando && ranking.length > 0 && (
          <>
            {top1 && paginaSegura === 1 && (
              <div className="bsp-podium">
                <div className="bsp-podium-card">
                  <span className="bsp-podium-medalla">🥇</span>
                  <span className="bsp-podium-icon">{top1.icon}</span>
                  <div className="bsp-podium-info">
                    <span className="bsp-podium-label">Producto estrella</span>
                    <span className="bsp-podium-name">{top1.nombre}</span>
                  </div>
                  <div className="bsp-podium-stats">
                    <span className="bsp-podium-cant">{formatQty(top1.cant, top1.um)} {top1.um}</span>
                    <span className="bsp-podium-usd">${formatCurrency(top1.totalUSD)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bsp-ranking">
              <div className="bsp-ranking-header">
                <span className="bsp-col-rank">#</span>
                <span className="bsp-col-prod">Producto</span>
                <span className="bsp-col-cant">Cantidad</span>
                <span className="bsp-col-total">Ingresos</span>
              </div>
              {rankingPagina.map((p, idx) => {
                const posicion = offsetRanking + idx + 1
                const esPodio = posicion <= 3
                return (
                  <div key={p.nombre} className={`bsp-row ${esPodio ? 'podium' : ''}`}>
                    <span className="bsp-col-rank">
                      {esPodio ? MEDALLAS[posicion - 1] : `#${posicion}`}
                    </span>
                    <span className="bsp-col-prod">
                      <span className="bsp-row-icon">{p.icon}</span>
                      <span className="bsp-row-name">{p.nombre}</span>
                    </span>
                    <span className="bsp-col-cant">
                      {formatQty(p.cant, p.um)} <small>{p.um}</small>
                    </span>
                    <span className="bsp-col-total">${formatCurrency(p.totalUSD)}</span>
                  </div>
                )
              })}
            </div>

            <div className="bsp-paginacion">
              <button className="bsp-page-btn" onClick={() => setPagina(Math.max(1, paginaSegura - 1))} disabled={paginaSegura <= 1}>← Anterior</button>
              <span className="bsp-page-info">Página {paginaSegura} de {totalPaginas}</span>
              <button className="bsp-page-btn" onClick={() => setPagina(Math.min(totalPaginas, paginaSegura + 1))} disabled={paginaSegura >= totalPaginas}>Siguiente →</button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
