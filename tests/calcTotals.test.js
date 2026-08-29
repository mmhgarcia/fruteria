import { describe, it, expect } from 'vitest'
import { calcularTotales } from '../src/utils/calcTotals'

describe('calcularTotales', () => {
  it('calcula el total cuando el carrito está vacío', () => {
    expect(calcularTotales([], 36.5)).toEqual({ totalUSD: 0, totalBS: 0, count: 0 })
  })

  it('suma totalUSD y multiplica por la tasa para totalBS', () => {
    const carrito = [
      { id: 1, totalUSD: 10 },
      { id: 2, totalUSD: 5.5 },
    ]
    const res = calcularTotales(carrito, 36.5)
    expect(res.totalUSD).toBe(15.5)
    expect(res.totalBS).toBe(15.5 * 36.5)
    expect(res.count).toBe(2)
  })

  it('trata items sin totalUSD como cero', () => {
    expect(calcularTotales([{}, { totalUSD: undefined }], 36.5)).toEqual({
      totalUSD: 0,
      totalBS: 0,
      count: 2,
    })
  })

  it('usa tasa 0 si no viene una válida', () => {
    expect(calcularTotales([{ totalUSD: 10 }], NaN).totalBS).toBe(0)
  })

  it('ignora inputs no-array', () => {
    expect(calcularTotales(undefined, 36.5)).toEqual({ totalUSD: 0, totalBS: 0, count: 0 })
  })
})
