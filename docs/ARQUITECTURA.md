# ARQUITECTURA — Frutería POS

> **Guía rápida de referencia** para localizar el componente o módulo funcional que atiende cada necesidad del sistema.
> Si vas a pedir un cambio, busca primero aquí el archivo responsable.

---

## 🧱 Visión General

- **Tipo:** PWA offline-first empaquetada con **Capacitor** (Android/iOS).
- **UI:** React 18 + Vite 5 + JSX.
- **Persistencia:** **IndexedDB nativo** (DB `fruteria-db` v7) + **localStorage** para estado efímero.
- **Backend:** Ninguno. Todo el procesamiento es client-side.
- **Dashboard:** Resumen del día al iniciar la app (configurable), con KPIs, alertas de stock, valor de inventario y top productos.
- **Reportes:** Exportación PDF con `jsPDF` + `jspdf-autotable`.
- **Estructura por capas:** `components/` (UI) → `utils/`/`data/` (datos y servicios) → `features/` (módulos autocontenidos).

---

## 📂 Índice de Archivos por Función

### 🎬 Punto de entrada y raíz

| Archivo | Función |
|---------|---------|
| [src/main.jsx](../src/main.jsx) | Entry point de React. Renderiza `<App />` en `#root`. |
| [src/App.jsx](../src/App.jsx) | **Orquestador principal.** Estado global, modales, carga inicial, handlers de carrito y cobros. Une todas las piezas. |
| [src/App.css](../src/App.css) | Estilos raíz y layout principal. |
| [src/index.css](../src/index.css) | Reset y variables CSS globales. |

---

### 🧩 Componentes de UI (`src/components/`)

#### Pantalla principal (flujo de venta)

| Componente | Función |
|------------|---------|
| [Header.jsx](../src/components/Header.jsx) | Encabezado con menú, tasa BCV activa, badge de stock (productos agotados / con stock bajo), badge de alertas (logs `ALERT` no leídos) y contador del carrito. |
| [ProductGrid.jsx](../src/components/ProductGrid.jsx) | Cuadrícula filtrable de productos por categoría y búsqueda. |
| [ProductCard.jsx](../src/components/ProductCard.jsx) | Tarjeta individual de producto. Al tocar → abre `WeightModal` o agrega directo si es `unidad`. |
| [CartModal.jsx](../src/components/CartModal.jsx) | Vista expandida del carrito lateral (modo pantalla completa para táctil). |
| [Ticket.jsx](../src/components/Ticket.jsx) | Carrito lateral compacto. Lista items, subtotal, botones «Vaciar» y «Cobrar». |
| [TicketPreview.jsx](../src/components/TicketPreview.jsx) | Vista previa imprimible del ticket tras cobrar (encabezado empresa, items, totales). |
| [WeightModal.jsx](../src/components/WeightModal.jsx) | Teclado numérico contextual: decimales si `um='kg'`, enteros si `um='unidad'`. Muestra subtotal en vivo. |
| [PaymentModal.jsx](../src/components/PaymentModal.jsx) | Modal de cobro. Soporta **pagos mixtos** (Pago Móvil, Efectivo, Divisa, Punto), IGTF opcional, vuelto. |

#### Navegación y configuración

| Componente | Función |
|------------|---------|
| [SideMenu.jsx](../src/components/SideMenu.jsx) | Menú lateral de navegación: Dashboard, productos, Inventory, Reportes del Sistema (acordeón), Tasa BCV, Configuración y Visor de Logs. |
| [SettingsModal.jsx](../src/components/SettingsModal.jsx) | Configuración centralizada: empresa, PIN, tasa, ramos, categorías, productos, reportes, backup, logs, colores. |
| [RamoSetup.jsx](../src/components/RamoSetup.jsx) | Wizard inicial para asignar el **ramo comercial** cuando la app arranca por primera vez. |
| [RamoSelector.jsx](../src/components/RamoSelector.jsx) | Dropdown reutilizable de selección de ramo. |
| [PinPrompt.jsx](../src/components/PinPrompt.jsx) | Teclado numérico de PIN. 3 intentos fallidos → genera log `ALERT`. |

