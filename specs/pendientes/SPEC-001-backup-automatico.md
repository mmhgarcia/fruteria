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
- [x] Disparar snapshot **una vez al día** a la **hora configurada** (se evalúa al abrir la app; PWA sin tareas en background). (Hecho: `runAutoBackupIfDue` en `App.jsx` al cargar.)
- [ ] **Configuración del Sistema:** permitir definir la **hora de ejecución (HH:MM)** del backup automático (guardada en `fruteria-settings`).
- [ ] Mostrar en el modal de Backup (SPEC-006) el **último snapshot** y permitir **restaurar desde un snapshot local**.
- [ ] **Aviso visual** si el snapshot es viejo (ej. badge "último respaldo hace N días").
- [x] Registrar un **log `INFO`** cuando se crea un backup automático.
- [x] El export/import manual actual (SPEC-006) se mantiene sin cambios.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Subir a la nube / sincronización remota **por cuenta del negocio** (el respaldo externo ya se resuelve con el share sheet de SPEC-006).
- ❌ Sincronización entre dispositivos / multi-caja.
- ❌ Restauración "inteligente" (merge) — solo restaurar un snapshot completo (`replace`, igual que SPEC-006).
- ❌ Encriptar el snapshot.
- ❌ Detección de pérdida de dispositivo / notificaciones push.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [x] **(resuelto) Frecuencia del snapshot.** Una vez al **día**. Al ser PWA (sin background), se evalúa al **abrir la app**: si ya pasó la hora configurada y hoy aún no se respaldó → se crea el snapshot.
- [x] **(resuelto) Hora de ejecución configurable.** En **Configuración del Sistema** el admin define la **hora (HH:MM)**; se guarda en `fruteria-settings` (`backupAutoTime`).
- [x] **(resuelto) Historial rotativo.** Conservar los **4 últimos** respaldos automáticos y **reiniciar el ciclo** (ventana rodante: al crear el 5º se elimina el más antiguo).

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Abro la app después de varios días → se crea un snapshot automático (log `INFO` y "último respaldo" se actualiza).
2. Realizo una venta → el snapshot se actualiza (según regla definida) sin congelar ni cerrar la app.
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
- **PWA sin background:** el disparo ocurre al **abrir la app** (se compara la hora configurada vs. el último snapshot del día). No hay "a las HH:MM exactas".
- Retención de **4**: al crear el 5º snapshot se elimina el más antiguo (ventana rodante). Al reusar `backup_registry`, distinguir los automáticos (`mode: 'automatico'`) de los manuales/shared para no borrarlos en la rotación.

## 9. Estado
- [ ] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [x] Aprobada / en implementación — **Fase 0 resuelta** y **motor automático implementado** (`createAutomaticSnapshot`, `hasAutoBackupFor`, `cleanupAutoSnapshots` (retención 4), `runAutoBackupIfDue` disparado al abrir la app en `App.jsx`). Tests en verde (`npm test` → 67). Queda la parte de **UI/config** (hora configurable, último snapshot + restaurar, aviso de viejo).
- [ ] Done
