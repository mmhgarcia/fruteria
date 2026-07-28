import { useRef } from 'react'
import { formatQty, formatCurrency } from '../utils/format'
import './TicketPreview.css'

function TicketPreview({ cart, totals, tasa, onClose, companyName }) {
  const ticketRef = useRef(null)

  const now = new Date()
  const fecha = now.toLocaleDateString('es-VE')
  const hora = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
  const ticketNumber = Math.floor(Math.random() * 9000) + 1000

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
            <div className="ticket-preview-rate">Tasa: Bs {formatCurrency(tasa)} x $1</div>
          </div>
          <div className="ticket-preview-divider" />
          <div className="ticket-preview-items">
            {cart.map((item, idx) => (
              <div key={item.id}>
                <div className="ticket-preview-line">
                  <span>
                    {idx + 1}. {item.name} {item.icon}
                  </span>
                  <span>${formatCurrency(item.totalUSD)}</span>
                </div>
                <div className="ticket-preview-detail">
                  {formatQty(item.qty, item.um)} {item.um} x ${formatCurrency(item.price)} = Bs{' '}
                  {formatCurrency(item.totalUSD * tasa)}
                </div>
              </div>
            ))}
          </div>
          <div className="ticket-preview-divider" />
          <div className="ticket-preview-line total">
            <span>TOTAL $</span>
            <span>${formatCurrency(totals.totalUSD)}</span>
          </div>
          <div className="ticket-preview-line total-bs">
            <span>TOTAL Bs</span>
            <span>Bs {formatCurrency(totals.totalBS)}</span>
          </div>
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
