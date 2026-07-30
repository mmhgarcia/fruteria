# 03 — Flujo de Cobranza

> **Estado:** ✅ Completado
> **Prioridad:** Alta
> **Depende de:** 01, 02

---

## 🎯 Objetivo

Sistema de cobro multimoneda adaptado al mercado venezolano, con soporte para pagos mixtos, cálculo de vuelto e IGTF opcional.

---

## Implementado

### ~~Pago Móvil~~
- Reemplazo de "QR / Yape" (Perú) por "Pago Móvil" (Venezuela)
- Botón principal en PaymentModal

### ~~Efectivo Multimoneda~~
- Botón "Efectivo" abre dos campos: monto en Dólares ($) y monto en Bolívares (Bs)
- El cajero registra cuánto dinero físico recibe en cada moneda

### ~~Pagos Mixtos~~
- Selector de métodos que permite abonar montos parciales
- Combinaciones: Pago Móvil + Efectivo, Punto + Divisa, etc.
- Se salda la cuenta hasta llegar a cero

### ~~Módulo de Vuelto~~
- Calcula el vuelto exacto en la moneda que el comerciante disponga
- Muestra: "Vuelto: $X,XX" o "Vuelto: Bs X.XXX,XX"
- Se actualiza dinámicamente al ingresar montos

### ~~Registro del Método de Pago~~
- El ticket final plasma cómo pagó el cliente (efectivo, pago móvil, punto, divisa)
- Desglose por método en el ticket impreso

---

## Pendiente / Ideas

### IGTF (Impuesto del 3%)
> _Estado: En análisis_

- [ ] Interruptor en Configuración para activar/desactivar IGTF
- [ ] Cálculo automático del 3% sobre operaciones en Bolívares
- [ ] Mostrar línea "IGTF 3%" en el ticket antes del total
- [ ] Aplicable solo si el negocio es contribuyente especial

### Desglose Multimoneda por Ítem
> _Estado: En análisis_

- [ ] Mostrar en cada línea del ticket el costo en ambas monedas
- [ ] Ej: `Lechuga  1 un  $1,50  Bs 42,75`
- [ ] Requiere mejorar el ancho del ticket o usar dos líneas por ítem

### Mejoras futuras
- [ ] Tarjeta de débito/crédito como método separado (no solo "Punto")
- [ ] Transferencia bancaria (por si el cliente hace depósito directo)
- [ ] Propina opcional (porcentaje configurable)

---

## Archivos Relacionados

- `src/components/PaymentModal.jsx` + `PaymentModal.css`
- `src/App.jsx` (lógica de cobro)
- `src/utils/format.js`