#### Administración

| Componente | Función |
|------------|---------|
| [RamosComerciales.jsx](../src/components/RamosComerciales.jsx) | CRUD de ramos comerciales. Checkbox «Asignar a Empresa». |
| [Categories.jsx](../src/components/Categories.jsx) | CRUD de categorías filtradas por ramo. |
| [Products.jsx](../src/components/Products.jsx) | CRUD de productos (con campo `ramoId`, `um`, precio USD). |
| [Inventory.jsx](../src/components/Inventory.jsx) | Gestión de inventario (entradas, mermas, ajustes, stock mínimo, historial). Lee y persiste en IndexedDB. |
| [StockAlertModal.jsx](../src/components/StockAlertModal.jsx) | Modal de resumen de stock al tocar el badge del Header: agotados, stock bajo y sin definir. Botón «Ir a Inventario». |
| [InventoryValuationModal.jsx](../src/components/InventoryValuationModal.jsx) | Inventario Valorizado: valor del inventario según método de valoración, con exportación PDF (ver/compartir/descargar). |

#### Reportes y análisis

| Componente | Función |
|------------|---------|
| [SalesReportModal.jsx](../src/components/SalesReportModal.jsx) | Resumen de ventas por rango de fechas. |
| [BestSellingProductsModal.jsx](../src/components/BestSellingProductsModal.jsx) | Ranking de productos más vendidos. |
| [DailyTicketsModal.jsx](../src/components/DailyTicketsModal.jsx) | Listado de tickets emitidos en el día. |
| [DashboardModal.jsx](../src/components/DashboardModal.jsx) | Dashboard con KPIs del día (ventas USD/Bs, tickets, ticket promedio), pestañas Hoy/Semana/Mes, alertas de stock, valor del inventario y top productos. |
| [BackupModal.jsx](../src/components/BackupModal.jsx) | Exportar/importar backup completo (todas las stores IndexedDB). |
| [LogsViewerModal.jsx](../src/components/LogsViewerModal.jsx) | Visor fullscreen de logs (filtros por tipo, búsqueda, marcar leídas, limpiar). |

---

### ⚙️ Servicios / Utilidades (`src/utils/`)

| Archivo | Función | Stores IndexedDB |
|---------|---------|------------------|
| [db.js](../src/utils/db.js) | CRUD principal IndexedDB. Conexión, `seedProducts`, ventas. | `products`, `sales` |
| [inventory.js](../src/utils/inventory.js) | Movimientos de stock, descuento por venta, historial. Transaccional con `products` y `stock_movements`. | `products`, `stock_movements` |
| [stockAlerts.js](../src/utils/stockAlerts.js) | Cómputo de resumen de stock (agotados, bajos, sin definir) para el badge del Header. | — |
| [dashboard.js](../src/utils/dashboard.js) | `getDashboardData` → KPI del día, alertas de stock, valor de inventario y top productos por ingresos. Reutiliza `stockAlerts.js` y `inventory.js`. | — |
| [dateRange.js](../src/utils/dateRange.js) | `calcularRango` (presets Hoy/Semana/Mes) y `rangoAIntervalo` para reportes. | — |
| [categories.js](../src/utils/categories.js) | CRUD de categorías. `seedCategories`, `getCategoriesByRamo`. | `categories` |
| [ramos.js](../src/utils/ramos.js) | CRUD de ramos comerciales. | `ramos` |
| [backupService.js](../src/utils/backupService.js) | Export/import de **todas** las stores. Sincronizado con `DB_VERSION`. | todas |
| [logService.js](../src/utils/logService.js) | Sistema de logs `INFO`, `WARNING`, `ERROR`, `FATAL`, `ALERT`. | `logs` |
| [format.js](../src/utils/format.js) | `formatCurrency` (Bs/USD, locale Venezuela), `formatQty` (kg/unidad). | — |
| [calcTotals.js](../src/utils/calcTotals.js) | `calcularTotales` → totales del carrito (`totalUSD`, `totalBS`, `count`). Lógica pura, testeable. | — |
| [pagos.js](../src/utils/pagos.js) | Lógica pura de pagos mixtos: `totalPagado`, `calcularSaldo`, `calcularVuelto`, `pagoEsValido`, `redondear2`. | — |
| [hash.js](../src/utils/hash.js) | `hashPin` → SHA-256 (64 chars hex). PIN nunca en texto plano. | — |
| [session.js](../src/utils/session.js) | Sesión con expiración por tiempo (`crearSesion`, `estaDesbloqueado`, `bloquearSesion`). | — |
| [pdfExport.js](../src/utils/pdfExport.js) | Generación de PDFs con `jsPDF` + `jspdf-autotable`. | — |

