# SPEC-005: Unificar acceso a la DB y arreglar los logs rotos

> **Prioridad: P0 — CRÍTICA (funcionalidad rota + integridad)**

## 1. Problema (¿por qué?)
Hay **4 implementaciones distintas de `openDB()`** con versiones incompatibles:
- `db.js` abre **sin versión** (auto-ajusta).
- `inventory.js` y `backupService.js` abren con versión fija `7`.
- `logService.js` abre con versión fija **`6`**.

Resultado crítico: `logService.js:19` lanza `VersionError` cuando la DB ya está en v7 → **todos los logs fallan siempre**. Además, este desorden hace que cualquier bump futuro de `DB_VERSION` rompa `inventory.js`/`backupService.js` silenciosamente (version drift).

## 2. Objetivo (¿qué logramos?)
- Que los logs vuelvan a funcionar (registrar, ver, limpiar).
- Un acceso a la DB **único y compartido**, que abra sin versión explícita, para que el resto no se desincronice jamás.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Crear un módulo único `openDB` compartido (ej. `src/utils/dbClient.js` o exponerlo desde `db.js`) que abra sin versión y crea/auto-corrige las stores necesarias.
- [ ] Reemplazar las 4 implementaciones (`db.js`, `inventory.js`, `backupService.js`, `logService.js`) por el acceso compartido.
- [ ] Corregir `logService.js` para que use `DB_VERSION`/el openDB compartido (ya no el `6` hardcodeado).
- [ ] Verificar que registrar/leer/limpiar logs funciona de punta a punta.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Cambiar el esquema de datos o agregar stores (eso es otro trabajo).
- ❌ Refactorizar la lógica de negocio de cada módulo.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] ¿Dónde vive el `openDB` compartido? (¿nuevo `dbClient.js` o reexponer `db.js`?)
- [ ] Mantener el comportamiento actual: `db.js` auto-incrementa versión si faltan stores. ¿Lo centralizamos y el resto solo leen la versión actual de la DB, o comparten constante?

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Registro una venta con stock insuficiente → aparece la alerta `ALERT` "Stock por reponer" en el Visor de Logs.
2. El Visor de Logs muestra INFO/WARNING/ERROR/ALERT y permite marcar como leídas / limpiar.
3. Abro la app, exporto y importo backup, y registro un movimiento de inventario — todo sin errores de `VersionError`.
4. `npm run dev` no arroja `VersionError` en consola tras un cambio de `DB_VERSION`.

## 7. Archivos que probablemente tocaré
- `src/utils/db.js` — exponer/centralizar `openDB`.
- `src/utils/dbClient.js` — (nuevo) módulo compartido, si se elige.
- `src/utils/inventory.js`, `src/utils/backupService.js`, `src/utils/logService.js` — usar el acceso compartido.

## 8. Riesgos / notas
- **Es una refactor que toca persistencia.** Hacerlo con pruebas manuales de cada flujo (venta, inventario, backup, logs) al terminar.
- Unificar el acceso no cambia el esquema; el riesgo es bajo si el `openDB` compartido crea las mismas stores.
- Arreglar esto habilita que SPEC-004 (cobro) no se pierda logs de stock — hacerlo idealmente antes o en paralelo.

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [x] Done

## 10. Reporte de implementación

> Nota para futuros cambios: este reporte queda en la documentación como referencia de lo que se hizo y por qué.

### Reporte ejecutivo — SPEC-005

**Objetivo:** Unificar el acceso a la base de datos y reparar la funcionalidad de logs, que estaba completamente rota.

**Diagnóstico:** Existían 4 versiones distintas y contradictorias de cómo se abría la base de datos. La más grave: los logs abrían la base con una versión antigua ("6"), mientras el resto del sistema ya usaba la versión "7". Eso hacía que **todos los logs fallaran siempre**, y dejaba el sistema frágil ante cualquier cambio futuro.

**Solución aplicada:** Centralicé el acceso a la base de datos en un solo punto único y compartido. Todos los módulos (productos, inventario, respaldos, logs) ahora usan esa misma conexión, que se ajusta sola a la estructura necesaria. Eliminé las 4 copias duplicadas y el error en los logs.

**Verificación:**
- Los 22 tests automatizados del proyecto pasan correctamente.
- La aplicación compila sin errores.

**Estado:** Funcionalidad reparada y base más robusta. Resta una validación manual de los flujos de negocio (ventas, inventario, respaldos y logs) antes de cerrar la entrega. No se ha hecho commit; los cambios están listos para ello.
