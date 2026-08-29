import { describe, it, expect } from 'vitest'
import { redondear2, totalPagado, calcularSaldo, calcularVuelto, pagoEsValido } from '../src/utils/pagos'

describe('redondear2', () => {
  it('redondea a 2 decimales', () => {
    expect(redondear2(10.555)).toBe(10.56)
    expect(redondear2(0.1 + 0.2)).toBe(0.3)
  })
  it('trata valores no numéricos como 0', () => {
    expect(redondear2(null)).toBe(0)
    expect(redondear2('abc')).toBe(0)
  })
})

describe('totalPagado', () => {
  const tasa = 36.5
  it('suma los métodos en Bs y convierte la divisa con la tasa', () => {
    const res = totalPagado(
      { pagomovilMonto: 100, puntoMonto: 50, divisaUSD: 2, efectivoBS: 30 },
      tasa
    )
    // 100 + 50 + (2*36.5) + 30 = 253
    expect(res).toBe(253)
  })
  it('devuelve 0 sin ningún método', () => {
    expect(totalPagado({}, tasa)).toBe(0)
  })
  it('convierte divisa sin tasa (tasa 0) como 0 Bs', () => {
    expect(totalPagado({ divisaUSD: 5, efectivoBS: 10 }, 0)).toBe(10)
  })
})

describe('calcularSaldo', () => {
  it('positivo si falta por pagar', () => {
    expect(calcularSaldo(100, 80)).toBe(20)
  })
  it('negativo si se pagó de más (habrá vuelto)', () => {
    expect(calcularSaldo(100, 150)).toBe(-50)
  })
  it('cero en pago exacto', () => {
    expect(calcularSaldo(100, 100)).toBe(0)
  })
})

describe('calcularVuelto', () => {
  it('devuelve el abs de un saldo negativo', () => {
    expect(calcularVuelto(-50)).toBe(50)
  })
  it('devuelve 0 si no hay excedente', () => {
    expect(calcularVuelto(0)).toBe(0)
    expect(calcularVuelto(20)).toBe(0)
  })
})

describe('pagoEsValido', () => {
  it('válido con pago y saldo <= 0', () => {
    expect(pagoEsValido(100, 0)).toBe(true)
    expect(pagoEsValido(150, -50)).toBe(true)
  })
  it('inválido sin pago o con saldo pendiente', () => {
    expect(pagoEsValido(0, 0)).toBe(false)
    expect(pagoEsValido(80, 20)).toBe(false)
  })
})
