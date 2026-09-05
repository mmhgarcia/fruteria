# SPEC-001: Backup automático de datos

> **Prioridad: P1 — ALTA (protección de datos)**

> **Relación con SPEC-006 (Done):** SPEC-006 resolvió el backup **manual** completo y atómico (export/import, checksum, preview, revertir) y el respaldo **externo** vía **share sheet** (Drive/WhatsApp). Esta SPEC-001 cubre **solo la automatización**: que la app respalde por sí sola. **NO duplica** el export/import manual ni el respaldo externo.

## 1. Problema (¿por qué?)
El backup hoy es 100% manual (SPEC-006): el admin debe entrar a Configuración → Backup y exportar. Si se olvida y el dispositivo se daña o se pierde (o el navegador se limpia), se pierde todo. El respaldo externo (share sheet) exige que el usuario lo haga; queremos una red de seguridad **automática y local**.

## 2. Objetivo (¿qué logramos?)
La app guarda automáticamente **snapshots locales** de los datos sin que el usuario tenga que acordarse, y permite **recuperar** desde esa copia. El export/import manual (SPEC-006) sigue existiendo para guardar fuera del dispositivo.

## 3. Alcance (¿qué se hace?) — checklist
- [x] Crear snapshots automáticos **reusando el motor de SPEC-006** (`backupService.createBackup` + store `backup_registry`). No se crea una store nueva. (Hecho: `createAutomaticSnapshot`.)
- [x] Conservar un **historial rotativo de 4** copias automáticas (ventana rodante: al crear la 5ª se elimina la más antigua). (Hecho: `cleanupAutoSnapshots`.)
- [x] Disparar snapshot **una vez al día** (se evalúa al abrir la app; PWA sin tareas en background). (Hecho: `runAutoBackupIfDue` en `App.jsx` al cargar.)
- [x] Mostrar en el modal de Backup (SPEC-006) el **último snapshot** y permitir **restaurar desde un snapshot local**. (Hecho: "Último respaldo automático" + botón Restaurar en el historial.)
- [x] **Aviso visual** si el snapshot es viejo (ej. badge "último respaldo hace N días"). (Hecho: badge ámbar "⚠️ hace N días".)
- [x] Registrar un **log `INFO`** cuando se crea un backup automático.
- [x] El export/import manual actual (SPEC-006) se mantiene sin cambios.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Subir a la nube / sincronización remota **por cuenta del negocio** (el respaldo externo ya se resuelve con el share sheet de SPEC-006).
- ❌ Sincronización entre dispositivos / multi-caja.
- ❌ Restauración "inteligente" (merge) — solo restaurar un snapshot completo (`replace`, igual que SPEC-006).
- ❌ Encriptar el snapshot.
- ❌ Detección de pérdida de dispositivo / notificaciones push.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [x] **(resuelto) Frecuencia del snapshot.** Una vez al **día**, al **abrir la app**: si falta el respaldo del día previo → se crea el snapshot (no requiere una hora exacta).
- [x] **(resuelto) Hora de ejecución configurable.** **DESCARTADA**: el disparo diario al abrir la app ya cubre el caso; no se requiere configurar una hora.
- [x] **(resuelto) Historial rotativo.** Conservar los **4 últimos** respaldos automáticos y **reiniciar el ciclo** (ventana rodante: al crear el 5º se elimina el más antiguo).

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Abro la app después de varios días → se crea un snapshot automático (log `INFO` y "último respaldo" se actualiza).
2. Abro la app y ya existe el respaldo del día previo → no se duplica el snapshot.
3. En Configuración → Backup veo "Último respaldo: fecha/hora" y el historial de copias.
4. Selecciono un snapshot y "Restaurar" → los datos vuelven al estado de esa copia.
5. Tras muchas copias, el historial se mantiene en el máximo definido (rotación funciona).

## 7. Archivos que probablemente tocaré
- `src/utils/backupService.js` — reusar `createBackup` para snapshots + limpieza/rotación.
- `src/App.jsx` — disparar snapshot al abrir / al cobrar.
- `src/components/BackupModal.jsx` — UI de último snapshot + restaurar desde snapshot local.
- (Sin store nueva; se usa `backup_registry` existente de SPEC-006.)

## 8. Riesgos / notas
- **Decisión clave:** el snapshot local protege contra borrado accidental/corrupción, pero **NO** contra pérdida del dispositivo. El respaldo externo (share sheet, SPEC-006) sigue siendo la protección real; ambos coexisten. Avisar en la UI que el respaldo local no reemplaza el archivo externo.
- **PWA sin background:** el disparo ocurre al **abrir la app** (se revisa si falta el respaldo del día previo). No hay "a las HH:MM exactas".
- Retención de **4**: al crear el 5º snapshot se elimina el más antiguo (ventana rodante). Al reusar `backup_registry`, distinguir los automáticos (`mode: 'automatico'`) de los manuales/shared para no borrarlos en la rotación.

## 9. Estado
- [ ] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [x] Done

## 10. Reporte de implementación

> Nota para futuros cambios: este reporte queda en la documentación como referencia de lo que se hizo y por qué.

### Reporte ejecutivo — SPEC-001

**Objetivo:** que la app respalde por sí sola (backup automático), sin que el usuario tenga que acordarse, y permita recuperar desde esa copia local.

**Solución aplicada:**
- **Motor** en `backupService.js`: `createAutomaticSnapshot`, `hasAutoBackupFor`, `cleanupAutoSnapshots` (retención de **4**, ventana rodante), `runAutoBackupIfDue`.
- **Disparo diario** al abrir la app (`App.jsx`): si **falta el respaldo del día previo** → crea el snapshot y lo registra con `periodDate` (el día que cubre); si existe → ignora (no duplica). PWA sin background, por eso se evalúa al abrir.
- **Retención de 4** y **log `INFO`** en cada backup automático. Reusa `backup_registry` de SPEC-006 (sin store nueva ni bump de `DB_VERSION`).
- **UI:** indicador **"RESPALDO EN PROCESO..."** con barra animada superior; en BackupModal se muestra **"Último respaldo automático"**, badge **"⚠️ hace N días"** si está viejo, y **Restaurar desde snapshot local**.
- **Decisión descartada:** la **hora configurable** de ejecución — el disparo diario al abrir la app la hace innecesaria.

**Verificación:** `npm test` → **68 tests en verde**; `npm run build` OK. Commits en rama `backup-auto`: `2486a2f`, `a67bd35`, `09bc566`, `a1e17c1`.

**Estado:** funcionalidad completa. La spec se cierra como **Done**.
