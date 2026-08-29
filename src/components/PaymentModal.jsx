import { useState, useMemo } from 'react'
import { formatCurrency } from '../utils/format'
import { totalPagado, calcularSaldo, calcularVuelto, pagoEsValido } from '../utils/pagos'
import './PaymentModal.css'

function PaymentModal({ totals, tasa, onClose, onConfirm }) {
  const [pmRef, setPmRef] = useState('')
  const [pmBanco, setPmBanco] = useState('')
  const [pmMonto, setPmMonto] = useState('')
  const [puntoCard, setPuntoCard] = useState('')
  const [puntoBanco, setPuntoBanco] = useState('')
  const [puntoMonto, setPuntoMonto] = useState('')
  const [divisaUSD, setDivisaUSD] = useState('')
  const [efectivoBS, setEfectivoBS] = useState('')

  const today = new Date()
  const fechaStr = today.toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  })

  const totalPagado = useMemo(
    () => totalPagado({ pagomovilMonto: pmMonto, puntoMonto, divisaUSD, efectivoBS }, tasa),
    [pmMonto, puntoMonto, divisaUSD, efectivoBS, tasa]
  )

  const saldo = calcularSaldo(totals.totalBS, totalPagado)
  const saldoDisplay = saldo <= 0 ? 0 : saldo

  const handleConfirm = () => {
    if (!pagoEsValido(totalPagado, saldo)) {
      if (totalPagado <= 0) {
        alert('Debes registrar al menos un método de pago.')
        return
      }
      if (saldo > 0) {
        alert(`Faltan Bs ${formatCurrency(saldo)} para completar el pago.`)
        return
      }
      return
    }
    const vuelto = calcularVuelto(saldo)
    onConfirm({
      pagomovilRef: pmRef,
      pagomovilBanco: pmBanco,
      pagomovilMonto: parseFloat(pmMonto) || 0,
      puntoCard: puntoCard,
      puntoBanco: puntoBanco,
      puntoMonto: parseFloat(puntoMonto) || 0,
      divisaUSD: parseFloat(divisaUSD) || 0,
      efectivoBS: parseFloat(efectivoBS) || 0,
      totalPagado,
      vuelto,
    })
  }

  const hasAnyData = totalPagado > 0

  return (
    <div className="modal-overlay active overlay-payment" onClick={onClose}>
      <div className="modal payment-unified" onClick={(e) => e.stopPropagation()}>
        <div className="pu-header">
          <div className="pu-header-title">CONFIRMAR PAGO</div>
          <hr className="pu-divider" />
          <div className="pu-header-meta">
            <span>FECHA: {fechaStr}</span>
            <span>TASA: {formatCurrency(tasa)}</span>
          </div>
          <div className="pu-total-ticket">
            MONTO BS: {formatCurrency(totals.totalBS)}
          </div>
          <div className="pu-saldo-header">
            Saldo Bs. {formatCurrency(saldoDisplay)}
          </div>
          <hr className="pu-divider" />
        </div>

        <div className="pu-body">
          {/* PAGO MOVIL */}
          <div className="pu-section" data-method="pagomovil">
            <div className="pu-section-title">PAGO MOVIL</div>
            <div className="pu-field">
              <label className="pu-label">Referencia:</label>
              <input
                type="text"
                className="pu-input"
                placeholder="----------------"
                value={pmRef}
                onChange={(e) => setPmRef(e.target.value)}
              />
            </div>
            <div className="pu-field">
              <label className="pu-label">Banco:</label>
              <input
                type="text"
                className="pu-input"
                placeholder="-------------------"
                value={pmBanco}
                onChange={(e) => setPmBanco(e.target.value)}
              />
            </div>
            <div className="pu-field">
              <label className="pu-label">Monto Bs:</label>
              <input
                type="number"
                className="pu-input"
                placeholder="xxx.xxx,00"
                min="0"
                step="0.01"
                value={pmMonto}
                onChange={(e) => setPmMonto(e.target.value)}
              />
            </div>
          </div>

          {/* PUNTO */}
          <div className="pu-section" data-method="punto">
            <div className="pu-section-title">PUNTO DE VENTA</div>
            <div className="pu-field">
              <label className="pu-label">Tarjeta (6 ult. digitos):</label>
              <input
                type="text"
                className="pu-input"
                placeholder="000000"
                maxLength={6}
                value={puntoCard}
                onChange={(e) => setPuntoCard(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <div className="pu-field">
              <label className="pu-label">Banco:</label>
              <input
                type="text"
                className="pu-input"
                placeholder="-------------------"
                value={puntoBanco}
                onChange={(e) => setPuntoBanco(e.target.value)}
              />
            </div>
            <div className="pu-field">
              <label className="pu-label">Monto Bs:</label>
              <input
                type="number"
                className="pu-input"
                placeholder="xxx.xxx,00"
                min="0"
                step="0.01"
                value={puntoMonto}
                onChange={(e) => setPuntoMonto(e.target.value)}
              />
            </div>
          </div>

          {/* DIVISA */}
          <div className="pu-section" data-method="divisa">
            <div className="pu-section-title">DIVISA (USD)</div>
            <div className="pu-field">
              <label className="pu-label">Monto $:</label>
              <input
                type="number"
                className="pu-input"
                placeholder="xxx.xxx,00"
                min="0"
                step="0.01"
                value={divisaUSD}
                onChange={(e) => setDivisaUSD(e.target.value)}
              />
            </div>
          </div>

          {/* EFECTIVO */}
          <div className="pu-section" data-method="efectivo">
            <div className="pu-section-title">EFECTIVO BS</div>
            <div className="pu-field">
              <label className="pu-label">Monto Bs:</label>
              <input
                type="number"
                className="pu-input"
                placeholder="xxx.xxx,00"
                min="0"
                step="0.01"
                value={efectivoBS}
                onChange={(e) => setEfectivoBS(e.target.value)}
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
