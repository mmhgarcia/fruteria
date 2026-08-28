# SPEC-008: Dinero y stock consistente (redondeo centralizado + validación)

> **Prioridad: P1 — ALTA (dinero/integridad)**

## 1. Problema (¿por qué?)
- El dinero se maneja en **floats sin redondear en el origen** (`App.jsx:265`, `inventory.js:83`, `dashboard.js:55`, `PaymentModal.jsx:23`): los reportes que suman `totalBS` crudo pueden descuadrar en centavos vs. lo mostrado/pagado.
- `formatCurrency` y `formatQty` **crashean** con string/NaN/undefined (`format.js:1-8`) — se usan en tickets y PDFs.
- El ajuste de inventario **nunca puede restar** (`inventory.js:146`) pese a que su contrato dice "suma o resta".
- Productos con `stock === null` (sin definir) se tratan como 0 en el descuento de stock (`inventory.js:256`) → nota de "stock insuficiente" sin serlo, por cada venta de un producto no trackeado.

## 2. Objetivo (¿qué logramos?)
- Dinero calculado y guardado con **un solo criterio de redondeo** (sin descuadres de centavos).
- Formateadores que **nunca crashean** ante datos raros.
- Inventario con capacidad de corregir a la baja (ajuste negativo) y con manejo correcto del estado "sin stock definido".

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Crear un helper central de **redondeo monetario** (ej. `redondearMoneda`, o trabajar en centavos enteros) y aplicarlo en origen (costo promedio, sumatorias, `totalBS`, `totalPagado`, `saldo`).
- [ ] Blindar `formatCurrency`/`formatQty`: aceptar solo números finitos, devolver '—' o '0' para NaN/undefined en vez de crashear.
- [ ] Permitir **ajuste a la baja** en inventario: aceptar cantidad negativa para `AJUSTE`, o signo separado del valor.
- [ ] Corregir `descontarStockVenta` y `nextStock` para tratar `stock === null` como sin límite (o estado "sin definir") y no como 0.
- [ ] Unificar la lógica de descuento de stock (eliminar la duplicación entre `nextStock` y `descontarStockVenta`).

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Cambiar el modelo de datos subyacente.
- ❌ Migrar a representación de centavos enteros en toda la app (si es que se decide; evaluar en §5).
- ❌ Validación de stock en edición del carrito (eso lo aborda SPEC-009).

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] ¿Redondear en origen a 2 decimales vs. trabajar en **centavos enteros** (más robusto, pero toca más código)?
- [ ] ¿Cuál es el criterio de redondeo exacto (truncar vs. redondear) para el IVA/IGTF opcional?
- [ ] ¿`stock === null` = "sin límite" o "no trackeado (no descuenta)"? Definir semántica única compartida.
- [ ] ¿Ajuste negativo: con `cantidad` negativo (cambiar `registrarMovimiento`) o con campo `signo`? Afecta el historial de movimientos y la UI.

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. `formatCurrency(undefined)` / `formatQty(NaN)` no crashean; devuelven un valor seguro.
2. Un producto vendido por peso (3 decimales) da el mismo total guardado que el mostrado en el ticket y en el reporte (sin descuadre de centavos).
3. En inventario puedo hacer un ajuste **negativo** (corregir a la baja) y el historial lo refleja con su signo.
4. Vendo un producto sin stock definido (`stock null`) → no genera falsa alerta de "stock insuficiente".
5. Los reportes de ventas cierran en centavos con la suma de los métodos de pago.

## 7. Archivos que probablemente tocaré
- `src/utils/format.js` — blindar formatCurrency/formatQty.
- `src/utils/inventory.js` — redondeo en origen, ajuste negativo, semántica de `stock null`, unificar descuento.
- `src/App.jsx` y `src/components/PaymentModal.jsx` — aplicar redondeo central a `totalBS`/`totalPagado`/`saldo`.
- `src/utils/dashboard.js` — redondeo en sumatorias.

## 8. Riesgos / notas
- **Impacto amplio:** tocar el redondeo afecta tickets, reportes y PDFs. Exige volver a verificar el flujo de cobro (SPEC-004) y correr tests (SPEC-003).
- Los reportes históricos ya guardados con floats crudos no se recalculan (principio de traza), lo que puede generar discrepancias vs. los nuevos. Documentar.

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
