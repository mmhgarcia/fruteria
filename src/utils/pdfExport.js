import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatQty } from './format'

const VERDE = [42, 106, 66]

function formatoFecha(d) {
  const partes = d.split('-')
  if (partes.length !== 3) return d
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

/**
 * Genera y abre/descarga el PDF del resumen de ventas.
 * Funciona offline y desde el móvil: el PDF se crea en el dispositivo
 * y se abre en una pestaña nueva (o se descarga si el navegador lo bloquea).
 */
export function exportarPDF({ companyName, desde, hasta, reporte }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  // ── Header ──
  doc.setFillColor(...VERDE)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text((companyName || 'Frutería POS').toUpperCase(), margin, 13)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Resumen de Ventas', margin, 20)
  doc.setFontSize(9)
  doc.text(`Período: ${formatoFecha(desde)} al ${formatoFecha(hasta)}`, margin, 25)

  // ── Tarjetas de resumen ──
  const cards = [
    { label: 'Total Ventas', value: `${reporte.totalVentas} ${reporte.totalVentas === 1 ? 'operación' : 'operaciones'}` },
    { label: 'Ticket Promedio', value: `$${formatCurrency(reporte.ticketPromedio)}` },
    { label: 'Total USD', value: `$${formatCurrency(reporte.totalUSD)}` },
    { label: 'Total Bs', value: `Bs ${formatCurrency(reporte.totalBS)}` },
  ]

  const cardW = (pageWidth - margin * 2 - 8) / 2
  let y = 36

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
          `${p.icon} ${p.nombre}`,
          `${formatQty(p.cant, p.um)} ${p.um}`,
          `$${formatCurrency(p.totalUSD)}`,
          `Bs ${formatCurrency(p.totalBS)}`,
        ])
      : [['—', '—', '—', '—']],
    headStyles: { fillColor: VERDE, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
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

  // ── Abrir / descargar desde el móvil ──
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    const a = document.createElement('a')
    a.href = url
    a.download = `resumen-ventas-${desde}-a-${hasta}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}
