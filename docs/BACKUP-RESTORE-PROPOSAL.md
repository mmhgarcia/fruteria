# Propuesta de Solución — Backup/Restore para Frutería POS

> 📄 **Documento de propuesta.** Este documento describe el diseño propuesto para el manejo de copias de seguridad y restauración de datos. **No es una implementación.**

---

## 1. Objetivo y alcance

Garantizar que el comerciante pueda **resguardar, transportar y restaurar** en su totalidad el estado del negocio (productos, ventas, tasas, ramos, inventario, logs y configuración), de forma **cómoda, segura y comprobable**, incluso operando 100% offline como PWA.

El foco no es agregar funcionalidad nueva, sino **hacer que el backup sea confiable y completo**.

---

## 2. Diagnóstico del estado actual

Los datos de la app viven en dos lugares distintos y el backup actual solo cubre uno:

- **IndexedDB** (`fruteria-db`): `products`, `categories`, `historico_tasas`, `sales`, `ramos`, `logs`, `stock_movements`
- **localStorage**: `fruteria-cart`, `fruteria-tasa`, `fruteria-settings` (incluye PIN con hash, método de valoración, config IGTF…), `fruteria-alert-read-at` y claves de sesión/seguridad

> ⚠️ **Gap principal:** el backup actual exporta solo IndexedDB; la configuración y preferencias (`localStorage`) se pierden. Además no hay integridad, versionado robusto ni *dry-run* antes de restaurar.

---

## 3. Arquitectura de la solución

### 3.1 Inventario de datos (fuente única de verdad)

Catálogo declarativo que define todo lo respaldable, para que exportar/importar sea idéntico y extensible:

```js
// src/backup/backupSchema.js
export const BACKUP_SOURCES = {
  indexedDB: ['products','categories','historico_tasas','sales','ramos','logs','stock_movements'],
  localStorage: [
    'fruteria-settings',      // config + PIN (se respalda, no se expone)
    'fruteria-tasa',           // tasa activa
    'fruteria-alert-read-at'   // estado menor (opcional)
  ],
  excluded: ['fruteria-cart']  // carrito es estado transitorio, NO se respalda
}
```

### 3.2 Formato de archivo (Versionado y Envelope)

Archivo único `.json` con una "envoltura" auto-descritiva que permite evolucionar sin romper backups viejos:

```json
{
  "app": "fruteria-pos",
  "schemaVersion": 2,
  "createdAt": "2026-09-03T10:00:00.000Z",
  "generator": "fruteria-pos@1.0.0",
  "checksum": "sha256:...",
  "data": {
    "indexedDB": { "products": [...], "sales": [...], "..." : [] },
    "localStorage": { "fruteria-settings": {...}, "fruteria-tasa": 42.5 }
  }
}
```

### 3.2.1 Nomenclatura de archivos

Nombre descriptivo, legible a simple vista y que ordena cronológicamente:

```
fruteria-pos_<fecha>_<hora>_<alcance>_<modo>.json
```

Ejemplos:

```
fruteria-pos_2026-09-03_0815_completo_manual.json
fruteria-pos_2026-09-02_1800_completo_automatico.json   ← cierre de turno
fruteria-pos_2026-08-28_1207_solo_datos_manual.json
```

| Segmento | Valor | Por qué |
|---|---|---|
| `fruteria-pos` | prefijo de la app | identifica de qué sistema son (si guardas varios) |
| `2026-09-03` | fecha (ISO) | indica "de qué día es" a simple vista |
| `0815` | hora (24h) | distingue varios backups del mismo día |
| `completo` / `solo_datos` | alcance | qué incluye (datos o datos + config) |
| `manual` / `automatico` | modo | origen (manual, cierre de turno, programado) |

**Reglas:**

- **ISO `YYYY-MM-DD` + hora de 2 dígitos** → ordena cronológicamente en cualquier explorador de archivos, en línea con el historial descendente.
- **Minúsculas + `_`, sin espacios ni acentos** → seguro para Compartir/Drive/WhatsApp, sin problemas de encoding.
- El nombre del archivo es **solo informativo**: la **identidad real** vive en `backup_registry` (`id: bk_20260903_081500`) junto a `scope`, `storage`, `path`, etc.

