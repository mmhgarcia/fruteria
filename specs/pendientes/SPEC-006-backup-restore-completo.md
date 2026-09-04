# SPEC-006: Backup/Restore completo y atómico

> **Prioridad: P0 — CRÍTICA (pérdida total de datos)**

> Ficha de trabajo. Una spec = una feature con límites claros.
> Se completa ANTES de implementar. Se marca `Done` al terminar.

> **Convención de rutas:** escribir SIEMPRE desde la raíz del repo (ej. `src/utils/db.js`),
> nunca con `../`. Así las specs se pueden mover de carpeta sin ajustar rutas.

> **REQUISITO DE FINALIZACIÓN:** para que esta spec se considere terminada, debe tener
> su test implementado y en verde (`npm test`). Suspende su `Done` hasta que pase.

> 🔗 **Documento de diseño de respaldo:** `docs/BACKUP-RESTORE-PROPOSAL.md` (plan maestro que desarrolla esta spec en detalle, con nomenclatura, registro y fases).

---

## 1. Problema (¿por qué?)

El respaldo es el momento más frágil de la app: hoy solo exporta el estado de **IndexedDB** y restaura borrando store por store en **transacciones separadas**. Si algo falla a mitad, la base queda **parcialmente borrada** sin vuelta atrás. Además **no incluye la configuración ni preferencias** (`localStorage`), no valida el archivo (un backup corrupto inyecta datos inválidos), y el usuario no tiene forma de ver qué se restaurará ni de revertir. El comerciante queda expuesto a **pérdida total de datos**.

## 2. Objetivo (¿qué logramos?)

Que el comerciante pueda **resguardar, transportar y restaurar** todo su negocio (productos, ventas, tasas, ramos, inventario, logs **y configuración**) de forma **segura, comprensible y reversible**, operando 100% offline. Restaurar **o lo hace todo bien, o no cambia nada**; un archivo corrupto se rechaza sin tocar los datos actuales; y siempre hay un **historial accionable** con opción de **revertir**.

## 3. Alcance (¿qué se hace?) — checklist

- [ ] **Inventario completo** — catálogo declarativo `backupSchema` con fuentes `indexedDB` (products, categories, historico_tasas, sales, ramos, logs, stock_movements) + `localStorage` (fruteria-settings, fruteria-tasa, fruteria-alert-read-at). Excluye `fruteria-cart` (estado transitorio).
- [ ] **Formato envelope** — archivo único `.json` con `{ app, schemaVersion, createdAt, generator, checksum, data }`, auto-descriptivo y migrable a futuro.
- [ ] **Checksum SHA-256** del payload → detecta corrupción/manipulación.
- [ ] **`validateBackup(file)`** — parse + valida schema + checksum; rechaza corruptos con mensaje claro.
- [ ] **`previewBackup(file)`** — dry-run que simula la importación y reporta impactos (añadir/actualizar/reemplazar) **sin tocar datos**.
- [ ] **`importBackup(file)`** — aplica **`replace`** (reemplazo total) en **una sola transacción `readwrite` multi-store** (all-or-nothing). El modo `merge` queda pospuesto para multi-móvil.
- [ ] **Backup previo automático** antes de restaurar → permite revertir (idempotente, sin duplicar ventas ni romper totales al repetirse).
- [ ] **Registro `backup_registry`** — cada respaldo crea una entrada (fecha/hora, nombre, alcance, tamaño, recuento por tienda, ubicación, modo) que alimenta el Historial.
- [ ] **Nomenclatura de archivos** — `fruteria-pos_<fecha>_<hora>_<alcance>_<modo>.json` (ISO + 24h → ordena cronológicamente, minúsculas/`_` sin espacios).
- [ ] **Auditoría** — cada respaldo emite evento **INFO** en `logService`.
- [ ] **Exportar — guardado local por defecto** — escribe el `.json` con `@capacitor/filesystem`, con picker de carpeta (`@capacitor-community/filesystem` → `pickFolder()`). Funciona offline.
- [ ] **Exportar — botón "Compartir / enviar"** — `@capacitor/share` (`Share.share({ files })`) abre el share sheet (Drive, WhatsApp, Gmail) como **copia de redundancia off-device**. Nunca obligatorio.
- [ ] **Restaurar — selección de archivo** — file picker (`@capacitor-community/file-picker`) o desde el Historial.
- [ ] **Restaurar — preview + confirmación** — dry-run visible, elección de modo, confirmación por **PIN de administrador**, barra de progreso.
- [ ] **Historial accionable** — lista en orden descendente por fecha/hora, con `Restaurar` desde ahí y `Revertir` a la versión previa.
- [ ] **Programación y retención** — auto-backup en eventos clave (cierre de caja, cambios masivos, update de app) y retención rotativa (últimos 7 diarios + 4 semanales + 1 mensual) con limpieza de registros y archivos.

## 4. Fuera de alcance (lo que NO se hace ahora)

- ❌ **Cifrado del backup** (queda como opción avanzada/fase posterior; requiere resolver recuperación de clave — ver §5-2).
- ❌ Otros destinos de automatización de respaldo distintos al **share sheet** (Drive/WhatsApp) que ya cubre SPEC-001 en su parte de "automático".
- ❌ Migración automática de datos entre esquemas de producto (solo se valida el formato envelope, no se transforma la shape de registros).
- ❌ **Multi-dispositivo / `merge` entre cajas.** La app es **single-device**; el `merge` para unificar datos entre dos móviles queda **fuera de alcance** (evolución futura).

