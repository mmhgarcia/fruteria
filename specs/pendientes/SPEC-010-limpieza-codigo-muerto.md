# SPEC-010: Limpieza de código muerto y lógica duplicada

> **Prioridad: P2 — MEDIA (mantenibilidad, no urgente)**

## 1. Problema (¿por qué?)
Hay funciones exportadas **sin uso** (`db.js:165 getSales`, `db.js:202 deleteSale`, `inventory.js:327 getMovimientosByProduct`, `dashboard.js:18 computeTopProducts` es solo interna), lógica de descuento de stock **duplicada** entre `inventory.js:124` (`nextStock`) y `inventory.js:260` (`descontarStockVenta`), e **imports con/sin extensión** mezclados (`pdfExport.js`, `dashboard.js` sin `.js`; `inventory.js` con `.js`). Esto dificulta leer y mantener el código y crea riesgo de drift.

## 2. Objetivo (¿qué logramos?)
Un código más limpio: menos funciones muertas, una sola fuente de verdad para el descuento de stock e imports consistentes.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Eliminar funciones exportadas sin uso (previa verificación de que no se usan en `src/`).
- [ ] Consolidar el cálculo de descuento de stock en una sola función reutilizada por `registrarMovimiento` y `descontarStockVenta`.
- [ ] Unificar el estilo de imports (con o sin extensión, según estándar del repo) en todos los `src/utils/*.js`.
- [ ] Unificar las constantes de nombres de stores (evitar strings hardcodeados repetidos).

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Refactorizar la estructura de componentes ni los modales.
- ❌ Cambiar comportamiento de negocio o UI.
- ❌ Unificar `openDB` (eso es SPEC-005).

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] ¿Estándar de imports: siempre con `.js` o siempre sin? (Recomendado: elegir uno y aplicarlo a todos.)
- [ ] ¿Mover constantes de stores a un único lugar (junto al `openDB` compartido de SPEC-005) o dejarlas localmente? (Recomendado: central, para evitar drift.)

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. No queda ninguna función exportada sin uso real (grep no devuelve usos externos).
2. El descuento de stock tiene una sola implementación; `registrarMovimiento` y `descontarStockVenta` la comparten.
3. Todos los imports de utilidades usan la misma convención de extensión.
4. `npm run build` sigue compilando y la app funciona igual.

## 7. Archivos que probablemente tocaré
- `src/utils/db.js`, `src/utils/inventory.js`, `src/utils/dashboard.js` — remover muerto y centralizar.
- `src/utils/*.js` — normalizar imports y constantes.

## 8. Riesgos / notas
- El riesgo es bajo (solo limpieza), pero requiere verificar que las funciones a eliminar no se usen (grep en todo `src/`, incluyendo feature/TasaBcv).
- Recomendado hacerlo **después** de SPEC-005 (unificar openDB) para no chocar con ese refactor.

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
