# 18 — Rendimiento y Optimización

> **Estado:** ⚡ Pendiente
> **Prioridad:** Media
> **Depende de:** 10, 12

---

## 🎯 Objetivo

Identificar cuellos de botella y optimizar el rendimiento de la app: tiempo de carga, tamaño del bundle, consultas a IndexedDB, memoria y experiencia PWA.

---

## 📊 Estado Actual

| Métrica | Valor actual | Objetivo |
|---------|-------------|----------|
| Tamaño bundle JS | ~150 KB (minificado) | < 100 KB |
| Tiempo primera carga | ~2-3s (con service worker) | < 1.5s |
| Tiempo carga recurrente | Instantáneo (SW cache) | Instantáneo |
| Carga de productos | < 10ms (100 reg) | < 5ms |
| Carga de ventas | ~200ms (10,000 reg) | < 100ms |
| Búsqueda de producto | < 5ms (100 reg) | < 2ms |

---

## 🎯 Áreas de Optimización

### 1. Bundle Size

**Problema:** React + Vite genera bundles que incluyen código no usado.

**Soluciones:**
- [ ] **Code splitting**: separar SettingsModal y modales de admin en chunks dinámicos
  ```javascript
  const SettingsModal = React.lazy(() => import('./components/SettingsModal'))
  ```
- [ ] **Tree shaking**: revisar imports no usados
- [ ] **Compresión**: Vite ya minifica con esbuild (rápido, buena compresión)
- [ ] **Analizar bundle**: `npx vite-bundle-analyzer` para identificar módulos grandes

### 2. Consultas a IndexedDB

**Problema:** Las consultas cargan TODO el store en memoria y filtran con `.filter()`.

**Soluciones:**
- [ ] **Cursores IDBKeyRange** para ventas por fecha:
  ```javascript
  function getSalesByDateRange(start, end) {
    const range = IDBKeyRange.bound(start, end)
    const tx = db.transaction('sales', 'readonly')
    const index = tx.objectStore('sales').index('timestamp')
    return index.getAll(range)  // Solo los registros en el rango
  }
  ```
- [ ] **Indexar campos**: agregar índice `timestamp` al store `sales`
- [ ] **Paginación**: en lugar de cargar todas las ventas, cargar de 50 en 50
- [ ] **Cache en memoria**: para datos que cambian poco (productos, categorías)

### 3. Renderizado de React

**Problema:** Toda la app en un solo estado global en `App.jsx`. Cualquier cambio re-renderiza muchos componentes.

**Soluciones:**
- [ ] **React.memo** en componentes que no cambian seguido (ProductCard, filas de ticket)
- [ ] **useMemo** para cálculos costosos (totales del carrito, filtros de productos)
- [ ] **useCallback** para funciones que se pasan como props
- [ ] **Separar estado**: mover lógica de modales a sus propios estados locales

### 4. Service Worker y PWA

**Problema:** El service worker actual cachea todos los assets, pero no hay estrategia de caché para datos.

**Soluciones:**
- [ ] **Precaching de datos estáticos** (productos por defecto)
- [ ] **Stale-while-revalidate** para assets JS/CSS
- [ ] **Limpieza de caché** de service workers antiguos

### 5. Memoria

**Problema:** IndexedDB retiene datos en memoria si no se cierran transacciones.

**Soluciones:**
- [ ] Cerrar transacciones explícitamente (`tx.commit`)
- [ ] Limitar logs en memoria (solo mostrar últimos 50, cargar más bajo demanda)
- [ ] Limpiar carritos abandonados (más de 24h sin actividad)

---

## 📈 Plan de Optimización

### Prioridad Alta (impacto inmediato)
| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 1 | Agregar `React.lazy` a SettingsModal y otros modales | 1h | Medio |
| 2 | `React.memo` en ProductCard | 30min | Medio |
| 3 | `useMemo` para totales del carrito | 15min | Alto |
| 4 | Cachear productos en memoria (evitar leer de DB en cada render) | 1h | Alto |

### Prioridad Media
| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 5 | Indexar `sales.timestamp` en IndexedDB | 2h | Alto |
| 6 | Paginación en consulta de ventas | 3h | Alto |
| 7 | Analizar bundle con `vite-bundle-analyzer` | 30min | Medio |

### Prioridad Baja
| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 8 | Limpieza automática de carritos abandonados | 2h | Bajo |
| 9 | Transacciones commit explícitas | 1h | Bajo |
| 10 | Estrategia de caché avanzada en SW | 4h | Bajo |

---

## 🛠️ Herramientas

| Herramienta | Propósito |
|-------------|-----------|
| React DevTools Profiler | Identificar re-renders innecesarios |
| Lighthouse (PWA) | Performance, accesibilidad, best practices |
| Chrome DevTools → Performance | Grabación de interacciones reales |
| `vite-bundle-analyzer` | Visualizar tamaño del bundle |
| Chrome DevTools → Application → IndexedDB | Inspeccionar datos y consultas |

---

## Archivos Relacionados

- `BrainStorm/10-persistencia-bases-datos.md` — optimización de consultas
- `BrainStorm/12-arquitectura-sistema.md` — PWA y service worker
- `src/App.jsx` — estado global (candidato a optimización)
- `src/components/ProductCard.jsx` — candidato a memo
