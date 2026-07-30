# 10 — Persistencia y Base de Datos

> **Estado:** 🗄️ Estable (IndexedDB nativo v6)
> **Prioridad:** Alta
> **Depende de:** N/A

---

## 🎯 Objetivo

Definir la arquitectura de almacenamiento de datos: esquema IndexedDB, migraciones, backup, integridad y estrategia offline.

---

## 📐 Stack Actual

| Tecnología | Uso |
|-----------|-----|
| **IndexedDB nativo** | Datos estructurados (productos, ventas, logs, etc.) |
| **localStorage** | Estado transitorio (carrito, tasa activa, settings) |
| **Service Worker** (PWA) | Cache de assets para funcionar offline |

**Regla del proyecto:** No usar PouchDB, Dexie.js, ni librerías externas de BD. Solo IndexedDB nativo + localStorage.

> _Ver [11-pouchdb-sincronizacion.md](11-pouchdb-sincronizacion.md) para el debate sobre si adoptar PouchDB/Dexie.js_

---

## 🗄️ IndexedDB — `fruteria-db`

### Versión actual: **6**

### Stores

| Store | Key | Propósito | Registros típicos |
|-------|-----|-----------|-------------------|
| `products` | `id` (auto) | Catálogo de productos | 50–500 |
| `categories` | `id` (manual) | Categorías con ícono y orden | 5–30 |
| `historico_tasas` | `id` (auto) | Historial de tasas BCV registradas | 10–500 |
| `sales` | `id` (auto) | Ventas realizadas (para reportes) | 100–10,000 |
| `ramos` | `id` (manual) | Ramos comerciales | 1–10 |
| `logs` | `id` (auto) | Eventos del sistema (INFO a FATAL) | 100–5,000 |

### Historial de Migraciones

| Versión | Cambios |
|---------|---------|
| v1 | Store `products` inicial |
| v2 | Store `categories` |
| v3 | Store `historico_tasas` |
| v4 | Store `sales` |
| v5 | Store `ramos` |
| v6 | Store `logs` |

### Reglas de Migración

- `onupgradeneeded` es **aditivo**: solo se crean stores nuevos, no se modifican existentes
- `seedProducts()` y `seedCategories()` solo insertan si no existen (por nombre)
- DB_VERSION en `src/utils/db.js` y `src/utils/backupService.js` deben estar sincronizadas
- El backup exporta TODAS las stores, sin excepción

---

## 💾 localStorage

| Key | Contenido | Tamaño típico |
|-----|-----------|---------------|
| `fruteria-cart` | Items en el carrito actual | 1–10 KB |
| `fruteria-tasa` | Tasa de cambio activa (número) | < 1 KB |
| `fruteria-settings` | Preferencias (companyName, bgColor, textColor, ramoId, pin hash) | < 2 KB |
| `fruteria-alert-read-at` | Timestamp ISO de última lectura de alertas | < 1 KB |

### ¿Por qué localStorage para estas?

- **Rapidez**: acceso síncrono, no requiere await
- **Simplicidad**: datos pequeños que cambian frecuentemente (carrito)
- **Persistencia**: sobrevive a cierre del navegador
- **Separación de concerns**: datos de sesión vs datos permanentes

---

## 🔄 Backup / Restore

**Implementado en:** `src/utils/backupService.js`

### Funcionalidades actuales
- Exportar todas las stores a un archivo JSON descargable
- Importar desde archivo JSON (restaura todas las stores)
- Validación básica de estructura

### Mejoras propuestas
- [ ] Backup automático periódico (cada 24h o al cerrar sesión)
- [ ] Backup antes de operaciones destructivas (cambio de ramo)
- [ ] Cifrado del archivo de backup (opcional)
- [ ] Compresión de datos (archivos grandes con muchas ventas)
- [ ] Indicador visual de último backup

---

## ⚠️ Problemas Conocidos

| Problema | Impacto | Solución propuesta |
|----------|---------|-------------------|
| IndexedDB puede corromperse si el navegador se cierra durante una escritura | Pérdida de datos | Validar integridad al iniciar, backup automático |
| Límite de almacenamiento (variable según navegador) | No poder guardar más ventas | Alertar cuando se alcance el 80% del límite estimado |
| Consultas lentas con >10,000 registros en `sales` | Tiempo de carga de reportes | Indexar por `timestamp`, paginación en consultas |
| localStorage limitado a ~5 MB | Corrupción si se excede | Migrar a IndexedDB si el carrito crece mucho |

---

## 📊 Estrategia de Consultas

### Productos
```javascript
// Búsqueda por nombre (case-insensitive)
function searchProducts(term) { /* .filter() en memoria */ }
```

### Ventas
```javascript
// Por rango de fechas
function getSalesByDateRange(start, end) { /* .filter() + .sort() */ }
```

### Logs
```javascript
// Por tipo + orden descendente
function getLogs({ type, limit }) { /* .filter() + .sort() + .slice() */ }
```

> Todas las consultas actuales cargan todo el store en memoria y filtran. Con >10,000 registros puede ser lento. Futuro: implementar cursores IDBKeyRange.

---

## 🧪 Rendimiento

### Métricas estimadas

| Operación | Tiempo (100 reg) | Tiempo (10,000 reg) |
|-----------|-----------------|--------------------|
| Cargar productos | < 10ms | ~30ms |
| Buscar producto por nombre | < 5ms | ~50ms |
| Cargar ventas (todas) | < 20ms | ~200ms |
| Backup completo | < 50ms | ~500ms |
| Importar backup | < 100ms | ~1s |

---

## Relacionado

- Ver [11-pouchdb-sincronizacion.md](11-pouchdb-sincronizacion.md) — debate sobre PouchDB + Dexie.js
- Ver [12-arquitectura-sistema.md](12-arquitectura-sistema.md) — offline-first y PWA
- Ver [18-rendimiento-optimizacion.md](18-rendimiento-optimizacion.md) — optimización de consultas

---

## Archivos Relacionados

- `src/utils/db.js` — conexión y CRUD principal
- `src/utils/backupService.js` — export/import
- `src/utils/categories.js` — CRUD categorías
- `src/utils/ramos.js` — CRUD ramos
- `src/utils/logService.js` — sistema de logs
- `src/hooks/useLocalStorage.js` — hook para localStorage
