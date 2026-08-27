// filepath: src/utils/dateRange.js
// Utilidades de cálculo de rangos de fechas y conversión a intervalos.
// Reutilizadas por los reportes con presets (Hoy / Semana / Mes).

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Devuelve el rango (desde/hasta como YYYY-MM-DD) según el preset.
 * @param {'Hoy'|'Semana'|'Mes'|string} preset
 * @returns {{desde: string, hasta: string} | null}
 */
export function calcularRango(preset) {
  const hoy = new Date()
  const fin = new Date(hoy)
  let inicio

  switch (preset) {
    case 'Hoy':
      inicio = hoy
      break
    case 'Semana': {
      const diaSem = hoy.getDay()
      const diff = diaSem === 0 ? 6 : diaSem - 1
      inicio = new Date(hoy)
      inicio.setDate(hoy.getDate() - diff)
      break
    }
    case 'Mes':
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      break
    default:
      return null
  }

  return { desde: toDateStr(inicio), hasta: toDateStr(fin) }
}

/**
 * Convierte un rango YYYY-MM-DD a un intervalo { start, end } (Date).
 * @param {string} desde
 * @param {string} hasta
 */
export function rangoAIntervalo(desde, hasta) {
  return {
    start: new Date(`${desde}T00:00:00`),
    end: new Date(`${hasta}T23:59:59.999`),
  }
}