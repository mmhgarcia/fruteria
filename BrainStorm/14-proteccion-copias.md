# 14 — Protección contra Copias No Autorizadas

> **Estado:** 🔍 En análisis
> **Prioridad:** Media
> **Depende de:** 13

---

## 🎯 Objetivo

Analizar y proponer estrategias para proteger la app POS de copias no autorizadas, considerando que es una aplicación 100% frontend sin backend.

---

## ⚠️ Realidad Técnica

**Esta app no se puede proteger al 100%.** Por diseño:

| Limitación | Implicación |
|-----------|-------------|
| Código 100% en el navegador | Todo el JS es visible y descargable desde DevTools |
| Sin backend | No hay un servidor central que autorice cada uso |
| Offline-first | Debe funcionar sin internet → descarta validación remota continua |
| PWA instalable | Service worker y manifest expuestos |
| Vite + React | Bundles JS minificados pero descompilables |

**Estrategia recomendada: Defensa en profundidad.** No hay una bala de plata, pero varias capas combinadas elevan significativamente la barrera.

---

## Estrategias Evaluadas

### 🏆 1. ID de Instalación Único + Marca de Agua + Auditoría

| Costo | Protección | Offline |
|-------|-----------|---------|
| Bajo | Disuasiva + trazabilidad | ✅ Sí |

**Cómo funciona:**
- UUID v4 único por instalación (ver [13-identificacion-app.md](13-identificacion-app.md))
- Marca de agua en tickets (footer con ID)
- Marca de agua en reportes
- Log FATAL al generar el ID (evidencia forense)
- Visible en Settings → "Acerca de"

**Cómo ayuda:**
- Disuade al dueño original de hacer copias (queda rastro)
- Si aparece una copia, el ID en tickets permite rastrear el origen
- El log FATAL queda como evidencia permanente

### 🥇 2. Licencia por Dispositivo con Firma RSA (Offline)

| Costo | Protección | Offline |
|-------|-----------|---------|
| Medio-Alto | Fuerte (criptográfica) | ✅ Sí |

**Cómo funciona:**
1. Generas un par de llaves RSA en tu máquina (offline)
2. Incrustas la **llave pública** en la app (`src/utils/license.js`)
3. El admin debe ingresar un código de licencia en la primera configuración
4. El código es un payload firmado con la **llave privada** (nunca se comparte)
5. La app verifica la firma usando `crypto.subtle.verify()` con la llave pública
6. Sin licencia → modo gracia (30 días completos, luego solo consulta)

**Payload de ejemplo:**
```json
{
  "deviceId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "ramo": "fruteria",
  "exp": "2027-12-31",
  "iss": "fruteria-pos"
}
```

**Generación de licencia (script CLI):**
```bash
node scripts/generate-license.js --deviceId="abc-123" --ramo="fruteria" --exp="2027-12-31"
# Output: eyJhbGciOiJSUzI1NiIs...
```

**Cómo ayuda:**
- Un atacante no puede generar licencias válidas sin la llave privada
- Puede parcharlo, pero requiere modificar el código
- La firma RSA es irrompible computacionalmente
- Offline: funciona sin internet

### 🥈 3. Device Fingerprinting + Locking

| Costo | Protección | Offline |
|-------|-----------|---------|
| Medio | Moderada | ✅ Sí |

**Cómo funciona:**
- Capturar huella digital del dispositivo al primer inicio:
  - `screen.width × screen.height` + `screen.colorDepth`
  - `navigator.platform` + `navigator.userAgent`
  - `navigator.hardwareConcurrency`
  - Canvas fingerprint (opcional)
- Hash de la huella → `deviceFingerprint`
- En cada inicio, recalcular y comparar
- Si la huella **no coincide** → log ALERT + exigir PIN de admin
- Si PIN correcto → actualizar la huella (permite cambios legítimos)

**Cómo ayuda:**
- Previene que copien los datos a otro dispositivo
- Si alguien clona la app (código + datos) en otro teléfono, al abrirlo detecta que es otro dispositivo

### 🥉 4. Restricción por Dominio (Online)

| Costo | Protección | Offline |
|-------|-----------|---------|
| Bajo | Leve | ❌ No funciona offline |

**Cómo funciona:**
- En el startup (si hay conexión), verificar `window.location.hostname` contra lista blanca
- Si no coincide → log ALERT + advertencia no bloqueante

### 5. Integridad del Código (Anti-Tamper)

| Costo | Protección | Offline |
|-------|-----------|---------|
| Medio | Moderada | ✅ Sí |