### 3.3 Servicio central (`backupService`)

API única con estos métodos:

| Método | Descripción |
|---|---|
| `createBackup({ scope })` | Lee catálogo completo y devuelve `BackupFile` |
| `downloadBackup()` | Genera blob y descarga (o invoca el FS de Capacitor en móvil) |
| `validateBackup(file)` | Parse + valida schema + checksum, devuelve resumen |
| `previewBackup(file)` | Simula la importación y reporta impactos (dry-run) |
| `importBackup(file, { mode })` | Aplica `merge` o `replace` de forma atómica |
| `scheduleBackup()` / `cleanupBackups()` | Programación y retención (punto 6) |

### 3.4 Motores de restauración

- **`replace` (reemplazo total):** borra todo y escribe el backup. Ideal para migrar a otro dispositivo o "volver a un estado conocido".
- **`merge` (combinación):** mantiene registros existentes y agrega/actualiza solo los del backup (por clave). Útil para unificar dos dispositivos.
- **`dry-run` (avance):** nunca toca datos; muestra diferencias (cuántos se añaden, actualizan, ignoran, chocan).

### 3.5 Integridad y seguridad

- **Checksum SHA-256** del payload → detecta corrupción o manipulación de archivo.
- **Validación de schema** por versión → migraciones hacia adelante (un backup v1 se restaura en la app v2).
- **Confirmación por PIN de administrador** para exportar y restaurar.
- **Cifrado opcional** (AES con clave derivada de una frase), para respaldos que se guardan en la nube o USB compartido.
- Números de ventas: al importar se conservan los `id` para **no alterar los totales** ni la trazabilidad de tickets.

### 3.6 Atomicidad

La restauración se ejecuta dentro de **una sola transacción IndexedDB multi-store** y, de fallar a mitad, se muestra un mensaje claro y se conserva una **copia de seguridad automática previa** (backup "antes de restaurar") para revertir.

### 3.7 Registro de respaldos (`backup_registry`)

Cada respaldo generado crea una entrada en un store dedicado (separa de los datos del negocio). Es la "línea de tiempo" que alimenta el Historial y habilita **restaurar / revertir con un clic** desde ahí:

```js
{
  id: 'bk_20260903_081500',
  createdAt: '2026-09-03T08:15:00.000Z',
  filename: 'fruteria_backup_2026-09-03.json',
  scope: 'completo' | 'solo_datos',
  sizeBytes: 1468000,
  storeCounts: { products: 1240, sales: 3150, tasas: 128 },
  storage: 'local' | 'shared',        // ruta o share
  path: '/storage/emulated/0/Backups/...', // si local
  mode: 'manual' | 'automatico',
}
```

- **Registro ≠ archivo exportado.** El `.json` solo lleva datos del negocio (se mantiene limpio); el registro es metadata de la app y vive en el dispositivo.
- **Referencia al archivo:** si es pequeño se guarda el archivo en IndexedDB; si no, se guarda su **ruta/path**. Así el Historial permite restaurar **sin volver a buscar el archivo** en el picker.
- **Auditoría:** además, cada respaldo emite un **evento INFO** en `logService` (`Backup creado: filename, scope, tamaño`).
- **Orden:** listado en **orden descendente por `createdAt`** (más reciente primero).

---

## 4. UX / Flujo del usuario

Nuevo **módulo Backup** dentro de Configuración (protegido por PIN), asistente de 3 pasos:

1. **Exportar** → elige alcance (`completo` / `solo datos del negocio` → productos+ventas+tasas) → genera el `.json`. Muestra resumen: nª registros por tienda, tamaño, fecha. **Directiva de guardado:**
   - **Por defecto:** guarda **local** en el dispositivo (carpeta SAF elegida por el usuario o app-privada). Siempre funciona offline.
   - **Botón secundario "Compartir / enviar":** abre el **share sheet del sistema** (Drive, WhatsApp, Gmail…) para llevar el respaldo **fuera del dispositivo** en calidad de **copia de redundancia**. Nunca es obligatorio.
