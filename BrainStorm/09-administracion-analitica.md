# 09 — Administración y Analítica

> **Estado:** 🔍 En análisis
> **Prioridad:** Media
> **Depende de:** 05

---

## 🎯 Objetivo

Proveer herramientas de administración y cierre de caja: reportes financieros, desglose por método de pago, filtros de fecha y exportación de datos.

---

## Pendiente / Ideas

### Desglose Financiero en Resumen
- El resumen de ventas debe totalizar el dinero clasificado por cada método de pago:
  - Efectivo $
  - Efectivo Bs
  - Pago Móvil
  - Punto/Divisa
- Mostrar subtotales por método y gran total

### Filtro de Fechas
- Selector de calendario en el resumen diario
- Presets: Hoy, Ayer, Esta Semana, Este Mes, Personalizado
- Permitir auditorías de días anteriores, semanas o meses

### Validación de Decimales y Ceros
- Corregir errores de truncado: ítems con 0 unidades pero con ingresos generados
- Ejemplo reportado: caso de la lechuga
- Revisar redondeo en `formatCurrency()` y `formatQty()`

### Reportes adicionales (futuro)
- [ ] Productos más vendidos (top 10)
- [ ] Ventas por categoría
- [ ] Ventas por hora del día (picos de atención)
- [ ] Comparativa vs semana anterior
- [ ] Ticket promedio
- [ ] Exportar a PDF (descargable)

---

## Diseño Técnico Propuesto

### Estructura del reporte

```javascript
const reporte = {
  rango: { desde: "2026-07-01", hasta: "2026-07-30" },
  resumen: {
    totalVentas: 150,
    totalUSD: 1250.00,
    totalBS: 91875.00,
    ticketPromedioUSD: 8.33,
  },
  metodosPago: {
    efectivoUSD: 450.00,
    efectivoBS: 18000.00,
    pagoMovilUSD: 500.00,
    pagoMovilBS: 36750.00,
    puntoUSD: 200.00,
    puntoBS: 14700.00,
    divisaUSD: 100.00,
  },
  igtfTotal: {
    aplicado: false,
    montoBS: 0,
  },
  productos: [
    { nombre: "Lechuga", cantidad: 45, totalUSD: 67.50 },
    // ...
  ]
}
```

---

## Archivos Relacionados

- `src/components/SalesReportModal.jsx` + `SalesReportModal.css`
- `src/components/SettingsModal.jsx`
- `src/utils/db.js` (store `sales`)
- `src/utils/format.js`
