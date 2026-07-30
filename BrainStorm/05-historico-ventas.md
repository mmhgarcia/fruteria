# 05 — Histórico de Ventas

> **Estado:** 🔍 En análisis
> **Prioridad:** Alta
> **Depende de:** N/A

---

## 🎯 Objetivo

Consultar, filtrar y exportar el histórico de ventas realizadas, con desglose por método de pago, fechas y productos.

---

## Estado Actual

Actualmente las ventas se guardan en IndexedDB (`fruteria-db`, store `sales`) pero **no hay interfaz de consulta**. El `SalesReportModal.jsx` existe pero su contenido está pendiente de desarrollar.

---

## Requerimientos

### Funcionalidades deseadas

| Funcionalidad | Prioridad | Descripción |
|--------------|-----------|-------------|
| Listado de ventas | Alta | Tabla cronológica con fecha, total $, total Bs, método |
| Filtro por fechas | Alta | Selector de rango (hoy, ayer, esta semana, custom) |
| Desglose por método | Alta | Totalizar: Efectivo $, Efectivo Bs, Pago Móvil, Punto, Divisa |
| Búsqueda | Media | Por producto, monto o método de pago |
| Exportar CSV | Media | Descargar listado para contabilidad |
| Reimprimir ticket | Baja | Botón para reimprimir un ticket de una venta pasada |
| Anular venta | Baja | Marcar una venta como anulada (requiere PIN) |

### Datos a mostrar por venta

- Fecha y hora
- # de ticket (secuencial)
- Productos (cantidad, descripción, precio unitario, subtotal)
- Total en USD
- Total convertido en Bs (con la tasa del momento)
- Método(s) de pago usado(s)
- IGTF (si aplicó)
- ID de instalación (origen)

---

## Diseño Técnico Propuesto

### Consultas a IndexedDB

```javascript
// Obtener ventas por rango de fechas
async function getSalesByDateRange(startDate, endDate) {
  const db = await openDB()
  const tx = db.transaction('sales', 'readonly')
  const store = tx.objectStore('sales')
  const all = await store.getAll()
  return all.filter(sale => {
    const date = new Date(sale.timestamp)
    return date >= startDate && date <= endDate
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}
```

### Estructura de una venta (actual)

```javascript
{
  id: 1,
  timestamp: "2026-07-30T10:30:00.000Z",
  items: [{ name, quantity, um, priceUSD, subtotalUSD }],
  totalUSD: 25.50,
  totalBS: 1874.25,
  tasaUsada: 73.50,
  pagos: [
    { metodo: 'Pago Movil', montoUSD: 10, montoBS: 735 },
    { metodo: 'Efectivo', montoUSD: 15.50, montoBS: 1139.25 }
  ],
  igtfAplicado: false,
  installId: "uuid-de-instalacion"
}
```

---

## UX Propuesta

- Modal de pantalla completa (estilo LogsViewer)
- Encabezado con selector de fechas
- Tabla con scroll vertical
- Totales acumulados en el footer del modal
- Botón "Exportar CSV"
- Botón "Reimprimir" (futuro)

---

## Archivos Relacionados

- `src/components/SalesReportModal.jsx` + `SalesReportModal.css`
- `src/utils/db.js` (store `sales`)
- `src/App.jsx`
