# Changelog

> Historial de versiones del producto.
> 🚧 Pendiente de completar al finalizar la fase de brainstorming.

---

## [Unreleased]

### Añadido
- **Método de valoración de inventario configurable** 📊🎛️
  - Nueva card dedicada **GESTIÓN DE INVENTARIO** en Configuración → Método de valoración.
  - 3 métodos seleccionables: **Promedio Ponderado** (default, NIIF), **Último costo**, **El más alto (último vs promedio)**.
  - Constantes y helper en [src/utils/inventory.js](src/utils/inventory.js): `VALUATION_METHODS`, `VALUATION_LABELS`, `getValuationMethod()`, `calcularCostoEntrada()`.
  - Persistencia en `fruteria-settings.valuationMethod` (localStorage).
  - Trazabilidad contable: al cambiar el método se registra log `WARNING` con método anterior/nuevo (principio de uniformidad).
  - El cambio aplica únicamente a nuevas entradas con costo; el histórico no se recalcula.
  - Leyenda destacada recordando la buena práctica de mantener el método durante todo el ejercicio.
- **Badge de stock en el Header** 📊⚠️
  - Resumen visible siempre que haya al menos un producto en `Agotado` (⛔ rojo) o con `Stock bajo` (⚠️ ámbar).
  - Click → abre el módulo de Inventario (con PIN si la sesión está bloqueada).
  - Se recalcula al iniciar la app, al asignar ramo, al cobrar (descuento automático) y al cerrar el modal de Inventario.
  - Nuevo módulo [src/utils/stockAlerts.js](src/utils/stockAlerts.js) con `computeStockAlerts(products, ramoId)` y `clasificarStock(product)`.
  - Los productos `Sin definir` (`stock === null`, legados) **no** disparan alerta — deben registrar su primera entrada desde Inventario.
- **Inventario integrado con persistencia** 📊
  - Nueva store `stock_movements` en IndexedDB (DB v7).
  - Nuevos campos por producto: `stock`, `stockMin`, `costoPromedio` (null en productos legados → estado "Sin definir").
  - Tipos de movimiento: `entrada`, `merma`, `ajuste`, `venta`. Todos atómicos (misma transacción `products` + `stock_movements`).
  - Costo promedio ponderado al registrar entradas con costo total.
  - Filtro nuevo "Sin definir" para localizar productos sin stock.
  - Edición inline del stock mínimo por producto.
  - Descuento automático de stock al confirmar una venta (en `App.completePayment`).
  - Si falta stock al cobrar, descuenta hasta 0 y registra log `WARNING` con el faltante.
  - Nuevo módulo [src/utils/inventory.js](src/utils/inventory.js) con API: `registrarMovimiento`, `descontarStockVenta`, `getMovimientosByProduct`, `getMovimientosRecientes`, `setStockMinimo`.
- Reporte **Productos Más Vendidos** 🏆 con ranking por cantidad vendida.
  - Filtros rápidos: Hoy, Semana, Mes (y selector manual de rango).
  - Tarjeta destacada del producto estrella (🥇) y podio 🥇🥈🥉.
  - Tarjetas de resumen: productos, unidades, ingresos USD.
  - Exportar PDF (Ver / Compartir / Descargar).

## [1.0.0] — 2026-07-30 🚀

### Añadido
- Lanzamiento inicial del producto.
- Sistema POS táctil offline-first.
- Gestión de productos, categorías y ramos comerciales.
- Pagos mixtos multimoneda (USD + Bs).
- PIN de administrador con hasheo SHA-256.
- Sistema de logs con visor y alertas.
- Backup y restauración de datos.
- Instalable como PWA.

### Technical
- Stack: React 18 + Vite 5 + IndexedDB nativo.
- Hosting: Vercel (auto-deploy desde GitHub).
