// Lógica pura de pagos mixtos y vuelto. Sin dependencias de UI ni IndexedDB.
// Se extrajo de PaymentModal.jsx para hacerla testeable.

/**
 * Redondea a 2 decimales una cantidad de dinero (mismo criterio que la app).
 * @param {number} value
 * @returns {number}
 */
export function redondear2(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

/**
 * Suma los montos en Bs de los métodos de pago.
 * La divisa (USD) se convierte a Bs con la tasa.
 * @param {object} p - Montos crudos.
 * @param {number} p.pagomovilMonto
 * @param {number} p.puntoMonto
 * @param {number} p.divisaUSD
 * @param {number} p.efectivoBS
 * @param {number} tasa
 * @returns {number}
 */
export function totalPagado({ pagomovilMonto, puntoMonto, divisaUSD, efectivoBS }, tasa) {
  const pm = parseFloat(pagomovilMonto) || 0
  const pt = parseFloat(puntoMonto) || 0
  const dv = (parseFloat(divisaUSD) || 0) * (Number(tasa) || 0)
  const ef = parseFloat(efectivoBS) || 0
  return redondear2(pm + pt + dv + ef)
}

/**
 * Diferencia (saldo) entre el total a pagar en Bs y lo abonado.
 * @param {number} totalBS
 * @param {number} totalPagado
 * @returns {number}
 */
export function calcularSaldo(totalBS, totalPagado) {
  return redondear2((Number(totalBS) || 0) - (Number(totalPagado) || 0))
}

/**
 * Vuelto a devolver: solo si el cliente pagó de más (saldo negativo).
 * @param {number} saldo
 * @returns {number}
 */
export function calcularVuelto(saldo) {
  return redondear2(saldo) < 0 ? Math.abs(redondear2(saldo)) : 0
}

/**
 * Indica si el pago se puede confirmar.
 * @param {number} totalPagado
 * @param {number} saldo
 * @returns {boolean}
 */
export function pagoEsValido(totalPagado, saldo) {
  return totalPagado > 0 && saldo <= 0
}
