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

----------------------------------------------------------------------
                           PARA ANALIZAR
----------------------------------------------------------------------

Una pwa Mobile first, 
Quiero fortalecer y asegurar la persistencia de datos.
Read 15 web pages
Para una PWA mobile-first, fortalecer y asegurar la persistencia de datos significa construir una base que sea offline-first, confiable y privada. La estrategia se centra en elegir el almacenamiento adecuado y añadir capas de seguridad.

Aquí tienes una guía práctica para lograrlo.

1. Motor de Persistencia: IndexedDB como Estándar
Para una PWA robusta, el almacenamiento principal debe ser IndexedDB. Es la opción para datos estructurados, ya que ofrece mayor capacidad y manejo de transacciones que localStorage .

Puedes empezar con un wrapper moderno para simplificar su uso:

Dexie.js: Muy popular, añade una capa "TypeScript-first" y simplifica las consultas .

idb: Un wrapper ligero que usa Promesas en lugar de callbacks .

2. Blindaje de Datos: Cifrado Local y Persistencia
Aquí es donde se "fortalece" y "asegura" la persistencia.

Cifrado en reposo: Si los datos son sensibles, el cifrado local es clave. IndexedDB no cifra por defecto. Una opción es usar librerías como @mrbelloc/encrypted-pouch que cifra los datos con AES-256-GCM antes de guardarlos en IndexedDB, manteniéndolos seguros tanto en disco como en la nube . Otra alternativa es explorar motores de datos como Dync, que ofrecen soporte nativo para SQLite cifrado cuando la PWA se convierte en una app nativa .

Persistencia garantizada: Por defecto, el navegador puede borrar datos si hay poca memoria. Para evitarlo, solicita almacenamiento persistente con la API Storage Manager:

javascript
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persist();
  console.log(`Almacenamiento persistente concedido: ${isPersisted}`);
}
Los navegadores Chromium suelen conceder este permiso automáticamente si tu PWA está instalada .

3. Sincronización y Experiencia de Usuario
Una PWA segura no solo guarda datos, sino que los gestiona con inteligencia.

Patrón Offline-First: Realiza las operaciones de lectura/escritura directamente sobre IndexedDB para dar una respuesta instantánea (actualizaciones optimistas). La sincronización con el servidor se hace en segundo plano .

Cola de Sincronización: Almacena las operaciones pendientes en una cola dentro de IndexedDB. Cuando el dispositivo recupere la conectividad, la cola se procesa automáticamente .

Resolución de conflictos: Define una estrategia (ej. newer-wins, client-wins). Herramientas como Dync o react-offline-kit ya ofrecen estos mecanismos .

Resumen de Decisiones Técnicas
Aspecto	Recomendación	Beneficio Clave
Almacenamiento	IndexedDB con Dexie.js o idb 	Datos estructurados, asíncrono y de alta capacidad.
Seguridad	Cifrado en reposo con @mrbelloc/encrypted-pouch  o preparar arquitectura para SQLite cifrado .	Protección de datos sensibles en el dispositivo.
Persistencia	Solicitar almacenamiento persistente con navigator.storage.persist() .	Evita que el sistema borre datos críticos.
Sincronización	Cola de sincronización + estrategia de resolución de conflictos .	Experiencia sin fricciones y datos consistentes.
Implementando esta base, tu PWA no solo será rápida y confiable, sino que los datos del usuario estarán fuertemente resguardados.

¿Tienes en mente un tipo específico de datos para tu PWA (notas personales, inventario, tareas)? Con eso podría afinarte más la recomendación.

La info de un pos para móvil 
Read 11 web pages
Para una PWA de POS móvil, "fortalecer y asegurar" la persistencia es proteger el activo más crítico: las transacciones que generan ingresos. La estrategia se fundamenta en un enfoque Offline-First, pero añadiendo capas específicas para la integridad de datos financieros y de inventario.

1. El Motor de Persistencia: IndexedDB como Base (Obligatorio)
Es el estándar de facto para las PWA de POS. Su capacidad para manejar grandes volúmenes de datos (catálogos con hasta 500,000 productos) y operaciones complejas lo convierte en la elección natural .

Herramientas clave: Puedes usar Dexie.js (un wrapper muy popular que simplifica las consultas) o directamente el API de IndexedDB para un control más fino .

2. Capas de Seguridad y Fortalecimiento para Datos Financieros
Aquí es donde se diferencia un POS de una app de notas. La seguridad y la integridad de los datos son primordiales .

Cifrado en reposo (Opcional pero recomendado): Si los datos contienen información sensible de clientes o precios, puedes cifrar localmente con librerías como @mrbelloc/encrypted-pouch (usa AES-256-GCM y WebCrypto API) . O, para una ruta nativa, herramientas como Dync permiten cambiar el adaptador a SQLite cifrado sin modificar el código .

Cola de Sincronización con Idempotencia: Para evitar la pérdida o duplicación de ventas en redes inestables. Cada transacción offline debe guardarse en una cola persistente con una clave de idempotencia (ej. ULID) . Al sincronizar, el servidor usa esa clave para procesar la operación una sola vez . La librería offline-sync-engine está diseñada específicamente para esto .

Resolución de Conflictos (Crítico para Inventario): El clásico problema de "dos vendedores vendiendo el último producto offline". Debes implementar una lógica en el servidor que verifique el stock al sincronizar y reporte conflictos al vendedor .

