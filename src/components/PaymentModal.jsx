import { useState, useMemo } from 'react'
import { formatCurrency } from '../utils/format'
import './PaymentModal.css'

function PaymentModal({ totals, tasa, onClose, onConfirm }) {
  const [pmRef, setPmRef] = useState('')
  const [pmBanco, setPmBanco] = useState('')
  const [pmMonto, setPmMonto] = useState('')
  const [efectivoBS, setEfectivoBS] = useState('')
  const [debCard, setDebCard] = useState('')
  const [debBanco, setDebBanco] = useState('')
  const [debMonto, setDebMonto] = useState('')
  const [divisaUSD, setDivisaUSD] = useState('')

  const today = new Date()
  const fechaStr = today.toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  const totalPagado = useMemo(() => {
    const pm = parseFloat(pmMonto) || 0
    const ef = parseFloat(efectivoBS) || 0
    const db = parseFloat(debMonto) || 0
    const dv = (parseFloat(divisaUSD) || 0) * tasa
    return pm + ef + db + dv
  }, [pmMonto, efectivoBS, debMonto, divisaUSD, tasa])

  const saldo = totals.totalBS - totalPagado

  const handleConfirm = () => {
    if (totalPagado <= 0) {
      alert('Debes registrar al menos un método de pago.')
      return
    }
    if (saldo > 0) {
      alert(`Faltan Bs ${formatCurrency(saldo)} para completar el pago.`)
      return
    }
    const vuelto = saldo < 0 ? Math.abs(saldo) : 0
    onConfirm({
      pagomovilRef: pmRef,
      pagomovilBanco: pmBanco,
      pagomovilMonto: parseFloat(pmMonto) || 0,
      efectivoBS: parseFloat(efectivoBS) || 0,
      debitoCard: debCard,
      debitoBanco: debBanco,
      debitoMonto: parseFloat(debMonto) || 0,
      divisaUSD: parseFloat(divisaUSD) || 0,
      totalPagado,
      vuelto,
    })
  }

  const hasAnyData = totalPagado > 0

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal payment-unified" onClick={(e) => e.stopPropagation()}>
        <div className="pu-header">
          <div className="pu-header-title">💰 Confirmar Pago</div>
          <div className="pu-header-meta">
            <span>Fecha: {fechaStr}</span>
            <span>Tasa: {formatCurrency(tasa)}</span>
          </div>
          <div className="pu-total-ticket">
            Total Ticket: Bs {formatCurrency(totals.totalBS)}
          </div>
        </div>

        <div className="pu-body">
          {/* Pago Móvil */}
          <div className="pu-section">
            <div className="pu-section-title">📱 Pago Móvil</div>
            <div className="pu-grid-2">
              <div className="pu-field">
                <label className="pu-label">Referencia</label>
                <input
                  type="text"
                  className="pu-input"
                  placeholder="Número de referencia"
                  value={pmRef}
                  onChange={(e) => setPmRef(e.target.value)}
                />
              </div>
              <div className="pu-field">
                <label className="pu-label">Banco</label>
                <input
                  type="text"
                  className="pu-input"
                  placeholder="Nombre del banco"
                  value={pmBanco}
                  onChange={(e) => setPmBanco(e.target.value)}
                />
              </div>
            </div>
            <div className="pu-field">
              <label className="pu-label">Monto</label>
              <input
                type="number"
                className="pu-input"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={pmMonto}
                onChange={(e) => setPmMonto(e.target.value)}
              />
            </div>
          </div>

          {/* Efectivo */}
          <div className="pu-section">
            <div className="pu-section-title">💵 Efectivo</div>
            <div className="pu-field">
              <label className="pu-label">Monto en Bs</label>
              <input
                type="number"
                className="pu-input"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={efectivoBS}
                onChange={(e) => setEfectivoBS(e.target.value)}
              />
            </div>
          </div>

          {/* Débito */}
          <div className="pu-section">
            <div className="pu-section-title">💳 Débito</div>
            <div className="pu-grid-2">
              <div className="pu-field">
                <label className="pu-label">Tarjeta (6 dígitos)</label>
                <input
                  type="text"
                  className="pu-input"
                  placeholder="000000"
                  maxLength={6}
                  value={debCard}
                  onChange={(e) => setDebCard(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <div className="pu-field">
                <label className="pu-label">Banco</label>
                <input
                  type="text"
                  className="pu-input"
                  placeholder="Nombre del banco"
                  value={debBanco}
                  onChange={(e) => setDebBanco(e.target.value)}
                />
              </div>
            </div>
            <div className="pu-field">
              <label className="pu-label">Monto</label>
              <input
                type="number"
                className="pu-input"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={debMonto}
                onChange={(e) => setDebMonto(e.target.value)}
              />
            </div>
          </div>

          {/* Divisa */}
          <div className="pu-section">
            <div className="pu-section-title">💵 Divisa</div>
            <div className="pu-field">
              <label className="pu-label">Monto en $</label>
              <input
                type="number"
                className="pu-input"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={divisaUSD}
                onChange={(e) => setDivisaUSD(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="pu-footer">
          <div className="pu-saldo-row">
            <span>SALDO BS</span>
            <span className={saldo <= 0 ? 'pu-saldo-ok' : 'pu-saldo-pend'}>
              {saldo <= 0 ? '0,00' : formatCurrency(saldo)}
            </span>
          </div>
          {saldo < 0 && (
            <div className="pu-vuelto-row">
              <span>Vuelto</span>
              <span>Bs {formatCurrency(Math.abs(saldo))}</span>
            </div>
          )}
          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn-confirm"
              onClick={handleConfirm}
              disabled={!hasAnyData || saldo > 0}
            >
              ✅ Grabar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