2. **Restaurar** → selecciona archivo → muestra **preview** (tabla: qué se va a añadir / actualizar / reemplazar) → elige modo (`replace` / `merge`) → confirma con PIN → aplica con barra de progreso.
3. **Historial / programación** → lista de respaldos en **orden descendente por fecha/hora** (más reciente arriba), con opción de programar un **backup diario/semanal** y retención automática. Cada ítem es **accionable**:
   - **Restaurar** desde ese respaldo (sin volver a seleccionar el archivo, si quedó guardado en el dispositivo).
   - **Revertir** a la versión previa a la última restauración.
   - Muestra `fecha · hora · alcance · tamaño · ubicación (local/compartido) · modo (manual/automático)`.

---

## 5. Escenarios de uso cubiertos

- 🆕 **Nuevo dispositivo:** restaurar todo desde un backup del equipo anterior.
- 🔄 **Cambio de datos corruptos / recuperación:** reemplazo total al último backup bueno.
- 🖧 **Dos cajas (dos dispositivos):** merge para unificar inventario/ventas.
- 📤 **Fallo de app/datos:** botón "Restaurar" desde pantalla de error, sin depender de la navegación principal.
- 🎯 **Jornada de caja:** exportar automáticamente al cierre de turno.

---

## 6. Programación y retención

- **Auto-backup** en eventos clave: cierre de caja, modificación masiva de inventario, actualización de versión de la app.
- **Registro (`backup_registry`):** cada respaldo se registra con fecha/hora, nombre, alcance, tamaño, recuento por tienda, ubicación y modo — es la fuente del Historial (Sección 3.7).
- **Retención rotativa:** mantener los últimos N backups (p. ej. 7 diarios + 4 semanales + 1 mensual) y limpiar registro y archivos antiguos según esa política.
- Almacenamiento local (IndexedDB para backups pequeños) y/o **export a file system** del móvil vía Capacitor (Filesystem plugin) para respaldos grandes.

---

## 7. Consideraciones específicas de la plataforma

- **PWA / offline:** todo local, sin backend. Los clicks de descarga funcionan; en iOS Safari la descarga de blob puede requerir `FileSaver` o plugin nativo.
- **Capacitor (Android/iOS) — Exportar.** Existirán **dos vías de guardado**, ambas nativas, sin usar `a` + `download`:
  - **Guardado local (por defecto):** `@capacitor/filesystem` para escribir el `.json`, con picker de carpeta (`@capacitor-community/filesystem` → `pickFolder()`) para que el usuario elija el destino. Funciona siempre, incluso offline.
  - **Compartir (redundancia off-device):** `@capacitor/share` (`Share.share({ files: [...] })`) que abre el **share sheet** del sistema (Drive, WhatsApp, Gmail…).
- **Capacitor (Android/iOS) — Restaurar:** selección del `.json` mediante file picker (`@capacitor-community/file-picker`).
- **Rendimiento:** lectura/escritura por lotes (batch dentro de una tx), streaming con `cursor` para `sales`/`logs` (que pueden ser miles), y compresión opcional (gzip vía CompressionStream) si el archivo crece.

### 7.1 Decisión de diseño — "Guardar local + Compartir"

| Comportamiento | Prioridad | Justificación |
|---|---|---|
| Guardar local | **Primaria / por defecto** | Es el corazón de un POS offline-first: siempre funciona, sin depender de apps ni internet. |
| Compartir (share sheet) | **Secundaria / optativa** | El respaldo guardado en el propio dispositivo se pierde si el equipo se daña o se pierde. La copia fuera del dispositivo (Drive/WhatsApp) es la red de seguridad real. |

