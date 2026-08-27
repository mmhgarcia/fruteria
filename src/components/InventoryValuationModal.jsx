import { useState, useEffect, useMemo } from 'react'
import { getProducts } from '../utils/db'
import { getInventoryValuation } from '../utils/inventory'
import { formatCurrency } from '../utils/format'
import {
  exportarInventoryValuationPDF,
  compartirInventoryValuationPDF,
} from '../utils/pdfExport'
import './InventoryValuationModal.css'

function formatStockQty(stock, um) {
  if (stock == null) return '—'
  if (um === 'unidad') return String(Math.round(stock))
  return Number(stock).toFixed(2)
}

function formatFechaCorta(iso) {
  return new Date(iso).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function InventoryValuationModal({ onClose, companyName, ramoId }) {
  const [valuation, setValuation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const cargar = async () => {
      setLoading(true)
      setError('')
      try {
        const products = await getProducts()
        if (cancelled) return
        setValuation(getInventoryValuation(products, ramoId))
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar inventario')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    cargar()
    return () => { cancelled = true }
  }, [ramoId])

  const handleVerPDF = () => {
    if (!valuation) return
    exportarInventoryValuationPDF({ companyName, valuation })
  }

  const handleCompartirPDF = async () => {
    if (!valuation) return
    try {
      await compartirInventoryValuationPDF({ companyName, valuation })
    } catch (err) {
      console.error('Error al compartir PDF:', err)
    }
  }

  const totalCategorias = useMemo(
    () => valuation?.categories.length ?? 0,
    [valuation]
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal inventory-valuation-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="iv-close"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
        >
          ✕
        </button>

        <div className="modal-header">
          <div className="iv-header-top">
            <span className="modal-icon">💰</span>
            <h2>Inventario Valorizado</h2>
          </div>
          {!loading && valuation && (
            <div className="iv-pdf-bar">
              <span className="iv-pdf-label">PDF:</span>
              <button className="btn-action iv-btn-ver" onClick={handleVerPDF}>👁 VER</button>
              <button className="btn-action iv-btn-share" onClick={handleCompartirPDF}>📤 COMPARTIR</button>
            </div>
          )}
        </div>

        {loading && (
          <div className="iv-cargando">Cargando inventario…</div>
        )}

        {error && (
          <div className="iv-error">⚠️ {error}</div>
        )}

        {!loading && valuation && (
          <>
            <div className="iv-meta">
              <span><strong>Método:</strong> {valuation.methodLabel}</span>
              <span><strong>Generado:</strong> {formatFechaCorta(valuation.generatedAt)}</span>
            </div>

            <div className="iv-resumen">
              <div className="iv-resumen-item">
                <span className="iv-resumen-label">Categorías</span>
                <span className="iv-resumen-valor">{totalCategorias}</span>
              </div>
              <div className="iv-resumen-item">
                <span className="iv-resumen-label">Productos</span>
                <span className="iv-resumen-valor">{valuation.totalProductos}</span>
              </div>
              <div className="iv-resumen-item iv-resumen-total">
                <span className="iv-resumen-label">Valor total</span>
                <span className="iv-resumen-valor">${formatCurrency(valuation.totalGeneral)}</span>
              </div>
            </div>

            {valuation.sinCostoCount > 0 && (
              <div className="iv-warning">
                ⚠️ {valuation.sinCostoCount} producto(s) sin costo registrado (valor $0).
              </div>
            )}

            {valuation.categories.length === 0 && (
              <div className="iv-vacio">No hay productos con stock registrado.</div>
            )}

            {valuation.categories.length > 0 && (
              <div className="iv-lista">
                {valuation.categories.map((cat) => (
                  <section key={cat.name} className="iv-categoria">
                    <header className="iv-categoria-header">
                      <span className="iv-categoria-name">{cat.name}</span>
                      <span className="iv-categoria-subtotal">
                        ${formatCurrency(cat.subtotal)}
                      </span>
                    </header>
                    <ul className="iv-items">
                      {cat.items.map((it) => (
                        <li key={it.id} className={`iv-item ${!it.tieneCosto ? 'iv-item-no-cost' : ''}`}>
                          <span className="iv-item-icon">{it.icon}</span>
                          <span className="iv-item-name">{it.name}</span>
                          <span className="iv-item-stock">
                            {formatStockQty(it.stock, it.um)} {it.um}
                          </span>
                          <span className="iv-item-cost">
                            {it.tieneCosto ? `$${formatCurrency(it.costoUnitario)}` : '—'}
                          </span>
                          <span className="iv-item-value">
                            ${formatCurrency(it.valor)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}

            {valuation.categories.length > 0 && (
              <div className="iv-grand-total">
                <span>TOTAL GENERAL</span>
                <span>${formatCurrency(valuation.totalGeneral)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}