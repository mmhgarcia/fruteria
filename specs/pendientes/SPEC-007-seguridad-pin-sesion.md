# SPEC-007: Endurecer seguridad de PIN y sesión de administrador

> **Prioridad: P1 — ALTA (seguridad / control de acceso)**

## 1. Problema (¿por qué?)
- El PIN se guarda como SHA-256 **sin sal** (`hash.js:10`). Un PIN de 4-6 dígitos se fuerza por fuerza bruta en segundos; PINs iguales → hash idéntico.
- El fallback de `hash.js` (si `crypto.subtle` no está) es un hash **casi nulo** y se activa **en silencio**.
- La sesión de admin es un booleano en `localStorage` (`session.js:16`): forjable desde DevTools. Y un `expiresAt` inválido (`session.js:29`) hace que **la sesión nunca expire**. El anti-fuerza-bruta también es editable.

## 2. Objetivo (¿qué logramos?)
Que el PIN no sea forzable trivialmente, que la sesión no sea forjable ni eterna, y que no haya degradación silenciosa de seguridad.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Hash de PIN con **salt aleatorio por PIN** (PBKDF2 vía Web Crypto). Guardar `salt` + `hash` juntos.
- [ ] Verificar el PIN derivando el hash del PIN ingresado con el salt guardado y comparando.
- [ ] Eliminar el **fallback débil** o reemplazarlo por un aviso de que la seguridad está degradada (nunca silencioso).
- [ ] Considerar almacenar el intento/hash en IndexedDB (no solo localStorage) para dificultar la edición — o al menos firmar/validar la sesión.
- [ ] Validar que `expiresAt` sea un número finito válido; si es inválido, no autorizar.
- [ ] Revisar que el bloqueo por fuerza bruta no sea trivialmente eludible (validación robusta).

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Autenticación remota / multi-caja.
- ❌ Roles por operador (puede ser una spec futura).
- ❌ Recuperación de PIN olvidado.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] ¿Migración de PINs ya guardados? Los usuarios existentes tienen hash SHA-256 sin sal. ¿Re-hashear al próximo login o pedir redefinir el PIN una vez?
- [ ] ¿PBKDF2 o Argon2? (PBKDF2 — Web Crypto nativo, sin librería extra.)
- [ ] ¿Cuántas iteraciones PBKDF2? (Compromiso entre resistencia y latencia en dispositivo de una PYME; empezar por ~100k, configurable?)

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Cambio el PIN desde Ajustes y reinicio la app → el PIN nuevo funciona, el viejo no.
2. El hash guardado incluye salt distinto por PIN (editar el mismo PIN de nuevo genera otro hash).
3. Con la sesión activa, editar `expiresAt`/`autorizado` en localStorage no me otorga acceso ni extiende la sesión.
4. Si fuerzo un `expiresAt` inválido, la sesión se rechaza / no autoriza.
5. El bloqueo por fuerza bruta (3 intentos → 5 min) sigue funcionando y no se puede resetear desde la app.

## 7. Archivos que probablemente tocaré
- `src/utils/hash.js` — derivación PBKDF2 con salt.
- `src/utils/session.js` — validación de `expiresAt`, robustez de sesión.
- `src/components/PinPrompt.jsx` / `src/components/SettingsModal.jsx` — verificación del PIN y flujo de cambio.

## 8. Riesgos / notas
- **Migración de datos**: cambiar el formato del hash rompe PINs ya guardados. Definir estrategia clara (se decidió en §5).
- No exponer el PIN en logs ni en el ticket nunca (principio ya presente, mantenerlo).
- Usar Web Crypto con `crypto.subtle` requiere contexto seguro (HTTPS); la app (PWA/Capacitor) en localhost/producción lo cumple. Documentar el fallback si no.

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
