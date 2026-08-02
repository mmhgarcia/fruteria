import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatQty } from './format'

const VERDE = [42, 106, 66]

function formatoFecha(d) {
  const partes = d.split('-')
  if (partes.length !== 3) return d
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function nombreArchivo(desde, hasta) {
  return `resumen-ventas-${desde}-a-${hasta}.pdf`
}

/**
 * Construye el documento PDF del resumen de ventas.
 */
export function generarPDF({ companyName, desde, hasta, modalidad, reporte }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  // ── Header ──
  doc.setFillColor(...VERDE)
  doc.rect(0, 0, pageWidth, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text((companyName || 'Frutería POS').toUpperCase(), margin, 11)
  doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-VE')}`, pageWidth - margin, 11, { align: 'right' })
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN DE VENTAS', margin, 22)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período: ${formatoFecha(desde)} al ${formatoFecha(hasta)}`, margin, 29)
  if (modalidad) {
    doc.text(`Modalidad: ${modalidad}`, pageWidth - margin, 29, { align: 'right' })
  }

  // ── Tarjetas de resumen ──
  const cards = [
    { label: 'Total Ventas', value: `${reporte.totalVentas} ${reporte.totalVentas === 1 ? 'operación' : 'operaciones'}` },
    { label: 'Ticket Promedio', value: `$${formatCurrency(reporte.ticketPromedio)}` },
    { label: 'Total USD', value: `$${formatCurrency(reporte.totalUSD)}` },
    { label: 'Total Bs', value: `Bs ${formatCurrency(reporte.totalBS)}` },
  ]

  const cardW = (pageWidth - margin * 2 - 8) / 2
  let y = 42

  cards.forEach((card, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = margin + col * (cardW + 8)
    const cy = y + row * 24
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(x, cy, cardW, 20, 2, 2, 'F')
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 5, cy + 8)
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 5, cy + 15)
  })
  y += 56

  // ── Desglose por método de pago ──
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Desglose por Método de Pago', margin, y)
  y += 3

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Método', 'USD', 'Bs']],
    body: reporte.metodos.length
      ? reporte.metodos.map((m) => [
          m.metodo,
          m.usd > 0 ? `$${formatCurrency(m.usd)}` : '—',
          m.bs > 0 ? `Bs ${formatCurrency(m.bs)}` : '—',
        ])
      : [['—', '—', '—']],
    foot: [['TOTALES', `$${formatCurrency(reporte.totalUSD)}`, `Bs ${formatCurrency(reporte.totalBS)}`]],
    headStyles: { fillColor: VERDE, fontSize: 9 },
    footStyles: { fillColor: [230, 235, 240], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    theme: 'grid',
  })

  // ── Productos vendidos ──
  const afterMetodos = doc.lastAutoTable.finalY
  y = afterMetodos + 12

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Productos Vendidos', margin, y)
  y += 3

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Producto', 'Cantidad', 'Total USD', 'Total Bs']],
    body: reporte.productos.length
      ? reporte.productos.map((p) => [
          p.nombre,
          `${formatQty(p.cant, p.um)} ${p.um}`,
          `$${formatCurrency(p.totalUSD)}`,
          `Bs ${formatCurrency(p.totalBS)}`,
        ])
      : [['—', '—', '—', '—']],
    foot: [['TOTALES', '', `$${formatCurrency(reporte.totalUSD)}`, `Bs ${formatCurrency(reporte.totalBS)}`]],
    headStyles: { fillColor: VERDE, fontSize: 9 },
    footStyles: { fillColor: [230, 235, 240], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index > 0) {
        data.cell.styles.halign = 'right'
      }
      if (data.section === 'foot' && data.column.index > 0) {
        data.cell.styles.halign = 'right'
      }
    },
    theme: 'striped',
  })

  // ── Footer ──
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Generado el ${new Date().toLocaleString('es-VE')} — Frutería POS`,
      margin,
      doc.internal.pageSize.getHeight() - 8
    )
  }

  return doc
}

function descargarBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Abre el PDF en una pestaña nueva (visión). Si el navegador lo bloquea, descarga.
 */
export function exportarPDF(opts) {
  const doc = generarPDF(opts)
  const filename = nombreArchivo(opts.desde, opts.hasta)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    descargarBlob(blob, filename)
  }
}

/**
 * Descarga el PDF directamente al dispositivo.
 */
export function descargarPDF(opts) {
  const doc = generarPDF(opts)
  descargarBlob(doc.output('blob'), nombreArchivo(opts.desde, opts.hasta))
}

/**
 * Comparte el PDF vía el menú nativo del sistema (Web Share API).
 * En el móvil permite enviarlo por WhatsApp, correo, guardarlo en archivos, etc.
 * Si la compartición no está disponible, descarga el archivo como alternativa.
 */
export async function compartirPDF(opts) {
  const doc = generarPDF(opts)
  const filename = nombreArchivo(opts.desde, opts.hasta)
  const blob = doc.output('blob')

  const file = new File([blob], filename, { type: 'application/pdf' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: 'Resumen de ventas',
      })
      return
    } catch (error) {
      if (error.name === 'AbortError') return
    }
  }

  descargarBlob(blob, filename)
}

// ═══════════════════════════════════════════════════════════
// 🏆 Productos Más Vendidos
// ═══════════════════════════════════════════════════════════

function nombreArchivoBestSelling(desde, hasta) {
  return `productos-mas-vendidos-${desde}-a-${hasta}.pdf`
}

function generarBestSellingPDF({ companyName, desde, hasta, modalidad, reporte }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const { ranking, totalProductos, totalUnidades, totalIngresos, top1 } = reporte

  // ── Header ──
  doc.setFillColor(...VERDE)
  doc.rect(0, 0, pageWidth, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text((companyName || 'Frutería POS').toUpperCase(), margin, 11)
  doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-VE')}`, pageWidth - margin, 11, { align: 'right' })
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('PRODUCTOS MÁS VENDIDOS', margin, 22)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período: ${formatoFecha(desde)} al ${formatoFecha(hasta)}`, margin, 29)
  if (modalidad) {
    doc.text(`Modalidad: ${modalidad}`, pageWidth - margin, 29, { align: 'right' })
  }

  // ── Tarjetas de resumen ──
  const cards = [
    { label: 'Productos', value: String(totalProductos) },
    { label: 'Unidades', value: formatQty(totalUnidades, 'unidad') },
    { label: 'Ingresos USD', value: `$${formatCurrency(totalIngresos)}` },
  ]
  const cardW = (pageWidth - margin * 2 - 12) / 3
  let y = 42
  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 6)
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(x, y, cardW, 20, 2, 2, 'F')
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 4, y + 8)
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 4, y + 15)
  })
  y += 28

  // ── Producto estrella ──
  if (top1) {
    doc.setFillColor(254, 243, 199)
    doc.setDrawColor(245, 158, 11)
    doc.setLineWidth(0.4)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'FD')
    doc.setTextColor(120, 53, 15)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('🥇 PRODUCTO ESTRELLA', margin + 4, y + 7)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(30, 30, 30)
    doc.text(top1.nombre, margin + 4, y + 14)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 53, 15)
    const cantTxt = `${formatQty(top1.cant, top1.um)} ${top1.um}`
    const usdTxt = `$${formatCurrency(top1.totalUSD)}`
    doc.text(cantTxt, pageWidth - margin - 4, y + 14, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text(usdTxt, pageWidth - margin - 4, y + 8, { align: 'right' })
    y += 26
  }

  // ── Tabla ranking ──
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Ranking de Ventas', margin, y)
  y += 3

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Producto', 'Cantidad', 'Ingresos USD']],
    body: ranking.length
      ? ranking.map((p, idx) => {
          const pos = idx + 1
          const prefijo = pos === 1 ? '🥇 ' : pos === 2 ? '🥈 ' : pos === 3 ? '🥉 ' : ''
          return [
            prefijo + pos,
            p.nombre,
            `${formatQty(p.cant, p.um)} ${p.um}`,
            `$${formatCurrency(p.totalUSD)}`,
          ]
        })
      : [['—', '—', '—', '—']],
    foot: [['TOTALES', '', formatQty(totalUnidades, 'unidad'), `$${formatCurrency(totalIngresos)}`]],
    headStyles: { fillColor: VERDE, fontSize: 9 },
    footStyles: { fillColor: [230, 235, 240], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { halign: 'center', cellWidth: 18 }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    didParseCell: (data) => {
      if (data.section === 'head' && (data.column.index === 2 || data.column.index === 3)) {
        data.cell.styles.halign = 'right'
      }
      if (data.section === 'foot' && (data.column.index === 2 || data.column.index === 3)) {
        data.cell.styles.halign = 'right'
      }
      if (data.section === 'body' && data.column.index === 0 && data.row.index < 3) {
        data.cell.styles.fontStyle = 'bold'
      }
    },
    theme: 'striped',
  })

  // ── Footer ──
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Generado el ${new Date().toLocaleString('es-VE')} — Frutería POS`,
      margin,
      doc.internal.pageSize.getHeight() - 8
    )
  }

  return doc
}

export function exportarBestSellingPDF(opts) {
  const doc = generarBestSellingPDF(opts)
  const filename = nombreArchivoBestSelling(opts.desde, opts.hasta)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    descargarBlob(blob, filename)
  }
}

export function descargarBestSellingPDF(opts) {
  const doc = generarBestSellingPDF(opts)
  descargarBlob(doc.output('blob'), nombreArchivoBestSelling(opts.desde, opts.hasta))
}

export async function compartirBestSellingPDF(opts) {
  const doc = generarBestSellingPDF(opts)
  const filename = nombreArchivoBestSelling(opts.desde, opts.hasta)
  const blob = doc.output('blob')

  const file = new File([blob], filename, { type: 'application/pdf' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: 'Productos más vendidos',
      })
      return
    } catch (error) {
      if (error.name === 'AbortError') return
    }
  }

  descargarBlob(blob, filename)
}
