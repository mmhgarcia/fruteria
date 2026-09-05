# SPEC-001: Backup automático de datos

> **Prioridad: P1 — ALTA (protección de datos)**

> **Relación con SPEC-006 (Done):** SPEC-006 resolvió el backup **manual** completo y atómico (export/import, checksum, preview, revertir) y el respaldo **externo** vía **share sheet** (Drive/WhatsApp). Esta SPEC-001 cubre **solo la automatización**: que la app respalde por sí sola. **NO duplica** el export/import manual ni el respaldo externo.

## 1. Problema (¿por qué?)
El backup hoy es 100% manual (SPEC-006): el admin debe entrar a Configuración → Backup y exportar. Si se olvida y el dispositivo se daña o se pierde (o el navegador se limpia), se pierde todo. El respaldo externo (share sheet) exige que el usuario lo haga; queremos una red de seguridad **automática y local**.

## 2. Objetivo (¿qué logramos?)
La app guarda automáticamente **snapshots locales** de los datos sin que el usuario tenga que acordarse, y permite **recuperar** desde esa copia. El export/import manual (SPEC-006) sigue existiendo para guardar fuera del dispositivo.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Crear snapshots automáticos **reusando el motor de SPEC-006** (`backupService.createBackup` + store `backup_registry`). No se crea una store nueva.
- [ ] Conservar un **historial rotativo** (ej. últimas 10 copias) para no llenar el almacenamiento (limpieza de registros viejos).
- [ ] Disparar snapshot en momentos útiles: **al abrir la app** (si pasaron X días desde el último) y tras **confirmar una venta** (limitado para no saturar; ej. máx. 1 por hora).
- [ ] Mostrar en el modal de Backup (SPEC-006) el **último snapshot** y permitir **restaurar desde un snapshot local**.
- [ ] **Aviso visual** si el snapshot es viejo (ej. badge "último respaldo hace N días").
- [ ] Registrar un **log `INFO`** cuando se crea/restaura un backup automático.
- [ ] El export/import manual actual (SPEC-006) se mantiene sin cambios.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Subir a la nube / sincronización remota **por cuenta del negocio** (el respaldo externo ya se resuelve con el share sheet de SPEC-006).
- ❌ Sincronización entre dispositivos / multi-caja.
- ❌ Restauración "inteligente" (merge) — solo restaurar un snapshot completo (`replace`, igual que SPEC-006).
- ❌ Encriptar el snapshot.
- ❌ Detección de pérdida de dispositivo / notificaciones push.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] **Frecuencia del snapshot:** ¿al abrir si pasó >=1 día, + 1/hora tras ventas, o solo al confirmar cada venta? (Recomendado: al abrir si pasó >=1 día + máx. 1/hora tras ventas.)
- [ ] **Historial rotativo:** ¿cuántas copias conservar (ej. 10)?

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
- El snapshot no debe descargar mucho peso por venta: definir umbral (ej. máx. 1 por hora o solo al cierre).
- Al reusar `backup_registry`, cuidar de no mezclar snapshots automáticos con los backups manuales/shared (distinguir por `mode: 'automatico'`).

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
