# SPEC-009: Validación de stock en el carrito (agregar/editar/cobrar)

> **Prioridad: P1 — ALTA (integridad de inventario / sobreventa)**

## 1. Problema (¿por qué?)
La validación de stock está incompleta:
- `addToCart` no valida stock por sí mismo; depende de un `maxQty` calculado al abrir el `WeightModal`, que es una "foto" del stock en ese momento (`App.jsx:488-496`).
- `editCartItem` **no valida stock** (`App.jsx:308-316`): desde el carrito se puede subir la cantidad por encima del inventario y cobrar ese exceso.
- Al cobrar, `descontarStockVenta` se limita a descontar hasta 0 y avisar, **sin bloquear** (`inventory.js:258`): se cobra por más unidades de las físicamente disponibles.
- El carrito persiste un snapshot de `stock` (`useLocalStorage`), que puede estar desactualizado al recargar.

## 2. Objetivo (¿qué logramos?)
Que no se pueda vender más stock del existente, en ninguna vía (agregar, editar o cobrar), con un aviso claro y un valor de stock siempre actualizado al momento de operar.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Validar stock en **agregar al carrito** contra el valor actual de IndexedDB (no una foto vieja).
- [ ] Validar stock en **editar cantidad** en el carrito (recalcular contra stock actual, restando lo ya reservado en el carrito).
- [ ] Validar al **cobrar**: si se excede el stock, bloquear la confirmación con mensaje (en lugar de vender y descontar hasta 0).
- [ ] Recalcular el stock disponible al abrir/editar el carrito, considerando el `stockMin` y el estado del producto.
- [ ] Respetar la semántica de producto "sin stock definido" (`stock null`) = sin límite (no validación).

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Reserva de stock multicaja (aún no hay sincronización).
- ❌ Bloqueo de venta para productos agotados en todas las vías si no es requisito del dueño (decisión de negocio, ver §5).
- ❌ Ventas en negativo / préstamos.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] ¿Cuando falta stock: **bloquear la venta** (rechazar) o permitir con advertencia al cajero? (Recomendado: bloquear si excede; decisión de negocio para el caso "agotado".)
- [ ] Los productos con `stock === null` (sin definir): ¿se venden sin límite y se marcan para definir stock, o se bloquean hasta definir?
- [ ] ¿El límite considera la cantidad ya en el carrito (reserva) o valida solo contra el stock físico en cada línea?
- [ ] ¿Mostrar el stock disponible en el detalle del carrito (como asistencia al cajero)?

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Intento agregar más de lo disponible → la app avisa y **no agrega** más allá del stock.
2. Desde el carrito subo la cantidad por encima del stock → se bloquea/avisa; no se permite el excedente.
3. Si el stock cambió entre que abrí el carrito y cobro, la validación usa el stock actual, no el viejo.
4. Un producto "sin stock definido" (null) se puede vender sin límite ni alerta falsa.
5. No se confirma un cobro por más unidades de las existentes.

## 7. Archivos que probablemente tocaré
- `src/App.jsx` — `addToCart`, `editCartItem`, `completePayment`.
- `src/components/CartModal.jsx` / `src/components/WeightModal.jsx` — límite dinámico y avisos.
- `src/utils/inventory.js` — función de validación de stock reutilizable (semántica `null`).

## 8. Riesgos / notas
- Cambiar el comportamiento de cobro ("bloquear en vez de descontar hasta 0") es **cambio de negocio**; confirmar con el dueño para no bloquear ventas legítimas de emergencia.
- Toque el flujo de cobro → pruebas manuales y tests (SPEC-003) al terminar.
- Coexiste con SPEC-008 (semántica de `stock null`) y SPEC-004 (cobro seguro): coordinar para evitar conflictos.

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