3. Estrategias Avanzadas para un POS Robusto
Persistencia Garantizada: Solicita almacenamiento persistente con navigator.storage.persist(). En dispositivos móviles, si la PWA está instalada, el navegador suele concederlo automáticamente, reduciendo el riesgo de que el sistema borre los datos por falta de espacio .

Sincronización Híbrida: No todos los datos necesitan sincronizarse en tiempo real. Puedes usar una búsqueda híbrida: primero en caché local para velocidad y luego en la API online para catálogos grandes . La sincronización de ventas puede ser en segundo plano, mientras que la de inventario o configuración puede ser bajo demanda.

Mecanismo de "Catch-up": Si un dispositivo se reconecta después de un tiempo, debe poder "ponerse al día" con los eventos que ocurrieron en el servidor mientras estaba offline. Un log de mutaciones con números de secuencia permite a los clientes pedir solo los cambios nuevos .

Resumen de Decisiones Técnicas para tu POS
Aspecto	Recomendación Clave	Beneficio para el POS
Motor	IndexedDB (Dexie.js) 	Alto rendimiento y capacidad para el catálogo.
Seguridad (Datos)	Cifrado con @mrbelloc/encrypted-pouch o preparar migración a SQLite cifrado con Dync 	Protege datos sensibles de clientes y precios.
Seguridad (Sync)	Clave de idempotencia (ULID) y cola persistente offline-sync-engine 	Evita ventas perdidas o duplicadas.
Integridad	Resolución de conflictos de stock en el servidor 	Evita sobreventas en entornos multi-dispositivo.
¿Estás planteando un POS para un solo local o para múltiples sucursales? Eso afina si necesitas sincronización en tiempo real o por lotes.

Un local 
Para un POS de un solo local, la estrategia se simplifica y fortalece en un punto clave: eliminas la complejidad de la sincronización multi-sucursal y te enfocas en la tolerancia a fallos y la consistencia local.

Aquí tienes la estrategia afinada:

1. El Patrón: "Single-Store Offline-First"
Aquí el servidor remoto actúa como copia de seguridad y dashboard, no como fuente de verdad en tiempo real. La lógica es:

Lectura/Escritura: 100% local contra IndexedDB (respuesta instantánea).

Sincronización: En segundo plano, solo para respaldo y reportes.

Resolución de conflictos: Casi nula, porque solo hay un punto de escritura.

2. Motor de Persistencia (Sigue siendo IndexedDB)
Capa	Herramienta	Función
Base de datos	IndexedDB con Dexie.js	Maneja el catálogo, ventas, clientes y configuraciones.
Cifrado local	@mrbelloc/encrypted-pouch (opcional)	Si manejas datos sensibles del cliente (ej. tarjetas de fidelidad).
Persistencia forzada	navigator.storage.persist()	Evita que el sistema borre datos si el almacenamiento se llena.
3. Fortalecimiento para un Solo Local (Lo Crítico)
Aquí es donde realmente aseguras el POS:

Transacciones ACID en IndexedDB: Dexie.js soporta transacciones atómicas. Úsalo para que una venta (cabecera + líneas + descuento de stock) sea una sola operación que o se completa toda o no se hace nada. Esto evita inventarios inconsistentes.

Doble respaldo local (Snapshot): Guarda un "punto de restauración" diario en un almacén separado dentro de IndexedDB. Si el principal se corrompe (raro pero posible), el POS puede recuperar el último estado estable.

Log de mutaciones secuencial: Lleva un registro de cada operación (venta, devolución, ajuste de stock) con un número de secuencia local. Esto permite:

Reconstruir el estado en caso de fallo.

Reintentar sincronizaciones fallidas sin duplicar.

Sincronización "Push" simple: Al reconectar, envías al servidor un payload con todas las ventas del día en una sola petición. El servidor solo las almacena para reportes. No esperas respuesta para confirmar la venta (ya la confirmaste localmente).

4. Experiencia de Usuario (UX) para un POS Local
Feedback inmediato: La venta se confirma en < 100ms (escritura local).

Indicador de sincronización: Un ícono que muestra "Respaldo pendiente" o "Respaldo completado" en la esquina. No bloquees la interfaz por sincronización.

Recuperación automática: Si la escritura local falla por espacio, muestra un mensaje claro y ofrece liberar caché o exportar un respaldo a un archivo JSON (descargable).

5. Esquema de Datos Sugerido (Simplificado)
javascript
// Ejemplo con Dexie.js
const db = new Dexie('POSLocal');
db.version(1).stores({
  products: 'id, name, price, stock',
  sales: '++id, date, total, synced', // synced: 0=pendiente, 1=respaldado
  saleItems: '++id, saleId, productId, quantity, price',
  mutations: '++seq, type, data, timestamp' // Log de todo
});
Resumen: Lo que ganas con un solo local
Aspecto	Estrategia	Beneficio
Consistencia	Transacciones ACID en Dexie.js	Inventario siempre exacto.
Recuperación	Snapshot diario + Log de mutaciones	Puedes retroceder a cualquier punto del día.
Sincronización	Push por lote al final del día o bajo demanda	Simple, sin conflictos.
Seguridad	Cifrado opcional + navegador persistente	Datos seguros y retenidos.
Con este enfoque, tu POS es ultrarrápido, confiable y fácil de mantener. La sincronización se convierte en un "respaldo en la nube" y no en una dependencia crítica.