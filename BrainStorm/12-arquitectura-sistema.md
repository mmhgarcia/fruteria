# 12 — Arquitectura del Sistema (PWA Offline-First)

> **Estado:** ⚡ En evolución
> **Prioridad:** Alta
> **Depende de:** 10, 11

---

## 🎯 Objetivo

Diseñar la arquitectura general del sistema: PWA offline-first, stack tecnológico, hosting y estrategia de resiliencia para el mercado venezolano.

---

## 🧱 Stack Tecnológico (Actual)

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 |
| Lenguaje | JavaScript (JSX) + TypeScript tipos |
| Bundler | Vite 5 |
| PWA | vite-plugin-pwa (service worker, instalable) |
| Persistencia | IndexedDB nativo + localStorage |
| Moneda | USD + Bs con tasa BCV |
| Hosting | Vercel (auto-deploy desde GitHub) |
| Backend | Ninguno — 100% frontend |

---

## 📐 Principios de Arquitectura

### Offline-First
- La app debe funcionar **sin internet** en todo momento
- Service worker cachea todos los assets (JS, CSS, HTML, imágenes)
- IndexedDB almacena datos localmente
- Sin backend → sin dependencia de servidor
- Ideal para cortes eléctricos y falta de conectividad en Venezuela

### Privacidad Local
- Todos los datos residen en el dispositivo del usuario
- No hay sincronización en la nube
- Backup manual vía archivo JSON descargable
- El comerciante tiene control total de sus datos

### Resiliencia
- Si el navegador se cierra inesperadamente → el carrito persiste en localStorage
- Si IndexedDB se corrompe → hay backup exportable
- Si la PWA se actualiza → el service worker hace auto-update (registerType: 'autoUpdate')

---

## 🌐 PWA

### Configuración actual (`vite.config.js`)

```javascript
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  manifest: {
    name: 'Frutería POS',
    short_name: 'FruteríaPOS',
    display: 'standalone',  // Se ve como app nativa
    start_url: '/',
    // ...
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
  }
})
```

### Estrategia de caché
- Workbox precachea todos los assets del build
- Los assets JS/CSS/HTML fuerzan `no-cache` via `public/_headers`
- Esto evita que el service worker sirva versiones obsoletas

### Ciclo de vida PWA
1. Usuario visita la URL por primera vez → se instala el service worker
2. Se muestra el prompt de instalación (add to home screen)
3. Usuario abre la app desde el ícono en su pantalla de inicio
4. La app funciona completamente offline
5. Al publicar una nueva versión → service worker se actualiza automáticamente

---

## 🚀 Flujo de Publicación

```
1. git add . && git commit -m "mensaje"
2. npm run build           → genera dist/
3. git push                → Vercel detecta el push y despliega
```

**Importante:** NO usar `gh-pages`. Vercel despliega automáticamente.

---

## 📁 Estructura del Proyecto

```
fruteria/
├── index.html             ← Entry point HTML
├── package.json           ← Dependencias
├── vite.config.js         ← Configuración Vite + PWA
├── public/
│   ├── _headers           ← Forzar no-cache
│   └── manifest.json      ← PWA manifest
├── src/
│   ├── main.jsx           ← Entry point React
│   ├── App.jsx            ← Estado global
│   ├── components/        ← UI components
│   ├── features/          ← Feature modules (TasaBcv)
│   ├── hooks/             ← Custom hooks
│   ├── utils/             ← Utilidades (db, format, hash, etc.)
│   └── data/              ← Datos por defecto
└── BrainStorm/            ← Documentación de ideas
```

---

## 🔮 Plan de Evolución

### Corto plazo
- [x] PWA instalable con service worker
- [x] Offline-first con IndexedDB
- [x] Hosting en Vercel
- [ ] Histórico de ventas con consultas

### Mediano plazo
- [ ] Sincronización entre múltiples dispositivos
- [ ] Servidor local opcional (ver [11-pouchdb-sincronizacion.md](11-pouchdb-sincronizacion.md))
- [ ] Modo "cerrado por hoy" (cierre de caja)

### Largo plazo
- [ ] Múltiples ramos comerciales en una sola instalación
- [ ] Dashboard web para el dueño (reportes desde cualquier dispositivo)
- [ ] Notificaciones push (alertas de stock bajo)

---

## Archivos Relacionados

- `vite.config.js`
- `public/manifest.json`
- `public/_headers`
- `src/main.jsx`
- `src/App.jsx`
- `BrainStorm/10-persistencia-bases-datos.md`
- `BrainStorm/11-pouchdb-sincronizacion.md`
