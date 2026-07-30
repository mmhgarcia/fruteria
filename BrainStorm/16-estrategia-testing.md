# 16 — Estrategia de Testing

> **Estado:** 📋 Pendiente
> **Prioridad:** Media
> **Depende de:** N/A

---

## 🎯 Objetivo

Definir una estrategia de pruebas para garantizar la calidad del POS, incluyendo checklist de pruebas manuales y escenarios críticos.

---

## 📋 Checklist de Pruebas Manuales

### Flujo Principal (Regresión)

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 1 | Abrir la app | Se carga sin errores, productos visibles |
| 2 | Buscar producto | Filtra correctamente por nombre |
| 3 | Filtrar por categoría | Muestra solo productos de esa categoría |
| 4 | Agregar producto (kg) | WeightModal con decimales, teclado completo |
| 5 | Agregar producto (unidad) | WeightModal sin punto decimal, solo enteros |
| 6 | Escribir `.350` en kg | Autocompleta a `0.350` |
| 7 | Ver subtotal en tiempo real | Muestra cálculo correcto abajo del input |
| 8 | Agregar al carrito | Producto aparece en ticket lateral |
| 9 | Editar cantidad desde carrito | Reabre WeightModal con valor actual |
| 10 | Eliminar del carrito | Producto se quita, total se actualiza |
| 11 | Abrir carrito modal | Lista completa de productos, totales correctos |
| 12 | Ir a pagar | PaymentModal se abre con total correcto |
| 13 | Pago mixto (Pago Móvil + Efectivo) | Suma parcial, saldo se actualiza, vuelto calculado |
| 14 | Completar pago | TicketPreview se abre, datos correctos |
| 15 | Imprimir ticket | Se abre ventana de impresión |
| 16 | Confirmar pago | Carrito se limpia, venta guardada en IndexedDB |

### Configuración

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 17 | Abrir configuración (sin PIN) | Entra directo |
| 18 | Abrir configuración (con PIN) | PinPrompt se muestra |
| 19 | PIN correcto | Entra a configuración |
| 20 | PIN incorrecto 1 vez | Muestra error, permite reintentar |
| 21 | PIN incorrecto 3 veces | Log ALERT, se registra en logs |
| 22 | Cambiar nombre empresa | Se actualiza en header y tickets |
| 23 | Cambiar colores (bg + texto) | Se aplican inmediatamente |
| 24 | Cambiar tasa BCV | Confirmación, se actualiza en header |
| 25 | CRUD ramo | Crear, editar, desactivar ramo |
| 26 | CRUD categoría | Crear, editar, reordenar, eliminar |
| 27 | CRUD producto | Crear, editar, eliminar producto |
| 28 | Backup exportar | Descarga archivo JSON con todos los datos |
| 29 | Backup importar | Restaura todos los datos correctamente |
| 30 | Ver logs del sistema | Lista con filtros, búsqueda, colores |

### Seguridad

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 31 | PIN incorrecto ×3 seguidos | Log ALERT creado, badge rojo aparece |
| 32 | Marcar alertas como leídas | Badge desaparece |
| 33 | PIN en texto plano legacy | Compatibilidad: funciona igual que hash |
| 34 | Recargar app | PIN persiste, carrito persiste, tasa persiste |

### Offline

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 35 | Desconectar internet | App sigue funcionando normalmente |
| 36 | Instalar como PWA | Aparece prompt de instalación |
| 37 | Abrir desde home screen | Se ve como app nativa, sin URL bar |
| 38 | Recargar sin internet | Assets cargan desde service worker |

---

## 🧪 Escenarios Críticos

### Escenario 1: Corte de luz durante un cobro
1. Cajero está en PaymentModal, ingresa montos
2. Se va la luz (el teléfono sigue funcionando con batería)
3. App debe: mantener el estado del carrito, no perder datos
4. Al restablecer: el cajero puede continuar donde lo dejó

**Verificar:** `fruteria-cart` en localStorage después del corte simulado (cerrar y recargar).

### Escenario 2: Cierre inesperado del navegador
1. Carrito con 5 productos
2. Navegador se cierra (crash, out of memory, etc.)
3. Al abrir de nuevo: carrito debe estar intacto

**Verificar:** `fruteria-cart` persiste en localStorage.

### Escenario 3: Corrupción de IndexedDB
1. Simular corrupción (borrar IndexedDB manualmente desde DevTools)
2. App debe: detectar que no hay datos, ejecutar seed, mostrar mensaje informativo
3. No debe: crashear, mostrar pantalla en blanco, perder configuración

### Escenario 4: Cambio de ramo
1. Configurar ramo "Frutas" con productos y ventas
2. Cambiar a "Carnicería"
3. Debe: advertir, limpiar datos, sembrar datos de carnicería
4. Ventas anteriores: eliminadas (según diseño)
5. Backup: sugerido antes del cambio

---

## Automatización (Futuro)

Si se desea automatizar pruebas en el futuro:

| Tipo | Herramienta | Propósito |
|------|-----------|-----------|
| Unit tests | Vitest (nativo Vite) | Probar utils: format.js, hash.js, db.js |
| Component tests | React Testing Library | Probar componentes aislados |
| E2E | Playwright | Flujo completo de cobro |
| PWA | Lighthouse | Validar manifest, service worker, offline |

---

## Archivos Relacionados

- `BrainStorm/10-persistencia-bases-datos.md` — integridad de datos
- `BrainStorm/07-seguridad-control-acceso.md` — pruebas de seguridad
- `BrainStorm/03-flujo-cobranza.md` — escenarios de cobro
