import { useRef } from 'react'
import { formatQty, formatCurrency } from '../utils/format'
import './TicketPreview.css'

function TicketPreview({ cart, totals, tasa, onClose, companyName, sale }) {
  const ticketRef = useRef(null)

  const now = new Date()
  const fecha = now.toLocaleDateString('es-VE')
  const hora = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })

  // Usar los datos de la venta completada si existe, si no los del carrito actual
  const items = sale ? sale.items : cart
  const totalUSD = sale ? sale.totalUSD : totals.totalUSD
  const totalBS = sale ? sale.totalBS : totals.totalBS
  const rate = sale ? sale.tasa : tasa
  const vuelto = sale ? sale.vuelto : 0
  const ticketNumber = sale
    ? String(sale.id || Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')
    : String(Math.floor(Math.random() * 9000) + 1000)

  // Detalle de métodos de pago usados (solo para venta completada)
  const paymentMethods = sale
    ? [
        sale.pagomovilMonto > 0 && { label: 'Pago Móvil', value: `Bs ${formatCurrency(sale.pagomovilMonto)}` },
        sale.puntoMonto > 0 && { label: 'Punto', value: `Bs ${formatCurrency(sale.puntoMonto)}` },
        sale.divisaUSD > 0 && { label: 'Divisa', value: `$${formatCurrency(sale.divisaUSD)}` },
        sale.efectivoBS > 0 && { label: 'Efectivo', value: `Bs ${formatCurrency(sale.efectivoBS)}` },
        { label: 'Pagado', value: `Bs ${formatCurrency(sale.totalPagado)}` },
        sale.vuelto > 0 && { label: 'Vuelto', value: `Bs ${formatCurrency(sale.vuelto)}` },
      ].filter(Boolean)
    : []

  const handlePrint = () => {
    const content = ticketRef.current.innerHTML
    const w = window.open('', '_blank', 'width=360,height=600')
    w.document.write(`
      <html>
        <head>
          <title>Ticket</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal ticket-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ticket-preview-content" ref={ticketRef}>
          <div className="ticket-preview-header">
            <div className="ticket-preview-logo">🍎</div>
            <div className="ticket-preview-title">{(companyName || 'Frutería POS').toUpperCase()}</div>
            <div className="ticket-preview-meta">Ticket #{ticketNumber}</div>
            <div className="ticket-preview-meta">{fecha} {hora}</div>
            <div className="ticket-preview-rate">Tasa: Bs {formatCurrency(rate)} x $1</div>
          </div>
          <div className="ticket-preview-divider" />
          <div className="ticket-preview-items">
            {items.map((item, idx) => (
              <div key={item.id || idx}>
                <div className="ticket-preview-line">
                  <span>
                    {idx + 1}. {item.name} {item.icon}
                  </span>
                  <span>${formatCurrency(item.totalUSD)}</span>
                </div>
                <div className="ticket-preview-detail">
                  {formatQty(item.qty, item.um)} {item.um} x ${formatCurrency(item.price)} = Bs{' '}
                  {formatCurrency(item.totalUSD * rate)}
                </div>
              </div>
            ))}
          </div>
          <div className="ticket-preview-divider" />
          <div className="ticket-preview-line total">
            <span>TOTAL $</span>
            <span>${formatCurrency(totalUSD)}</span>
          </div>
          <div className="ticket-preview-line total-bs">
            <span>TOTAL Bs</span>
            <span>Bs {formatCurrency(totalBS)}</span>
          </div>

          {paymentMethods.length > 0 && (
            <>
              <div className="ticket-preview-divider" />
              <div className="ticket-preview-payments">
                {paymentMethods.map((pm, i) => (
                  <div key={i} className="ticket-preview-line">
                    <span>{pm.label}</span>
                    <span>{pm.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="ticket-preview-footer">
            ¡Gracias por su compra!
            <br />---
          </div>
        </div>
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-cancel" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn-confirm" onClick={handlePrint}>
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  )
}

export default TicketPreview
