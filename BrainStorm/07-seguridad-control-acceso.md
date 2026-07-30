# 07 — Seguridad y Control de Acceso

> **Estado:** 🛡️ Implementado parcial (PIN y PinPrompt funcionan)
> **Prioridad:** Alta
> **Depende de:** N/A

---

## 🎯 Objetivo

Controlar el acceso a funciones administrativas mediante PIN, proteger contra accesos no autorizados y registrar intentos fallidos.

---

## Implementado

### ~~PIN de Administrador~~
- Campo en Configuración (mín. 4, máx. 6 dígitos)
- Ojito mostrar/ocultar la contraseña
- Se persiste como SHA-256 en `localStorage` (`fruteria-settings.pin`)

### ~~PinPrompt~~
- Modal con teclado numérico estilo bloqueo
- Se muestra al tocar "Configuración" si hay PIN configurado
- Si no hay PIN → entra directo sin prompt

### ~~PIN Hasheado~~
- SHA-256 (64 caracteres hex), nunca texto plano
- Compatibilidad hacia atrás con PINs legacy en texto plano
- `src/utils/hash.js` usa Web Crypto API con fallback

### ~~Contador de 3 Intentos Fallidos~~
- PinPrompt cuenta intentos fallidos
- Al llegar a 3 → registra log tipo `ALERT` con: timestamp, userAgent, pin ingresado
- El badge rojo del header muestra alertas no leídas

### ~~Badge de Alerta en Header~~
- Aparece en la fila inferior cuando hay logs `ALERT` no leídos
- Al hacer clic → abre Configuración (con PIN si está configurado)
- El contador persiste entre sesiones: compara con `fruteria-alert-read-at`

---

## Pendiente / Ideas

### Bloqueo por Sesión
> _Propuesta_

- Exigir el PIN al abrir la app por primera vez en el día (turno de trabajo)
- El PIN bloquea automáticamente las funciones administrativas (Precios, Categorías, Tasa) al cerrar esas ventanas
- Cajero puede usar el POS para cobrar, pero no modificar configuración
- Ventaja: si el dueño se retira del mostrador, el cajero no puede alterar precios

**Implementación propuesta:**
- `fruteria-auth-session` en localStorage: `{ autorizado: bool, timestamp: ISO }`
- Al cerrar ventana de admin → `autorizado = false`
- Al querer abrir Configuración → si `autorizado = false` → pedir PIN
- El badge de Configuración cambia de color si está bloqueado

### Escudo de Fuerza Bruta
> _Propuesta_

- Después de 3 intentos fallidos de PIN → **bloquear el teclado numérico por 5 minutos**
- El PinPrompt muestra un contador regresivo
- Bloqueo persistente (sobrevive a recarga de página)

**Implementación propuesta:**
```javascript
// En PinPrompt
const [blockedUntil, setBlockedUntil] = useState(null)

useEffect(() => {
  const stored = localStorage.getItem('fruteria-pin-blocked-until')
  if (stored && new Date(stored) > new Date()) {
    setBlockedUntil(stored)
  }
}, [])

if (failedAttempts >= 3) {
  const unlockTime = new Date(Date.now() + 5 * 60 * 1000)
  localStorage.setItem('fruteria-pin-blocked-until', unlockTime.toISOString())
  setBlockedUntil(unlockTime.toISOString())
  setFailedAttempts(0)
}
```

### ~~Confirmación de Tasa Segura~~
- Modal de confirmación al cambiar la tasa
- Muestra: "¿Confirmar nueva tasa a Bs 737,42?"
- Evita errores tipográficos que alteren el valor del inventario

---

## Relacionado

- Ver [13-identificacion-app.md](13-identificacion-app.md) — ID de instalación para forense
- Ver [14-proteccion-copias.md](14-proteccion-copias.md) — estrategias anti-copia
- Ver [15-hasheo-configuracion.md](15-hasheo-configuracion.md) — cifrado de settings

---

## Archivos Relacionados

- `src/components/PinPrompt.jsx` + `PinPrompt.css`
- `src/components/Header.jsx`
- `src/components/SettingsModal.jsx`
- `src/utils/hash.js`
- `src/utils/logService.js`
