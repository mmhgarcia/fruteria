# SPEC-003: Testing del flujo de cobro

## 1. Problema (¿por qué?)
La app maneja dinero y hoy **no tiene ningún test**. El flujo de cobro (cálculo de totales, pagos mixtos, vuelto, descuento de stock, guardado de venta) vive dentro de los componentes y se rompe fácilmente sin que nadie se entere. Un bug al cobrar cuesta plata real, y no hay red de seguridad que lo detecte.

## 2. Objetivo (¿qué logramos?)
Tener una batería de pruebas automatizadas sobre lo más crítico — el cobro — de modo que:
- Antes de publicar, se pueda correr `npm test` y saber si el flujo de dinero sigue correcto.
- Refactors futuros no rompan la lógica sin aviso.
- La lógica de negocio quede separada de la UI (testable).

## 3. Alcance (¿qué se hace?) — checklist
- [ ] **Configurar un runner de tests** ligero, compatible con Vite (Vitest).
- [ ] **Extraer la lógica de negocio pura** a funciones/helpers importables (sin UI):
  - Cálculo de totales del carrito (`totalUSD`, `totalBS`, `count`).
  - Normalización de montos: `parseFloat` seguro y redondeo a 2 decimales.
  - Cálculo del vuelto y de `saldo` con pagos mixtos (Pago Móvil + Punto + Divisa USD + Efectivo Bs).
  - Descuento de stock por venta (reste, no baje de 0, detecte faltantes y marcadores `agotado/pedir`).
- [ ] **Escribir tests unitarios** para esos helpers: casos normales, exactos, redondeo, pagos mixtos que no se completan, `vuelto=0`, montos negativos/cero.
- [ ] **Escribir tests de integración** del flujo de cobro con IndexedDB (usando una DB en memoria o mock) y con `stockAlerts`/`inventory` (fuente única de verdad).
- [ ] Añadir script `npm test` en `package.json`.
- [ ] Dejar el flujo de cobro (venta + stock) refactorizado para que los tests lo importen sin necesidad de renderizar UI.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Testear toda la app (productos, inventario, reportes, PIN, backup). Solo el flujo de cobro.
- ❌ Tests de componentes React (renderizado/snapshot) o E2E con navegador.
- ❌ Cobertura del 100%.
- ❌ Cambiar el comportamiento visual del cobro.
- ❌ Mock del flujo completo de pagos con librería nueva de acceso al navegador.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] **¿Runner:** Vitest o Jest? (Vitest es el natural para Vite; casi sin config.)
- [ ] **¿Background de IndexedDB:** usar `fake-indexeddb` (librería pequeña) o mocks manuales de `db.js`?
- [ ] **¿Tests de integración del descuento de stock** (con IndexedDB real) o **solo unitarios** de la función pura de descuento? (Depende de cuánto se refactorice.)
- [ ] **¿Se extrae primero la lógica a helpers y luego se testea, o se testea sobre el código actual?** (Recomendado: extraer primero; es lo que da testabilidad real.)
- [ ] **¿Qué casos de cobro priorizar:** el flujo feliz (1 producto, pago exacto) o también pagos mixtos con vuelto?

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. `npm test` corre y pasa sin errores.
2. Los tests cubren: venta de peso/unidad, multiplicación por tasa, redondeo a 2 decimales, pago mixto exacto, pago con vuelto, pago insuficiente (saldo negativo → no se puede cobrar).
3. Los tests del descuento de stock verifican: resta, no baja de 0, detección de agotado/pedir, y log de `WARNING` con faltantes.
4. Extraigo un helper y corro `npm test` → los tests existentes siguen pasando.
5. El flujo de cobro visual en la app sigue funcionando igual (no cambió nada al usuario).

## 7. Archivos que probablemente tocaré
- `package.json` — script `test` + dependencias de testing.
- `src/utils/` — nuevos helpers puros (ej. `calcTotals.js`, `pagos.js`, `stockVenta.js`) importables.
- `src/App.jsx` — usar los helpers extraídos en `totals` y `completePayment`.
- `src/components/PaymentModal.jsx` — usar el helper de vuelto/totalPagado.
- `src/utils/inventory.js` — posiblemente exponer la función de descuento como pura/testable.
- `tests/` (o colocado junto a la lógica) — ficheros de test.

## 8. Riesgos / notas
- **Refactor previo obligatorio.** La lógica está embebida en componentes; para testearla hay que extraerla. Hay que hacerlo con cuidado para no cambiar el comportamiento.
- **Redondeo de dólares.** El flujo usa `Math.round(...*100)/100` para el vuelto; conviene unificar el criterio de redondeo antes de testear (evitar falsos negativos).
- **IndexedDB en tests.** Requiere una implementación en memoria; `fake-indexeddb` es la opción ligera, pero hay que mapearla con `db.js`.
- **No tocar el comportamiento visual.** Priorizar lógica; si se extrae mal, puede haber regresiones en el cobro. Validar con tests + revisión del flujo.

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
