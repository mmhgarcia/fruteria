import { useState, useRef, useEffect, useMemo } from 'react'
import { getSalesByDateRange } from '../utils/db'
import { formatCurrency } from '../utils/format'
import './DailyTicketsModal.css'

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTime(isoDate) {
  const d = new Date(isoDate)
  return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

function formatTransactionId(isoDate) {
  const d = new Date(isoDate)
  return `TX-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
}

function getPaymentMethod(sale) {
  if (sale.divisaUSD > 0) return 'Efectivo $'
  if (sale.pagomovilMonto > 0) return 'Pago Móvil'
  if (sale.puntoMonto > 0) return 'Punto'
  if (sale.efectivoBS > 0) return 'Efectivo Bs'
  return 'N/A'
}

export default function DailyTicketsModal({ onClose, companyName, tasa }) {
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
      const hoy = new Date()
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999)
      const ventasDelDia = await getSalesByDateRange(inicio, fin)
      if (!cancelled) {
        const ordenadas = ventasDelDia.sort((a, b) => new Date(a.date) - new Date(b.date))
        setVentas(ordenadas)
        setCargando(false)
      }
    }
    cargar()
    return () => { cancelled = true }
  }, [])

  const totalUSD = useMemo(() => ventas.reduce((sum, v) => sum + (v.totalUSD || 0), 0), [ventas])
  const totalBS = useMemo(() => ventas.reduce((sum, v) => sum + (v.totalBS || 0), 0), [ventas])

  const generarPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 14
    const VERDE = [42, 106, 66]

    doc.setFillColor(...VERDE)
    doc.rect(0, 0, pageWidth, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text((companyName || 'Frutería POS').toUpperCase(), margin, 10)
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, pageWidth - margin, 10, { align: 'right' })
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('TICKETS DEL DÍA', margin, 22)

    let y = 38
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total de ventas: ${ventas.length}`, margin, y)
    doc.text(`Total USD: $${formatCurrency(totalUSD)}`, pageWidth / 2, y)
    doc.text(`Total Bs: Bs ${formatCurrency(totalBS)}`, pageWidth - margin, y, { align: 'right' })
    y += 8

    for (const sale of ventas) {
      if (y > 260) {
        doc.addPage()
        y = 20
      }

      doc.setFillColor(245, 247, 250)
      doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 1, 1, 'F')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text(`Ticket #${formatTransactionId(sale.date)}`, margin + 3, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`${new Date(sale.date).toLocaleDateString('es-VE')} ${formatTime(sale.date)}`, margin + 3, y + 9)
      doc.text(`$${formatCurrency(sale.totalUSD)}`, pageWidth - margin - 3, y + 5, { align: 'right' })
      doc.text(`Bs ${formatCurrency(sale.totalBS)}`, pageWidth - margin - 3, y + 9, { align: 'right' })
      y += 16
    }

    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Generado el ${new Date().toLocaleString('es-VE')} — ${companyName || 'Frutería POS'}`,
        margin,
        doc.internal.pageSize.getHeight() - 8
      )
    }

    return doc
  }

  const handleVerPDF = async () => {
    const doc = await generarPDF()
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const handleCompartirPDF = async () => {
    const doc = await generarPDF()
    const blob = doc.output('blob')
    const filename = `tickets-dia-${toDateStr(new Date())}.pdf`
    const file = new File([blob], filename, { type: 'application/pdf' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: filename,
          text: 'Tickets del día',
        })
        return
      } catch (error) {
        if (error.name === 'AbortError') return
      }
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal daily-tickets-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div className="dt-header-top">
            <span className="modal-icon">🧾</span>
            <h2>Tickets del Día</h2>
            <button className="btn-cancel" onClick={onClose}>✕</button>
          </div>
          <div className="dt-pdf-bar">
            <span className="dt-pdf-label">PDF:</span>
            <button className="btn-action" onClick={handleVerPDF}>VER</button>
            <button className="btn-action" onClick={handleCompartirPDF}>COMPARTIR</button>
          </div>
        </div>

        <div className="dt-resumen">
          <span className="dt-resumen-item">
            <span className="dt-resumen-label">Ventas:</span>
            <span className="dt-resumen-valor">{ventas.length}</span>
          </span>
          <span className="dt-resumen-item">
            <span className="dt-resumen-label">Total:</span>
            <span className="dt-resumen-valor">${formatCurrency(totalUSD)}</span>
          </span>
          <span className="dt-resumen-item">
            <span className="dt-resumen-label">Total Bs:</span>
            <span className="dt-resumen-valor">Bs {formatCurrency(totalBS)}</span>
          </span>
        </div>

        {cargando && <div className="dt-cargando">Cargando tickets…</div>}

        {!cargando && ventas.length === 0 && (
          <div className="dt-vacio">Sin ventas registradas hoy</div>
        )}

        {!cargando && ventas.length > 0 && (
          <div className="dt-lista">
            {ventas.map((sale, idx) => (
              <div key={sale.id || idx} className="dt-ticket-card">
                <div className="dt-ticket-header">
                  <span className="dt-ticket-id">#{formatTransactionId(sale.date)}</span>
                  <span className="dt-ticket-time">{formatTime(sale.date)}</span>
                </div>
                <div className="dt-ticket-info">
                  <span className="dt-ticket-label">Fecha:</span>
                  <span className="dt-ticket-value">{new Date(sale.date).toLocaleDateString('es-VE')}</span>
                </div>
                <div className="dt-ticket-info">
                  <span className="dt-ticket-label">Pago:</span>
                  <span className="dt-ticket-value">{getPaymentMethod(sale)}</span>
                </div>
                <div className="dt-ticket-info">
                  <span className="dt-ticket-label">Tasa BCV:</span>
                  <span className="dt-ticket-value">Bs. {formatCurrency(sale.tasa || 0)}</span>
                </div>
                <hr className="dt-ticket-separator" />
                <div className="dt-ticket-items">
                  {(sale.items || []).map((item, i) => (
                    <div key={i} className="dt-ticket-item">
                      <span className="dt-item-qty">{item.qty}</span>
                      <span className="dt-item-name">{item.name}</span>
                      <span className="dt-item-subt">${formatCurrency(item.totalUSD)}</span>
                    </div>
                  ))}
                </div>
                <hr className="dt-ticket-separator" />
                <div className="dt-ticket-totals">
                  <div className="dt-total-row">
                    <span>TOTAL USD</span>
                    <span>${formatCurrency(sale.totalUSD)}</span>
                  </div>
                  <div className="dt-total-row">
                    <span>TOTAL BS</span>
                    <span>Bs. {formatCurrency(sale.totalBS)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
