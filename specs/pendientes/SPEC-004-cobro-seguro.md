# SPEC-004: Cobro seguro (sin pérdida de venta ni cobros duplicados)

> **Prioridad: P0 — CRÍTICA (dinero)**

## 1. Problema (¿por qué?)
El flujo de cobro tiene 3 fallas que pueden costar plata al negocio:
- Si `addSale` falla, **igual se limpia el carrito y se muestra ticket de éxito** → venta cobrada sin registro (pérdida total).
- El botón "Grabar" **no se deshabilita mientras procesa** → doble clic = venta duplicada y doble descuento de stock.
- La venta y el descuento de stock son **transacciones separadas** → si falla el stock, queda venta registrada con inventario descuadrado.

## 2. Objetivo (¿qué logramos?)
Que el cobro sea **seguro y atómico**: no se puede perder una venta ni duplicarla, y si algo falla, la app lo informa y deja el carrito intacto para reintentar.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Guardia de **reentrancia** en `completePayment` / botón "Grabar": deshabilitar mientras procesa; ignorar clicks adicionales.
- [ ] Mover `setCart([])`, `setPreviewOpen`, `setLastSale` **dentro** del flujo de éxito, y solo tras confirmar persistencia. Si falla, mostrar error claro y **no limpiar el carrito**.
- [ ] Hacer **atómica** la venta + descuento de stock (una sola transacción IndexedDB o secuencia que revierta la venta si el stock falla).
- [ ] Mostrar mensaje claro si la venta no se pudo guardar (ej. almacenamiento lleno) en vez de ticket de éxito.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Rediseñar la UI del cobro.
- ❌ Cobros con tarjeta/API externa.
- ❌ Sincronización entre cajas.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] ¿El descuento de stock debe ser parte de la MISMA transacción que `addSale`, o revertimos la venta como compensación? (Recomendado: misma transacción; más simple y correcta.)
- [ ] Debido a `addSale` y el descuento viven en módulos distintos (`db.js` e `inventory.js`), ¿los unificamos o creamos una función `registrarVentaAtomica`?
- [ ] El carrito se restaura desde `localStorage` al recargar. Si una venta fue cobrada pero falló el guardado, ¿reintentar al recargar o descartar? (Recomendado: mantener el carrito hasta confirmar).

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Doble clic rápido en "Grabar" → se guarda **una sola** venta y se descuenta el stock **una sola vez**.
2. Si fuerzo un error al guardar (ej. DB llena), la app muestra error, **no** muestra ticket de éxito, y el carrito sigue con lo comprado.
3. Si el descuento de stock falla, la venta no queda huérfana: o no se guarda, o se revierte.
4. Tras cobrar, el ticket se muestra solo cuando la venta realmente quedó registrada.

## 7. Archivos que probablemente tocaré
- `src/App.jsx` — `completePayment` (reentrancia, flujo de éxito/error).
- `src/components/PaymentModal.jsx` — deshabilitar botón mientras procesa.
- `src/utils/db.js` y `src/utils/inventory.js` — atomicidad venta + stock.

## 8. Riesgos / notas
- **Es el cambio más delicado**: toca el corazón de la app (dinero). Exige tests (ver SPEC-003) y pruebas manuales antes de publicar.
- El `addLog` con `.catch(() => {})` y el log roto (SPEC-005) enmascaran errores de stock; conviene arreglar logs primero o en paralelo.
- `Item.totalUSD` usa el precio viejo si cambió tras agregar al carrito; esto se aborda en SPEC-008, pero no debe confundir los tests de cobro.

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
