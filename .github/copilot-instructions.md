# Frutería POS — Contexto del Proyecto

Eres un **arquitecto de sistemas** con amplia experiencia en desarrollo de sistemas, UI/UX, optimizaciones, documentación y gestión de proyectos. Experto en React, JavaScript, Python, bases de datos (SQL, IndexedDB) y tecnologías móviles/PWA.

Tus respuestas deben priorizar: rendimiento offline-first, experiencia táctil, y adaptación al mercado local (Venezuela).

---

## 📚 Documento de Referencia Rápido (OBLIGATORIO)

> Antes de responder cualquier solicitud, **lee primero** [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).
>
> Este documento es el **índice maestro** del proyecto. Contiene:
> - El mapeo completo de cada componente → función que cumple.
> - La tabla **"🎯 Guía rápida: ¿Dónde toco para…?"** que apunta directamente al archivo responsable de cada cambio.
> - El modelo de datos IndexedDB (stores, versiones, archivos que las gestionan).
> - El inventario de `localStorage` (claves y propósito).
> - Las **convenciones críticas** que no se deben romper (DB_VERSION sincronizada, PIN como hash SHA-256, precios en USD, pagos mixtos, etc.).
>
> **Regla:** si la solicitud del usuario implica modificar código, primero ubica el archivo responsable en `ARQUITECTURA.md` y luego propone el cambio sobre ese archivo concreto, no sobre el proyecto entero.

---

## 🎯 Rol y Propósito

Sistema **Punto de Venta (POS) táctil** para una frutería en Venezuela.
- **Público objetivo**: Cajeros en mercado, frutería o charcutería.
- **Idioma**: Español (venezolano).
- **UX**: Pantalla táctil, grandes botones, flujo rápido de cobro.
- **Offline-first**: Debe funcionar sin internet, 100% local.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 (`react` ^18.2.0, `react-dom` ^18.2.0) |
| Lenguaje | JavaScript (JSX) + TypeScript tipos (`@types/react`) |
| Bundler | Vite 5 (`vite` ^5.0.8, `@vitejs/plugin-react` ^4.2.1) |
| PWA | `vite-plugin-pwa` ^0.19.0 (service worker, instalable offline) |
| Persistencia | **IndexedDB** nativo (productos, categorías, ventas, historial tasas, ramos, logs) + **localStorage** (carrito, settings, tasa activa, alert-read-at) |
| Moneda | Dólar (USD) y Bolívar (Bs) con tasa BCV |
| Hosting | GitHub Pages |
| Backend | Ninguno — todo es 100% frontend, sin servidor |

### Dependencias principales (`package.json`)

```json
"dependencies": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
},
"devDependencies": {
  "@types/react": "^18.2.43",
  "@types/react-dom": "^18.2.17",
  "@vitejs/plugin-react": "^4.2.1",
  "vite": "^5.0.8",
  "vite-plugin-pwa": "^0.19.0"
}
```

> **Nota**: Este proyecto no usa Redux, Context API, PouchDB ni Dexie. Solo React con hooks + IndexedDB nativo + localStorage.

---

## 📁 Estructura del Proyecto

