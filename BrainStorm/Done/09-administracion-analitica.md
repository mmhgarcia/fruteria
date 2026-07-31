# 09 — Administración y Analítica

> **Estado:** ✅ Completado
> **Prioridad:** Media
> **Depende de:** 05

---

## 🎯 Objetivo

Proveer herramientas de administración y cierre de caja: reportes financieros, desglose por método de pago, filtros de fecha y exportación de datos.

---

## Implementado

### ~~Selector de Fechas con Calendario~~
- Inputs `<input type="date">` con calendario nativo en Desde y Hasta
- Presets: Ayer, Hoy, Semana, Mes — calculan el rango real
- Default: Hoy al abrir
- Editar un calendario deselecciona los presets (modo personalizado implícito)
- Lógica en `calcularRango()` dentro de `SalesReportModal.jsx`

### ~~Datos Reales desde IndexedDB~~
- Carga de ventas con `getSalesByDateRange()` al abrir y al cambiar el rango
- Filtro real por rango de fechas (desde 00:00 hasta 23:59:59 del día final)
- Tarjetas calculadas: Total Ventas, Ticket Promedio, Total USD, Total Bs
- Desglose por método de pago real: Efectivo $, Efectivo Bs, Pago Móvil, Punto
- Productos vendidos agregados por producto (cantidad, total USD, total Bs)
- Paginación real (8 productos por página) y estados de carga/vacío

### ~~Exportación a PDF~~
- Botón "Ver PDF": genera el reporte con jsPDF (offline, sin servidor) y lo abre en pestaña nueva; si el navegador lo bloquea, descarga
- Botón "Descargar": guarda el PDF en el dispositivo
- Botón "Compartir": menú nativo del sistema vía Web Share API (WhatsApp, correo, archivos…); fallback a descarga
- Contenido: empresa + fecha de emisión, título RESUMEN DE VENTAS, período, modalidad, tarjetas de resumen, desglose por método (con TOTALES), productos vendidos (con fila TOTALES en $ y Bs)
- Columnas numéricas alineadas a la derecha; producto sin icono
- `src/utils/pdfExport.js`

### ~~Interfaz Visual~~
- Tarjetas de resumen (Total Ventas, Ticket Promedio, Total USD, Total Bs)
- Tabla de desglose por método de pago (sin columna Total)
- Tabla paginada de productos vendidos
- Secciones colapsables (Dashboard abierto por defecto)

---

## Ideas Futuras (fuera de alcance)

- [ ] Productos más vendidos (top 10)
- [ ] Ventas por categoría
- [ ] Ventas por hora del día (picos de atención)
- [ ] Comparativa vs semana anterior
- [ ] Validación de decimales y ceros: revisar redondeo en `formatCurrency()` y `formatQty()` (caso lechuga: ítems con 0 unidades pero con ingresos)
- [ ] IGTF real (hoy el dato no se registra en la venta, siempre muestra "No aplicado")

---

## Archivos Relacionados

- `src/components/SalesReportModal.jsx` + `SalesReportModal.css`
- `src/components/SettingsModal.jsx`
- `src/utils/db.js` (store `sales`)
- `src/utils/format.js`
- `src/utils/pdfExport.js`