> ⚠️ **Regla de diseño:** el salvado local **nunca** se bloquea ni se vuelve obligatorio el compartir. El share sheet se ofrece como **complemento de redundancia**, no como único camino (si no hay apps o internet, el usuario debe poder respaldar igual).

---

## 8. Plan de implementación por fases

| Fase | Entregable |
|---|---|
| **F1 — Fundamentos** | `backupSchema` (catálogo completo), `backupService` con `create/validate/preview/import`, formato envelope + checksum, cobertura de `localStorage`. |
| **F2 — UX** | Pantalla Backup, asistente 3 pasos, PIN, resumen y preview/dry-run. |
| **F3 — Seguridad** | Cifrado opcional, bloqueo por intentos, copia previa automática, revertir. |
| **F4 — Programación** | Auto-backup + rotación y limpieza. |
| **F5 — Móvil/Capacitor** | `@capacitor/filesystem` (guardado local + `pickFolder`), `@capacitor-community/file-picker` (restaurar), `@capacitor/share` (share sheet), progreso, manejo de lotes grandes y compresión. |

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Backup incompleto (falta localStorage) | Catálogo único de fuentes + tests que verifiquen que nada queda fuera |
| Archivo corrupto | Checksum + validación de schema + mensaje de error claro |
| Restauración que rompe ventas/totalizadores | Preservación de `id`, transacción atómica, backup previo automático |
| DR sobreescribe datos nuevos | Preview + doble confirmación + modo `merge` selectivo |
| Backup grande → lento | Lotes + cursors + compresión + barra de progreso |

---

## 10. Decisiones abiertas / Preguntas pendientes

Puntos que conviene resolver **antes de implementar**; son decisiones de diseño, no detalles.

| # | Pregunta / Punto abierto | Contexto | Opciones a evaluar |
|---|---|---|---|
| 1 | **Colisión de `id` al hacer `merge` entre dos dispositivos.** | `sales`/productos usan `autoIncrement`; dos cajas generan ventas con ids solapados desde 1..n. Preservar ids (para no alterar totales) hace colisionar al unir dos dispositivos. | a) Re-mapear ids en el merge y ajustar referencias. b) Rechazar merge si hay solapamiento de ids y sugerir `replace`. c) Combinar (merge solo de catálogo/config, no de ventas). |
| 2 | **Recuperación del cifrado.** | Si se cifra con clave derivada de una frase y el usuario la olvida, el respaldo es irrecuperable. | Aviso explícito previo ("la frase no se puede recuperar") + cifrado solo como opción avanzada. |
| 3 | **Quota / archivos grandes.** | Guardar el backup en IndexedDB para restaurarlo desde el historial puede chocar con el límite de cuota del navegador/móvil. | Pequeño → IndexedDB; grande → guardar solo `path` (fallback automático). |
| 4 | **Snapshots consistentes.** | Leer varias stores de IndexedDB no es atómico; un respaldo a mitad de una venta queda inconsistente. | Forzar respaldos en cierre de caja (estado quiescente) y marcar "no garantizado si hay escrituras en curso". |
| 5 | **Seguridad del PIN al restaurar.** | Restaurar trae la config y el PIN viejos; si el usuario olvida el PIN restaurado queda bloqueado. | Aviso explícito antes de restaurar, o opción de **no sobreescribir el PIN local** (mantener el actual). |
| 6 | **Programación en PWA.** | Las PWA no ejecutan tareas en background; "backup diario" solo corre con la app abierta. | Clarificar como "diario al abrir la app"; el "al cierre de caja" sí funciona troncalmente. |

---

## 11. Criterios de aceptación

- Un backup exportado en un dispositivo restaura **exactamente** ese estado en otro (datos + configuración).
- Restaurar nunca deja la app en estado parcial; siempre hay una copia previa reversible.
- La restauración es **idempotente** (hacerla 2 veces no duplica ventas ni rompe totales).
- Exportar/restaurar funciona **sin conexión** y en **Android/iOS/PWA**.
- El ciclo está cubierto por tests (con `fake-indexeddb`) incluyendo migración de versiones v1→v2.
