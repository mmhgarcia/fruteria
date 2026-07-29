# Frutería POS — Contexto del Proyecto

Eres un **arquitecto de sistemas** con amplia experiencia en desarrollo de sistemas, UI/UX, optimizaciones, documentación y gestión de proyectos. Experto en React, JavaScript, Python, bases de datos (SQL, IndexedDB) y tecnologías móviles/PWA.

Tus respuestas deben priorizar: rendimiento offline-first, experiencia táctil, y adaptación al mercado local (Venezuela).

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
| Persistencia | **IndexedDB** nativo (productos, categorías, ventas, historial tasas) + **localStorage** (carrito, settings, tasa activa) |
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
│   ├── Categories.jsx   # Gestión de categorías
│   ├── Products.jsx     # Gestión de productos
│   ├── SideMenu.jsx     # Menú lateral
│   ├── SettingsModal.jsx# Configuración (colores, nombre)
│   ├── SalesReportModal.jsx # Reporte de ventas
│   └── BackupModal.jsx  # Backup / exportación de datos
├── data/
│   └── products.js      # Productos por defecto (seed data)
├── hooks/
│   └── useLocalStorage.js # Hook genérico localStorage
├── utils/
│   ├── db.js            # Capa IndexedDB (CRUD productos, ventas, tasas)
│   ├── categories.js    # CRUD categorías en IndexedDB
│   ├── format.js        # formatCurrency(), formatQty()
│   └── backupService.js # Export/import de datos
├── features/
│   └── TasaBcv/         # Feature: Histórico de tasas BCV
│       ├── components/TasaBcv.jsx
│       ├── hooks/useTasas.js
│       └── services/tasaService.js
└── index.css / App.css
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

### IndexedDB (`fruteria-db`)
- **products**: Catálogo de productos (CRUD desde gestión)
- **categories**: Categorías con ícono y orden
- **historico_tasas**: Historial de tasas BCV registradas manualmente
- **sales**: Ventas realizadas (para reportes)

### localStorage
- `fruteria-cart`: Items en el carrito actual
- `fruteria-tasa`: Tasa de cambio activa (USD → Bs)
- `fruteria-settings`: Preferencias (companyName, bgColor, textColor)

### Reglas
- No usar PouchDB ni Dexie — solo IndexedDB nativo + localStorage.
- `seedProducts()` y `seedCategories()` solo insertan si no existen.
- En `backupService.js` la versión DB está hardcodeada (DB_VERSION 3) — mantener sincronizada con `db.js` si se agregan stores.

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
3. `npm run deploy` — despliega a GitHub Pages vía gh-pages

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

## 🔐 Seguridad (planeado)

- PIN de administrador con teclado numérico (estilo bloqueo).
- Bloqueo de seguridad tras 3 intentos fallidos (5 min).
- Confirmación obligatoria al cambiar la tasa de cambio.

---

## 🧪 Notas de Desarrollo

- El archivo `brainstorm.md` en `src/features/brainstorm.md` contiene la lluvia de ideas y hoja de ruta de features pendientes.
- Al modificar `db.js` (versión o stores), actualizar también `backupService.js`.
- Los `_headers` en `/public` fuerzan `no-cache` para JS/CSS/HTML — necesario para evitar caché obsoleto del service worker.
