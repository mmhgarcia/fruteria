# 02 — Carrito y Ticket de Venta

> **Estado:** ✅ Completado
> **Prioridad:** Alta
> **Depende de:** 01

---

## 🎯 Objetivo

Experiencia fluida de carrito de compras lateral, edición rápida de ítems, y ticket preview para impresión.

---

## Implementado

### ~~Edición Rápida~~
- Tocar la fila de un producto en el carrito → reabre el teclado numérico con el valor actual
- Permite corregir kilos/unidades sin eliminar el ítem
- Flujo: tocar fila → WeightModal → modificar cantidad → actualizar en carrito

### ~~Homogeneización de Decimales~~
- Formato Venezuela: coma para decimales (`,`), punto para miles (`.`)
- `$3,50` y `Bs 2.580,97`
- Centralizado en `src/utils/format.js` → `formatCurrency()` y `formatQty()`

### ~~TicketPreview~~
- Modal independiente que muestra el ticket completo antes de imprimir
- Incluye: nombre empresa, fecha, productos, cantidades, precios, totales por método de pago
- Estilo Courier/monospace
- Botón imprimir y cerrar

---

## Pendiente / Ideas

### Mejoras al TicketPreview
- [ ] Footer con ID de instalación y versión de la app → _ver [13-identificacion-app.md](13-identificacion-app.md)_
- [ ] Código QR con resumen de la venta (para contabilidad)
- [ ] Opción de ticket reducido (solo nombres y totales)

### Funcionalidades extra
- [ ] Historial de tickets recientes desde el carrito (últimas 5 ventas)
- [ ] Posibilidad de anular una venta desde el ticket preview (con PIN)

---

## Archivos Relacionados

- `src/components/CartModal.jsx` + `CartModal.css`
- `src/components/Ticket.jsx` + `Ticket.css`
- `src/components/TicketPreview.jsx` + `TicketPreview.css`
- `src/components/WeightModal.jsx`
- `src/utils/format.js`