---

### 📊 Datos estáticos (`src/data/`)

| Archivo | Función |
|---------|---------|
| [data/ramos.js](../src/data/ramos.js) | Catálogo semilla de ramos comerciales predefinidos (referencia, no editables por usuario). |
| [data/products.js](../src/data/products.js) | Catálogo semilla de productos iniciales (se cargan solo si la DB está vacía). |

---

### 🪝 Hooks (`src/hooks/`)

| Archivo | Función |
|---------|---------|
| [useLocalStorage.js](../src/hooks/useLocalStorage.js) | `useState` sincronizado con localStorage. Usado para carrito, tasa, settings. |

---

### 🧬 Features / Módulos (`src/features/`)

#### `TasaBcv/` — Histórico de tasas BCV

| Archivo | Función |
|---------|---------|
| [features/TasaBcv/components/TasaBcv.jsx](../src/features/TasaBcv/components/TasaBcv.jsx) | UI para registrar/modificar/eliminar tasas manualmente. |
| [features/TasaBcv/hooks/useTasas.js](../src/features/TasaBcv/hooks/useTasas.js) | Hook personalizado: estado + acciones sobre tasas. |
| [features/TasaBcv/services/tasaService.js](../src/features/TasaBcv/services/tasaService.js) | CRUD de tasas en IndexedDB. |

---

## 🗄️ Modelo de Datos (IndexedDB `fruteria-db` v7)

| Store | Propósito | CRUD desde |
|-------|-----------|-----------|
| `products` | Catálogo de productos (precio USD, `um`, `ramoId`). | [Products.jsx](../src/components/Products.jsx), [db.js](../src/utils/db.js) |
| `categories` | Categorías con ícono y `ramoId`. | [Categories.jsx](../src/components/Categories.jsx), [categories.js](../src/utils/categories.js) |
| `ramos` | Ramos comerciales. | [RamosComerciales.jsx](../src/components/RamosComerciales.jsx), [ramos.js](../src/utils/ramos.js) |
| `sales` | Ventas realizadas (cabecera + items). | [App.jsx](../src/App.jsx) (al cobrar), [db.js](../src/utils/db.js) |
| `stock_movements` | Historial de movimientos de stock (`entrada`, `merma`, `ajuste`, `venta`). | [Inventory.jsx](../src/components/Inventory.jsx), [App.jsx](../src/App.jsx) (al cobrar), [inventory.js](../src/utils/inventory.js) |
| `historico_tasas` | Historial de tasas BCV registradas. | [TasaBcv.jsx](../src/features/TasaBcv/components/TasaBcv.jsx), [tasaService.js](../src/features/TasaBcv/services/tasaService.js) |
| `logs` | Eventos del sistema (INFO/WARN/ERROR/FATAL/ALERT). | [logService.js](../src/utils/logService.js) |

---

## 💾 localStorage — Estado Efímero

| Clave | Contenido |
|-------|-----------|
| `fruteria-cart` | Items del carrito activo. |
| `fruteria-tasa` | Tasa USD→Bs activa (def. `36.50`). |
| `fruteria-settings` | `companyName`, colores, `ramoId`, `pin` (hash), tiempos de sesión, `valuationMethod`, `mostrarDashboardAlInicio`. |
| `fruteria-alert-read-at` | Timestamp ISO de última lectura de alertas. |
| (sesión) | Timestamp de inicio de sesión para expiración automática. |

---

## 🎯 Guía Rápida: ¿Dónde toco para…?

