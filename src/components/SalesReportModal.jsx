import { useEffect, useMemo, useState } from 'react'
import { getSales } from '../utils/db'
import { formatQty } from '../utils/format'
import './SalesReportModal.css'

export default function SalesReportModal({ onClose }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedDays, setExpandedDays] = useState(new Set())

  useEffect(() => {
    async function load() {
      try {
        const data = await getSales()
        setSales(data.sort((a, b) => new Date(b.date) - new Date(a.date)))
      } catch (err) {
        setError('Error cargando las ventas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const report = useMemo(() => {
    const days = new Map()

    for (const sale of sales) {
      const day = sale.date.slice(0, 10)
      if (!days.has(day)) {
        days.set(day, { products: new Map(), totalUSD: 0, totalBS: 0, tasas: new Set() })
      }
      const dayData = days.get(day)
      dayData.totalUSD += sale.totalUSD
      dayData.totalBS += sale.totalBS
      dayData.tasas.add(sale.tasa)

      for (const item of sale.items) {
        const key = `${item.id}-${item.name}-${item.um}-${item.price}`
        if (!dayData.products.has(key)) {
          dayData.products.set(key, {
            id: item.id,
            name: item.name,
            icon: item.icon,
            um: item.um,
            price: item.price,
            qty: 0,
            totalUSD: 0,
          })
        }
        const product = dayData.products.get(key)
        product.qty += item.qty
        product.totalUSD += item.totalUSD
      }
    }

    return Array.from(days.entries()).map(([date, data]) => {
      const tasas = Array.from(data.tasas).sort((a, b) => a - b)
      return {
        date,
        totalUSD: data.totalUSD,
        totalBS: data.totalBS,
        tasaLabel: formatTasas(tasas),
        products: Array.from(data.products.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }
    })
  }, [sales])

  const grandTotal = useMemo(() => {
    return report.reduce(
      (acc, day) => ({
        totalUSD: acc.totalUSD + day.totalUSD,
        totalBS: acc.totalBS + day.totalBS,
      }),
      { totalUSD: 0, totalBS: 0 }
    )
  }, [report])

  const toggleDay = (date) => {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }

  const expandAll = () => setExpandedDays(new Set(report.map((d) => d.date)))
  const collapseAll = () => setExpandedDays(new Set())

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal sales-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-product">
          <div className="modal-icon">📊</div>
          <div className="modal-name">Resumen de Ventas</div>
          <div className="modal-price">
            Total: ${grandTotal.totalUSD.toFixed(2)} / Bs {grandTotal.totalBS.toFixed(2)}
          </div>
        </div>

        <div className="sales-report-actions">
          <button className="btn-small" onClick={expandAll}>
            ▼ Expandir
          </button>
          <button className="btn-small" onClick={collapseAll}>
            ▲ Colapsar
          </button>
        </div>

        <div className="sales-report-content">
          {loading && <div className="sales-report-loading">Cargando ventas...</div>}
          {error && <div className="sales-report-error">{error}</div>}
          {!loading && !error && report.length === 0 && (
            <div className="sales-report-empty">No hay ventas registradas</div>
          )}
          {!loading && report.map((day) => (
            <div key={day.date} className="sales-report-day">
              <button
                className="sales-report-day-header"
                onClick={() => toggleDay(day.date)}
              >
                <span className="sales-report-day-toggle">
                  {expandedDays.has(day.date) ? '▼' : '▶'}
                </span>
                <span className="sales-report-day-info">
                  <span className="sales-report-day-date">{formatDate(day.date)}</span>
                  <span className="sales-report-day-tasa">{day.tasaLabel}</span>
                </span>
                <span className="sales-report-day-total">
                  ${day.totalUSD.toFixed(2)} / Bs {day.totalBS.toFixed(2)}
                </span>
              </button>

              {expandedDays.has(day.date) && (
                <div className="sales-report-day-body">
                  <div className="sales-report-table-header">
                    <span>Producto</span>
                    <span>Cant</span>
                    <span>Total $</span>
                  </div>
                  {day.products.map((product) => (
                    <div key={`${day.date}-${product.id}`} className="sales-report-product">
                      <span className="sales-report-product-name">
                        {product.icon} {product.name}
                      </span>
                      <span className="sales-report-product-qty">
                        {formatQty(product.qty, product.um)} {product.um}
                      </span>
                      <span className="sales-report-product-total">
                        ${product.totalUSD.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

function formatTasas(tasas) {
  if (tasas.length === 0) return ''
  if (tasas.length === 1) return `Tasa: ${tasas[0].toFixed(2)}`
  return `Tasa: ${tasas[0].toFixed(2)} - ${tasas[tasas.length - 1].toFixed(2)}`
}
