# 13 — Identificación de la App

> **Estado:** 💡 Idea
> **Prioridad:** Baja
> **Depende de:** 10

---

## 🎯 Objetivo

Asignar un **identificador único** a cada instalación de la app para trazabilidad, auditoría y protección anti-copia.

---

## Preguntas Originales

Del brainstorm original:

> *Al instalar la app se le asignará un serial ID*
> - ¿Es posible?
> - ¿Sería buena práctica?
> - ¿Dónde y cómo se almacenaría?

---

## Respuestas

### ¿Es posible?
**Sí.** Se puede generar un UUID v4 en el primer inicio usando `crypto.randomUUID()` (Web Crypto API, disponible en todos los navegadores modernos).

```javascript
function generateInstallId() {
  return crypto.randomUUID()  // Ej: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

### ¿Sería buena práctica?
**Sí, con matices:**

| Aspecto | Evaluación |
|---------|-----------|
| **Trazabilidad** | ✅ Permite rastrear qué instalación generó un ticket o un log |
| **Auditoría** | ✅ Útil para reportes de ventas (saber qué dispositivo vendió qué) |
| **Anti-copia** | ⚠️ Disuasivo, no blocker. El ID se puede eliminar modificando el código |
| **Privacidad** | ⚠️ El ID no contiene datos personales, es anónimo |
| **Complejidad** | ✅ Mínima: ~10 líneas de código |

### ¿Dónde y cómo se almacenaría?
**Doble persistencia para redundancia:**

| Ubicación | Por qué |
|-----------|---------|
| **IndexedDB** (`instalacion` store) | Datos permanentes, sobrevive a cualquier limpieza |
| **localStorage** (`fruteria-install-id`) | Acceso síncrono, rápido |

```javascript
// En src/utils/deviceId.js
export async function getOrCreateInstallId() {
  // 1. Intentar leer de localStorage (rápido)
  let id = localStorage.getItem('fruteria-install-id')
  if (id) return id

  // 2. Intentar leer de IndexedDB (persistente)
  id = await readInstallIdFromDB()
  if (id) {
    localStorage.setItem('fruteria-install-id', id)
    return id
  }

  // 3. Generar nuevo ID
  id = crypto.randomUUID()
  await saveInstallIdToDB(id)
  localStorage.setItem('fruteria-install-id', id)

  // 4. Registrar log de nueva instalación
  await addLog(LOG_TYPES.FATAL, 'NUEVA INSTALACIÓN', {
    installId: id,
    userAgent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}`,
    timestamp: new Date().toISOString()
  })

  return id
}
```

---

## Usos del ID de Instalación

### 1. Marca de agua en tickets
```
Frutería POS
=============
...
Total: $25,50
ID: f47ac10b-58cc-4372 ║ v1.0
```

### 2. Trazabilidad en logs
```javascript
addLog(LOG_TYPES.ALERT, 'Intento de acceso no autorizado', {
  installId: getInstallId(),
  pinIngresado: '***',
  timestamp: new Date().toISOString()
})
```

### 3. Auditoría de ventas
Cada venta registra qué instalación la generó:
```javascript
{
  id: 1234,
  installId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  items: [...],
  totalUSD: 25.50,
  // ...
}
```

### 4. Licencias por dispositivo
El ID de instalación se usa como identificador único para generar licencias → _ver [14-proteccion-copias.md](14-proteccion-copias.md)_

---

## UX Propuesta

En Configuración, sección "Acerca de / Dispositivo":

```
┌─────────────────────────────┐
│  ℹ️ Acerca de este equipo   │
│                             │
│  ID de instalación:         │
│  f47ac10b-58cc-4372-a567   │
│                             │
│  📋 Copiar ID               │
│                             │
│  Versión: 1.0.0             │
│  Navegador: Chrome 120     │
│  SO: Android 14            │
│  Pantalla: 1080 x 2340     │
└─────────────────────────────┘
```

---

## Relacionado

- Ver [14-proteccion-copias.md](14-proteccion-copias.md) — licencias por dispositivo
- Ver [12-arquitectura-sistema.md](12-arquitectura-sistema.md) — versión del sistema
- Ver [07-seguridad-control-acceso.md](07-seguridad-control-acceso.md) — logs de auditoría

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/utils/deviceId.js` | **CREAR** — getOrCreateInstallId(), getDeviceFingerprint() |
| `src/utils/db.js` | Agregar store `instalacion`, subir DB_VERSION a 7 |
| `src/utils/backupService.js` | Agregar `instalacion` a STORES |
| `src/main.jsx` | Generar installId al inicio |
| `src/App.jsx` | Integrar chequeo de instalación |
| `src/components/SettingsModal.jsx` | Sección "Acerca de" |
| `src/components/TicketPreview.jsx` | Footer con ID de instalación |
| `src/components/Ticket.jsx` | Footer con ID de instalación |