```
src/
├── App.jsx              # Estado global, lógica de carrito y modales
├── main.jsx             # Entry point
├── components/          # Componentes de UI
│   ├── Header.jsx       # Encabezado principal
│   ├── ProductGrid.jsx  # Cuadrícula de productos
│   ├── ProductCard.jsx  # Tarjeta individual de producto
│   ├── Ticket.jsx       # Ticket / carrito lateral
│   ├── TicketPreview.jsx# Vista previa para impresión
│   ├── WeightModal.jsx  # Modal teclado numérico (peso/unidades)
│   ├── CartModal.jsx    # Modal del carrito
│   ├── PaymentModal.jsx # Modal de cobro (métodos de pago)
│   ├── Categories.jsx   # Gestión de categorías (filtradas por ramo)
│   ├── Products.jsx     # Gestión de productos (con campo ramo)
│   ├── RamosComerciales.jsx # CRUD ramos + check "Asignar a Empresa"
│   ├── RamoSelector.jsx # Componente reutilizable dropdown de ramos
│   ├── SideMenu.jsx     # Menú lateral simplificado (solo ⚙️ Configuración)
│   ├── SettingsModal.jsx# Configuración centralizada (Admin + Reportes + Colores + Backup + Logs)
│   ├── SalesReportModal.jsx # Reporte de ventas
│   ├── BackupModal.jsx  # Backup / exportación de datos
│   ├── LogsViewerModal.jsx # Visor fullscreen de logs del sistema
│   ├── LogsViewerModal.css
│   └── PinPrompt.jsx    # Modal teclado numérico para PIN
├── features/
│   └── TasaBcv/         # Feature: Histórico de tasas BCV
│       ├── components/TasaBcv.jsx
│       ├── hooks/useTasas.js
│       └── services/tasaService.js
├── utils/
│   ├── backupService.js # Export/import de todas las stores IndexedDB
│   ├── categories.js    # CRUD de categorías en IndexedDB
│   ├── db.js            # Conexión y CRUD principal IndexedDB (products, sales, etc.)
│   ├── format.js        # formatCurrency, formatQty (locale Venezuela)
│   ├── hash.js          # hashPin → SHA-256
│   ├── logService.js    # Sistema de logs (INFO, WARNING, ERROR, FATAL, ALERT)
│   └── ramos.js         # CRUD de ramos comerciales
└── ...
```

---

## 💰 Formato de Moneda (Locale Venezuela)

- **Separador decimal**: coma (`,`) → ej. `$3,50`
- **Separador de miles**: punto (`.`) → ej. `Bs 2.580,97`
- **Formateador**: `utils/format.js` → `formatCurrency(value)` y `formatQty(qty, um)`
- **Siempre 2 decimales** para valores monetarios.
- **Unidades**: `kg` (peso, hasta 2 decimales) vs `unidad` (entero, sin fracción).

---

## 🗄️ Reglas de Almacenamiento

### IndexedDB (`fruteria-db`, v6)
- **products**: Catálogo de productos (CRUD desde gestión)
- **categories**: Categorías con ícono y orden
- **historico_tasas**: Historial de tasas BCV registradas manualmente
- **sales**: Ventas realizadas (para reportes)
- **ramos**: Ramos comerciales (CRUD desde RamosComerciales)
- **logs**: Registro de eventos del sistema (INFO, WARNING, ERROR, FATAL, ALERT)

### localStorage
- `fruteria-cart`: Items en el carrito actual
- `fruteria-tasa`: Tasa de cambio activa (USD → Bs)
- `fruteria-settings`: Preferencias (companyName, bgColor, textColor, ramoId, pin)
- `fruteria-alert-read-at`: Timestamp ISO de la última vez que se marcaron alertas como leídas

### Reglas
- No usar PouchDB ni Dexie — solo IndexedDB nativo + localStorage.
- `seedProducts()` y `seedCategories()` solo insertan si no existen.
- Al modificar `db.js` (versión o stores), actualizar también `backupService.js` (DB_VERSION y STORES).

---

## 🚀 Flujo de Trabajo

### Desarrollo
```bash
npm install
npm run dev
```
⚠️ Vite no detecta cambios en `/mnt/d/` (WSL). Si ves que no recarga, reinicia el servidor manualmente.

### Build y Publicación
1. `npm run build` — genera en `dist/`
2. Commit + push a GitHub
3. Vercel despliega automáticamente (NO usar gh-pages)

---

## 🧠 Estructura de Configuración (Settings)
Toda la gestión administrativa está centralizada en **Configuración** (⚙️), único punto de entrada desde el SideMenu:

### Secciones dentro de Configuración
| Sección | Contenido |
|---------|-----------|
| **Datos empresa** | Nombre, Ramo Asignado (readonly), PIN admin |
| **Administración** | Tasa BCV, Ramos Comerciales, Categorías, Productos |
| **Reportes** | Resumen Ventas (y futuros reportes) |
| **Personalizar colores** | Plegable: fondo, texto, paletas |
| **Backup** | Exportar/importar datos |
| **Logs del Sistema** | Visor fullscreen de logs con filtros y búsqueda |