## 5. Decisiones resueltas / de alcance (para aprobar)

> **Supuesto operativo: la app está diseñada para un solo dispositivo móvil.** A futuro (multi-móvil) se revisará; por ahora NO se contempla unificar datos entre cajas con `merge`.

Mientras un ítem de esta sección no esté resuelto, la spec NO se implementa. Se van tachando al resolverse.

- [x] **(resuelto) Colisión de `id` / algoritmo de restauración.** Con un solo dispositivo, el `merge` entre cajas se **descarta**. La restauración es **`replace`** (reemplazo total) como modo único y seguro: limpia y escribe el backup. La idempotencia se garantiza por la **uniquidad de claves** (siempre se reemplaza, nunca acumula). El `merge` queda **documentado como evolución futura para multi-móvil** (fuera de alcance ahora).
- [x] **(resuelto) Snapshots consistentes.** Se leen todas las stores dentro de **una sola transacción de lectura** → snapshot atómico y consistente. Se suman respaldos recomendados en **cierre de turno** (estado quiescente) para evitar ítems a medias.
- [x] **(resuelto) Programación en PWA.** Sin tareas en background: respaldo automático vía **check al abrir la app** (compara fecha del último backup) + **acción al cierre de caja**. El copy dice "al abrir la app" / "al cerrar caja", no "diario a las 22:00".
- [x] **(resuelto, no bloqueante) Cifrado.** Fuera de alcance inicial (opción avanzada). No bloquea la F1; la recuperación de clave se evalúa cuando se retome.
- [x] **(resuelto) Quota / archivos grandes.** El backup interno, si es pequeño, se guarda en IndexedDB (restauración inmediata desde el historial); si es grande, se guarda solo el `path` y el historial lo muestra como "disponible en ruta". Nunca se rompe la cuota.
- [x] **(resuelto) Seguridad del PIN al restaurar.** Tras cualquier restauración, el **PIN siempre se restablece a `000000`** (valor por defecto de fábrica). Así nunca se revierte un PIN antiguo ni queda nadie bloqueado; el administrador lo cambia después si lo desea.

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)

1. Exporto un backup en un dispositivo y lo restauro en otro → vuelven **datos + configuración** exactos.
2. Importo un archivo corrupto/inválido → la app lo rechaza con mensaje y **no borra ni altera** los datos actuales.
3. Fuerzo un error a mitad de la importación → la DB queda como estaba (sin pérdida parcial; existe backup previo reversible).
4. Restaurar dos veces el mismo backup es **idempotente**: no duplica ventas ni rompe totales.
5. Veo el **preview** (qué cambia) **antes** de aplicar y **nunca** se restaura sin confirmación + PIN.
6. Cada respaldo aparece en el **Historial** (en orden descendente por fecha/hora) y puedo **revertir** a la versión previa.
7. Puedo **guardar local** (funciona sin internet) y **compartir** a Drive/WhatsApp opcionalmente.
8. Tras restaurar, el **PIN queda en `000000`** (por defecto) y se avisa al administrador para que lo cambie si lo desea.
9. Los nombres de archivo siguen la convención `fruteria-pos_<fecha>_<hora>_<alcance>_<modo>.json`.
10. El ciclo está cubierto por tests con `fake-indexeddb` (`npm test` en verde), incluyendo migración de `schemaVersion` v1→v2.

## 7. Archivos que probablemente tocaré

- `src/utils/backupService.js` — servicio central: `create/validate/preview/import`, envelope + checksum, transacción única.
- `src/utils/db.js` — store `backup_registry` (y versionado de base si hace falta).
- `src/backup/backupSchema.js` — catálogo declarativo de fuentes (datos + `localStorage`).
- `src/components/BackupModal.jsx` (o `SettingsModal.jsx`) — UX del asistente 3 pasos (exportar/restaurar/historial).
- `src/utils/logService.js` — evento INFO de auditoría por respaldo.
- `src/utils/session.js` — confirmación por PIN (exportar/restaurar).
- `src/utils/inventory.js` / `App.jsx` — armonizar claves de `localStorage` si cambian.
- Plataforma/Capacitor (ver nota SPEC-001): `@capacitor/filesystem`, `@capacitor-community/file-picker`, `@capacitor/share`.

## 8. Riesgos / notas

- Las stores se definían hardcodeadas en `backupService.js`; con `backupSchema` se unifican (ver SPEC-005) para que nada quede fuera del backup.
- Retrocompatibilidad: backups exportados por versiones anteriores deben seguir importando (validación de `schemaVersion` con migración hacia adelante).
- **Deriva sobre SPEC-001:** esta spec resuelve la decisión abierta de SPEC-001 ("dónde vive el respaldo externo") mediante el **share sheet** (Drive/WhatsApp). Revisar SPEC-001 para no duplicar trabajo una vez se reanude su parte de automatización.
- El registro `backup_registry` debe distinguir backups guardados en el dispositivo (`storage: local`) de los compartidos (`storage: shared`), que no dejan archivo en el dispositivo.

## 9. Estado

- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
