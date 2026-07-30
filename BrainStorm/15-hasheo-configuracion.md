# 15 — Hasheo de Configuración

> **Estado:** 💡 Idea / Propuesta
> **Prioridad:** Baja
> **Depende de:** 07

---

## 🎯 Objetivo

Analizar qué información de configuración debería almacenarse cifrada o hasheada, más allá del PIN de administrador, para proteger datos sensibles del negocio.

---

## Estado Actual

Hoy solo el **PIN** se almacena hasheado (SHA-256):
- `fruteria-settings.pin` → hash de 64 caracteres hex
- Implementado en `src/utils/hash.js`

El resto de `fruteria-settings` se guarda en texto plano:
```javascript
{
  companyName: "Frutería POS",
  bgColor: "#4a8c5e",
  textColor: "#ffffff",
  ramoId: "fruteria",
  pin: "a1b2c3...",  // ← esto SÍ está hasheado
}
```

---

## ¿Qué más debería protegerse?

### Candidatos a hashear/cifrar

| Dato | ¿Hashear? | ¿Por qué? | Prioridad |
|------|-----------|-----------|-----------|
| PIN | ✅ **Ya implementado** | Acceso administrativo | Alta |
| Tasa BCV activa | ❌ No necesario | Es un valor público que cambia seguido | — |
| Company name | ❌ No necesario | Dato público en tickets | — |
| Colores | ❌ No necesario | Solo UI, sin valor sensible | — |
| Ventas totales | ⚠️ Opcional | Podría tener interés comercial | Baja |
| Backup exportado | ⚠️ Opcional | Contiene datos completos del negocio | Media |
| **Serial ID / Install ID** | ✅ Recomendado | Identificador único del dispositivo | Media |
| **Configuración de red** | ✅ Recomendado | IP del servidor local (futuro) | Media |

---

## Propuesta

### Capa 1 — PIN (YA IMPLEMENTADO)
- SHA-256 del PIN, nunca texto plano
- Compatibilidad hacia atrás con PINs legacy

### Capa 2 — Hash del Install ID (Propuesto)
- Almacenar el `installId` con hash adicional
- No es crítico pero añade capa de ofuscación
- El ID original se genera una vez y se guarda en IndexedDB + localStorage

### Capa 3 — Cifrado del Backup (Futuro)
- Opción: cifrar el archivo JSON de backup con AES
- El usuario elige una contraseña al exportar
- Al importar, pide la contraseña
- Implementación: Web Crypto API (`crypto.subtle.encrypt`)

```javascript
// Ejemplo de cifrado AES-GCM para backup
async function encryptBackup(data, password) {
  const keyMaterial = await crypto.subtle.importKey('raw',
    new TextEncoder().encode(password),
    'PBKDF2', false, ['deriveKey'])

  const key = await crypto.subtle.deriveKey({
    name: 'PBKDF2', salt: crypto.getRandomValues(new Uint8Array(16)),
    iterations: 100000, hash: 'SHA-256'
  }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data))
  )
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }
}
```

### Capa 4 — Settings completos cifrados (Futuro lejano)
- Almacenar TODO `fruteria-settings` como un solo blob cifrado
- Al iniciar la app, pedir PIN para descifrar
- Si no hay PIN, los settings se cargan con valores por defecto
- **Problema**: el carrito y la tasa necesitan acceso rápido → incompatible con cifrado

---

## Árbol de Decisión

```
¿Cifrar settings completos?
│
├── No (recomendado) → Solo PIN hasheado. El resto en texto plano.
│   Simple, rápido, funcional. El riesgo es bajo (datos locales).
│
├── Sí, cifrado simétrico → Settings como blob cifrado con AES-GCM.
│   Más seguro, pero: más lento, más complejo, riesgo de perder
│   acceso si se olvida el PIN.
│
└── Sí, ofuscación ligera → Base64 o XOR simple.
    No es seguridad real, solo "security by obscurity".
    No se recomienda.
```

**Recomendación:** Mantener solo el PIN hasheado. El cifrado completo de settings añade complejidad sin beneficio real para este tipo de app (datos locales, sin sincronización en la nube).

---

## Archivos Relacionados

- `src/utils/hash.js`
- `src/utils/backupService.js`
- `src/components/SettingsModal.jsx`
- `BrainStorm/07-seguridad-control-acceso.md`
- `BrainStorm/14-proteccion-copias.md`
