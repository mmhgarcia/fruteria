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
- [x] Guardia de **reentrancia** en `completePayment` / botón "Grabar": deshabilitar mientras procesa; ignorar clicks adicionales.
- [x] Mover `setCart([])`, `setPreviewOpen`, `setLastSale` **dentro** del flujo de éxito, y solo tras confirmar persistencia. Si falla, mostrar error claro y **no limpiar el carrito**.
- [x] Hacer **atómica** la venta + descuento de stock (una sola transacción IndexedDB o secuencia que revierta la venta si el stock falla).
- [x] Mostrar mensaje claro si la venta no se pudo guardar (ej. almacenamiento lleno) en vez de ticket de éxito.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Rediseñar la UI del cobro.
- ❌ Cobros con tarjeta/API externa.
- ❌ Sincronización entre cajas.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [x] ¿El descuento de stock debe ser parte de la MISMA transacción que `addSale`, o revertimos la venta como compensación? — **RESUELTO**: misma transacción IndexedDB sobre `['sales', 'products', 'stock_movements']`. Atomicidad real (no Saga/compensación). Las ventas históricas siguen usando `addSale` para reportes.
- [x] ¿Unificamos `db.js` e `inventory.js` o creamos una función `registrarVentaAtomica`? — **RESUELTO**: crear `registrarVentaAtomica` en `inventory.js`. `db.js` mantiene las primitivas CRUD (`addSale`, etc.) para otros consumidores (reportes, dashboard); no se toca.
- [x] Si una venta fue cobrada pero falló el guardado, ¿reintentar al recargar o descartar? — **RESUELTO**: no se necesita lógica especial. `setCart([])` solo se ejecuta en el `oncomplete` de la transacción; si falla, el carrito persiste (vive en `localStorage`) y se reintenta con el mismo botón. Si la tx tuvo éxito, el carrito ya está vacío.

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
- [x] Totalmente definida — pendiente de aprobar
- [x] Aprobada / en implementación
- [x] Done

## 10. Plan de implementación acordado

> Pasos en orden de menor a mayor riesgo. Cada paso termina con tests pasando.

**Paso 1+2 — Reentrancia + flujo de éxito (sin tocar DB)**
- `PaymentModal.jsx`: recibir prop `submitting` (o estado local) que deshabilita "Grabar" mientras procesa; ignorar clicks adicionales.
- `App.jsx` `completePayment`: estado `processing`; envolver el flujo de éxito (`setCart([])`, `setPreviewOpen`, `setLastSale`, refrescar productos) dentro de un bloque que solo se ejecuta tras éxito. Mostrar `alert` claro si falla. NO limpiar carrito en caso de error.

**Paso 3 — `registrarVentaAtomica` en `inventory.js`**
- Función nueva que abre una sola tx sobre `['sales', 'products', 'stock_movements']` (readwrite).
- Dentro de la tx: `sales.add(sale)`, luego por cada item `products.get` → calcular descuento → `products.put` → `stock_movements.add(movement)`. Calcula alertas (`clasificarStock`) como antes.
- `tx.oncomplete` → resuelve `{ saleId, descontados, faltantes, alertas }`.
- `tx.onerror` o `tx.onabort` → rechaza.
- `App.jsx` `completePayment` llama a esta función y solo aplica los setters de éxito si resuelve.

**Paso 4 — Tests**
- `tests/registrarVentaAtomica.test.js`:
  - Éxito: venta + descuento + movimiento se persisten; `sales` y `stock_movements` tienen registros; productos con stock descontado.
  - Atomicidad: si forzamos error en `products.put` (producto inexistente o stock inválido), la venta NO queda en `sales` (todo se revierte).
  - Alertas: si la venta cruza un producto a 'agotado'/'pedir', las alertas se devuelven.
- `tests/payment-flow.test.js` (integración headless con Playwright):
  - Doble clic en "Grabar" → una sola venta guardada y un solo descuento de stock.
  - DB forzada a fallar → error visible + carrito intacto.
