# SPEC-001: Backup automático de datos

## 1. Problema (¿por qué?)
Hoy el backup es 100% manual: el admin debe entrar a Configuración → Backup y descargar el archivo. Si lo olvida y pierde o se daña el dispositivo (o se borra el navegador), se pierden todos los datos del negocio. Para una PYME, perder la data de ventas/inventario es crítico.

## 2. Objetivo (¿qué logramos?)
La app guarda automáticamente una copia de la base de datos sin que el usuario tenga que acordarse, y permite recuperar desde esa copia si algo sale mal. La copia local aporta red de seguridad; el export manual a archivo sigue existiendo para guardar fuera del dispositivo.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Guardar **snapshots periódicos** de la base de datos en IndexedDB (nueva store `backups`), sin bloquear la app.
- [ ] Conservar un **historial rotativo** (ej. las últimas 10 copias) para no llenar el almacenamiento.
- [ ] Crear un snapshot automáticamente en momentos útiles: al iniciar la app (si pasó X días desde el último) y tras confirmar una venta (limitado para no saturar).
- [ ] Mostrar en el modal de Backup el último snapshot y permitir **restaurar desde un snapshot local**.
- [ ] Aviso visual si el snapshot es viejo (ej. badge/aviso "último respaldo hace N días").
- [ ] Registrar un log `INFO` cuando se crea/restaura un backup automático.
- [ ] El export/import manual actual se mantiene sin cambios.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Subir a la nube / sincronización remota **por cuenta del negocio vía API de Google en esta fase** (ver Decisiones abiertas).
- ❌ Sincronización entre dispositivos / multi-caja.
- ❌ Restauración "inteligente" (merge automática de datos) — solo restaurar un snapshot completo.
- ❌ Encriptar el snapshot.
- ❌ Detección de pérdida de dispositivo / notificaciones push.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] **¿Respaldo externo?** ¿Snapshot local + export a carpeta real para que el SO lo suba a Drive del dueño (Camino 1), o subida directa vía API de Google (Camino 2)?
- [ ] **¿Frecuencia del snapshot?** ¿Al iniciar si pasó >=1 día, al abrir + 1/hora tras ventas, o al confirmar cada venta?
- [ ] **¿Historial rotativo?** ¿Cuántas copias conservar (ej. 10)?

### Otras en discusión
- Tema abierto: cómo resolver la dependencia del paso manual en el Camino 1 (sync del SO).

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Abro la app después de varios días sin abrirla → se crea un snapshot automáticamente (se ve log `INFO` y el último respaldo se actualiza).
2. Realizo una venta → el snapshot se actualiza (según regla definida) sin que la app se congele ni se cierre.
3. Voy a Configuración → Backup → veo "Último respaldo: fecha/hora" y el historial de copias.
4. Selecciono un snapshot y "Restaurar" → los datos vuelven al estado de esa copia (lo confirmo viendo productos/ventas de ese momento).
5. Después de muchas copias, el historial se mantiene en el máximo definido (rotación funciona; no crece sin límite).

## 7. Archivos que probablemente tocaré
- `src/utils/backupService.js` — funciones de snapshot/restore en IndexedDB.
- `src/utils/db.js` — agregar la store `backups` (y subir `DB_VERSION`).
- `src/App.jsx` — disparar snapshot al iniciar / al cobrar.
- `src/components/BackupModal.jsx` — UI de último respaldo + restaurar.

## 8. Riesgos / notas
- **Decisión clave:** el snapshot local protege contra borrado accidental/corrupción, pero NO contra pérdida del dispositivo. Por eso el export a archivo externo sigue siendo la protección real — deben co-existir. Avisar en la UI que el respaldo local no reemplaza el archivo externo.
- Al subir `DB_VERSION`, hay que sincronizar `backupService.js` y revisar que `importBackup` maneje la nueva store sin romper backups viejos.
- El snapshot no debe descargar mucho peso cada venta: definir umbral (ej. max 1 por hora o solo al cierre).
- Pausada (2026-08-28): en espera de elegir estrategia de respaldo externo.

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