| Necesidad | Archivo(s) a editar |
|-----------|---------------------|
| Cambiar UI de productos en venta | [ProductGrid.jsx](../src/components/ProductGrid.jsx), [ProductCard.jsx](../src/components/ProductCard.jsx) |
| Cambiar UI del carrito | [Ticket.jsx](../src/components/Ticket.jsx), [CartModal.jsx](../src/components/CartModal.jsx) |
| Modificar flujo de cobro | [PaymentModal.jsx](../src/components/PaymentModal.jsx), [App.jsx](../src/App.jsx) (handler de pago) |
| Cambiar formato de moneda | [format.js](../src/utils/format.js) |
| Agregar/quitar campo de producto | [Products.jsx](../src/components/Products.jsx), [db.js](../src/utils/db.js), [data/products.js](../src/data/products.js) |
| Cambiar tasa activa o histórico | [features/TasaBcv/](../src/features/TasaBcv/), [App.jsx](../src/App.jsx) (loader) |
| Personalizar ticket impresa | [TicketPreview.jsx](../src/components/TicketPreview.jsx) |
| Gestión de PIN / 3 intentos | [PinPrompt.jsx](../src/components/PinPrompt.jsx), [hash.js](../src/utils/hash.js) |
| Inventario (stock, movimientos, descuento por venta) | [Inventory.jsx](../src/components/Inventory.jsx), [inventory.js](../src/utils/inventory.js), [App.jsx](../src/App.jsx) (handler `completePayment`) |
| Método de valoración de inventario (configurable) | [SettingsModal.jsx](../src/components/SettingsModal.jsx) (card GESTIÓN DE INVENTARIO), [inventory.js](../src/utils/inventory.js) (`VALUATION_METHODS`, `getValuationMethod`, `calcularCostoEntrada`) |
| Cambiar o agregar tipo de log | [logService.js](../src/utils/logService.js), [LogsViewerModal.jsx](../src/components/LogsViewerModal.jsx) |
| Backup / restaurar datos | [BackupModal.jsx](../src/components/BackupModal.jsx), [backupService.js](../src/utils/backupService.js) |
| Reportes / PDFs | [SalesReportModal.jsx](../src/components/SalesReportModal.jsx), [pdfExport.js](../src/utils/pdfExport.js) |
| Dashboard del día (KPIs, top, valor inventario) | [DashboardModal.jsx](../src/components/DashboardModal.jsx), [dashboard.js](../src/utils/dashboard.js), [dateRange.js](../src/utils/dateRange.js) |
| Resumen de stock al tocar el badge del Header | [StockAlertModal.jsx](../src/components/StockAlertModal.jsx), [stockAlerts.js](../src/utils/stockAlerts.js) |
| Inventario valorizado (valor del stock) | [InventoryValuationModal.jsx](../src/components/InventoryValuationModal.jsx), [inventory.js](../src/utils/inventory.js) (`getInventoryValuation`) |
| Colores / tema | [App.jsx](../src/App.jsx) (lee `bgColor`/`textColor`), [SettingsModal.jsx](../src/components/SettingsModal.jsx) |
| Versión de DB / nuevas stores | [db.js](../src/utils/db.js) **y** [backupService.js](../src/utils/backupService.js) (ambos) |

---

## ⚠️ Convenciones Críticas

1. **DB_VERSION sincronizada** — Cualquier cambio en `db.js` (versión/stores) requiere actualizar `backupService.js`.
2. **Precios siempre en USD** — La conversión a Bs se hace al cobrar con la tasa activa.
3. **PIN siempre como hash SHA-256** — Nunca persistir en texto plano.
4. **Pagos mixtos soportados** — No eliminar la flexibilidad de Pago Móvil + Efectivo + Divisa + Punto.
5. **Logs `ALERT` se cuentan contra `fruteria-alert-read-at`** — El badge rojo del header no debe duplicar lógica.
6. **Tasa activa en localStorage** — La única fuente de verdad al cobrar (no recalcular desde histórico).
7. **Servidor cero** — Cualquier feature nueva debe ser 100% client-side (offline-first).

---

_Última actualización: ver `CHANGELOG.md` para historial de cambios estructurales._