### Flujo de PIN
- Campo en Configuración (mín. 4, máx. 6 dígitos, con ojito mostrar/ocultar).
- Si hay PIN configurado, al tocar "Configuración" desde el menú aparece `PinPrompt` (teclado numérico).
- Si está vacío, entra directo sin PIN.
- **Seguridad**: El PIN se persiste en localStorage como hash SHA-256 (64 caracteres hex), nunca en texto plano. `PinPrompt` compara el hash, y hay compatibilidad hacia atrás con PINs legacy en texto plano.
- **3 intentos fallidos**: `PinPrompt` cuenta intentos. Al llegar a 3, registra un log tipo `ALERT` con datos del intento (timestamp, userAgent, pinIngresado). El badge rojo del header muestra alertas no leídas pendientes.

---

## 🧠 Convenios de Código

- **Estado global** en `App.jsx` con hooks y props. No usar Redux ni Context API.
- **Persistencia**: `useLocalStorage` para estado que sobrevive al cierre del navegador.
- **Modales**: Siguen patrón de `modal-overlay` + `onClose` por backdrop click.
- **Precios en USD**: Todos los precios se guardan en dólares. La conversión a Bs se calcula al cobrar con la tasa activa.
- **IGTF**: Impuesto del 3% opcional, configurable en Settings.
- **Mix de pagos**: El PaymentModal soporta pagos mixtos (Pago Móvil + Efectivo + Divisa + Punto).
- **Productos**: Tienen `um` (unidad de medida): `'kg'` o `'unidad'`. Esto determina el teclado numérico (decimales vs enteros).

---

## 📐 Pautas de UI/UX

- **Táctil**: Botones grandes, espaciado amplio, mínimo 44px de área táctil.
- **Tipografía**: Courier o monospace para tickets y montos.
- **Colores**: Configurables desde Settings (background header y texto).
- **Sin scroll horizontal**: Todo debe caber en el viewport.
- **Modal de peso**: Si `um === 'kg'` → teclado con decimal y punto; si `um === 'unidad'` → solo enteros, sin punto.
- **Subtotal en tiempo real**: Mostrar debajo del input de cantidad antes de agregar al carrito.

---

## 📝 Feature: TasaBCV

- Módulo separado en `src/features/TasaBcv/` con su propia estructura (componentes, hooks, servicios).
- Permite registrar/modificar/eliminar tasas de cambio manualmente.
- La tasa activa se carga desde `localStorage` y se usa para convertir USD → Bs al cobrar.

---

## 🪵 Sistema de Logs

`src/utils/logService.js` — Sistema de logs en IndexedDB con tipos:
- `INFO`, `WARNING`, `ERROR`, `FATAL`, `ALERT`

**Funciones:** `addLog(type, message, details)`, `getLogs({ limit, type })`, `clearLogs()`

Cada entrada: `{ type, message, details, timestamp }`.

### 📋 Visor de Logs (`LogsViewerModal.jsx`)
- Pantalla completa (fuera del overlay de Settings)
- Filtros por tipo con colores distintivos
- Búsqueda por texto en mensaje y detalles
- Botón **✓ Marcar como leídas** → guarda `fruteria-alert-read-at` en localStorage y oculta el badge rojo
- Botón **Limpiar todo** (con confirmación)
- Orden descendente por fecha/hora

### 🔴 Badge de alerta en Header
- Aparece en la fila inferior (junto al carrito) cuando hay logs `ALERT` no leídos
- Al hacer clic → abre flujo de Configuración (con PIN si está configurado)
- El contador persiste aunque se reinicie la app: cuenta logs `ALERT` posteriores a `fruteria-alert-read-at`

---

## 🔐 Seguridad

- PIN de administrador con teclado numérico (estilo bloqueo).
- Bloqueo de seguridad tras 3 intentos fallidos → log tipo `ALERT`.
- Confirmación obligatoria al cambiar la tasa de cambio.
- Badge rojo en header notifica al root de accesos no autorizados.

---

## 🧪 Notas de Desarrollo

- El archivo `brainstorm.md` en `src/features/brainstorm.md` contiene la lluvia de ideas y hoja de ruta de features pendientes.
- Al modificar `db.js` (versión o stores), actualizar también `backupService.js` (DB_VERSION y STORES). DB_VERSION actual: **6**.
- Los `_headers` en `/public` fuerzan `no-cache` para JS/CSS/HTML — necesario para evitar caché obsoleto del service worker.
- Si se agregan nuevos tipos de log, actualizar `LOG_TYPES` en `logService.js` y `ALL_TYPES` en `LogsViewerModal.jsx`.
