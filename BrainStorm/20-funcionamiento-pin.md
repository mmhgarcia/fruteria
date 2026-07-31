# 20 — Funcionamiento del PIN

> **Estado:** 🛡️ Implementado
> **Prioridad:** Alta
> **Depende de:** 07, 15

---

## 🎯 Objetivo

Documentar el ciclo completo del PIN de administrador: configuración, hasheo, validación, bloqueo de acceso y registro de intentos fallidos.

---

## Flujo General

```mermaid
flowchart TD
    A[App inicia] --> B{¿settings.pin existe?}
    B -->|No| C[Configuración entra directo]
    B -->|Sí| D[PinPrompt se muestra]
    D --> E{¿PIN correcto?}
    E -->|Sí| F[SettingsModal se abre]
    E -->|No| G[Muestra error + shake]
    G --> H{¿3 intentos fallidos?}
    H -->|Sí| I[Log ALERT con userAgent y PIN]
    H -->|No| D
```

---

## Configuración del PIN

### Desde Configuración
- Campo de texto (solo dígitos, máx. 6) en `SettingsModal`
- Botón 👁️/🙈 para mostrar/ocultar
- Mínimo 4 dígitos, máximo 6
- Hint "Mín. 4 dig." si se escriben menos de 4
- Badge "✓ Configurado" si ya existe un PIN
- Si se deja vacío conservando uno existente → se mantiene el actual

### Persistencia
- Se guarda **hasheado** (SHA-256 hex, 64 caracteres) en `localStorage`
- Clave: `fruteria-settings` → propiedad `pin`
- Nunca se persiste en texto plano

---

## Hasheo (`src/utils/hash.js`)

- SHA-256 mediante Web Crypto API (`crypto.subtle.digest`)
- Fallback a hash simple de 32 bits en entornos sin Web Crypto
- `hashPin(pin)` devuelve string hex

---

## Validación en PinPrompt (`src/components/PinPrompt.jsx`)

### Detección del formato
- `isHashed` = regex `/^[0-9a-f]{64}$/` sobre el PIN almacenado
- Si está hasheado → longitud esperada = 6 (no se puede saber la real)
- Si es texto plano (legacy) → longitud = la del PIN almacenado
- Compatibilidad hacia atrás con PINs guardados antes del hasheo

### Teclado numérico
- 4 filas: 1-2-3, 4-5-6, 7-8-9, vacío-0-⌫
- Auto-check al alcanzar `Math.min(pinLength, 4)` dígitos
- Máximo 6 dígitos

### Verificación
```javascript
enteredHash = await hashPin(entered)
correcto = (enteredHash === pin) || (entered === pin)  // hash o legacy
```

### Comportamiento en error
- Muestra "PIN incorrecto" + animación shake 600ms
- Limpia los dígitos tras el error
- El error se evalúa al completar `pinLength` o 6 dígitos

---

## Contador de 3 Intentos Fallidos

- `failedAttempts` aumenta con cada PIN incorrecto completo
- Al llegar a 3 → `addLog(LOG_TYPES.ALERT, 'Acceso no autorizado - 3 intentos fallidos de PIN', ...)`
- El log incluye: `failedAttempts`, `intentos`, `pinIngresado`, `timestamp`, `userAgent`
- `loggedRef` evita registrar el log más de una vez por sesión
- El badge rojo de alertas del header se activa con logs `ALERT`
- El contador se resetea: al loguear correctamente, al cerrar el prompt

---

## Integración (App.jsx)

| Acción | Sin PIN configurado | Con PIN |
|--------|--------------------|---------|
| Tocar "Configuración" | Abre SettingsModal directo | Abre PinPrompt primero |
| PIN correcto | — | Cierra prompt → abre SettingsModal |
| PIN incorrecto ×3 | — | Log ALERT (badge en header) |

---

## Archivos Relacionados

- `src/components/PinPrompt.jsx` + `PinPrompt.css`
- `src/components/SettingsModal.jsx`
- `src/components/Header.jsx` (badge de alertas)
- `src/components/LogsViewerModal.jsx`
- `src/utils/hash.js`
- `src/utils/logService.js`
- `src/App.jsx` (orquestación del flujo)

---

## Relacionado

- Ver [07-seguridad-control-acceso.md](07-seguridad-control-acceso.md) — control de acceso general
- Ver [15-hasheo-configuracion.md](15-hasheo-configuracion.md) — cifrado de settings