**Cómo funciona:**
- Calcular hash SHA-256 del bundle principal durante el build
- Incrustar el hash esperado en el código
- En runtime, verificar el hash
- Si no coincide → log FATAL + pantalla "app comprometida"

### 6. Ofuscación de Código

| Costo | Protección | Offline |
|-------|-----------|---------|
| Bajo | Leve (barrera visual) | ✅ Sí |

**Cómo funciona:**
- Configurar Vite para ofuscar con `terser` o `javascript-obfuscator`
- Renombrar variables, eliminar strings legibles

---

## 🎯 Recomendación

### Árbol de Decisión

```
¿Qué nivel de protección necesitas?
│
├── Solo rastrear copías → Fase 1 (ID + watermark + logs)
│
├── Evitar que copias funcionen sin permiso → Fase 1 + Fase 2 (licencias RSA)
│
├── Vincular a un dispositivo específico → Fase 1 + Fase 2 + Fase 3 (fingerprint)
│
└── Protección máxima → Fase 1 + 2 + 3 + 4 + 5 + 6 (todo + ofuscación)
```

### Recomendación para Frutería POS
**Fase 1 + Fase 2** es el punto óptimo:
- Trazabilidad (ID en tickets)
- Protección real (licencias RSA)
- Sin afectar la experiencia offline
- Esfuerzo de implementación moderado

---

## 📝 Plan de Implementación (Fase 1 + Fase 2)

### Fase 1 — ID y Trazabilidad (3-4 días)
Ver [13-identificacion-app.md](13-identificacion-app.md) para detalle.

| # | Tarea |
|---|-------|
| 1.1 | Crear `src/utils/deviceId.js` |
| 1.2 | Agregar store `instalacion` en IndexedDB (v7) |
| 1.3 | Registrar log FATAL al generar ID |
| 1.4 | Footer con ID en tickets y reportes |
| 1.5 | Sección "Acerca de" en Settings |

### Fase 2 — Licencias RSA (5-7 días)

| # | Tarea | Archivo |
|---|-------|---------|
| 2.1 | Generar par de llaves RSA (offline) | `private-key.pem` (no versionar) |
| 2.2 | Script CLI para firmar licencias | `scripts/generate-license.js` |
| 2.3 | Incrustar llave pública en la app | `src/utils/license.js` |
| 2.4 | Verificar licencia con `crypto.subtle.verify()` | `src/utils/license.js` |
| 2.5 | Campo de licencia en Settings | `SettingsModal.jsx` |
| 2.6 | Modo gracia (30 días sin licencia) | `App.jsx` |
| 2.7 | Botón "Solicitar licencia" | `SettingsModal.jsx` |

---

## ⚠️ Consideraciones

### ¿Qué pasa si el cliente pierde el dispositivo?
- Con Fase 2: puedes generar una nueva licencia para el nuevo deviceId
- Con Fase 3: necesitarías un "código de recuperación" impreso en papel

### ¿Manejo de actualizaciones?
- La licencia almacenada en IndexedDB sobrevive a actualizaciones PWA
- El fingerprint también
- El código nuevo reemplaza al viejo → la llave pública se actualiza si cambias de par

### ¿Cómo se entregan las licencias?
**Opción recomendada (manual):**
1. El cliente te envía su deviceId (desde Settings → "Copiar ID")
2. Ejecutas: `node scripts/generate-license.js --deviceId="..." --ramo="fruteria"`
3. Le envías el código de licencia
4. El cliente lo ingresa en Settings → Licencia

---

## Archivos a Crear/Modificar

| Archivo | Acción | Fase |
|---------|--------|------|
| `src/utils/deviceId.js` | CREAR | 1 |
| `src/utils/license.js` | CREAR | 2 |
| `src/utils/db.js` | Modificar (store instalacion) | 1 |
| `src/utils/backupService.js` | Modificar (STORES) | 1 |
| `src/App.jsx` | Integrar chequeos | 1,2 |
| `src/main.jsx` | Generar installId | 1 |
| `scripts/generate-license.js` | CREAR | 2 |
| `src/components/SettingsModal.jsx` | Acerca de + Licencia | 1,2 |
| `src/components/TicketPreview.jsx` | Footer ID | 1 |
| `package.json` | Script generate-license | 2 |
| `.gitignore` | Ignorar private-key.pem | 2 |

---

## Relacionado

- Ver [13-identificacion-app.md](13-identificacion-app.md) — ID de instalación
- Ver [15-hasheo-configuracion.md](15-hasheo-configuracion.md) — cifrado de settings
- Ver [07-seguridad-control-acceso.md](07-seguridad-control-acceso.md) — PIN y bloqueo
