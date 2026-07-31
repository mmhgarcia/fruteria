# 19 — Módulo de Inventario

> **Estado:** 🔍 En análisis
> **Prioridad:** Alta
> **Depende de:** 08, 05, 10

---

## 🎯 Objetivo

Agregar control de stock (cantidad disponible) a los productos, permitir registrar entradas de mercancía, ajustes manuales y descontar inventario automáticamente al vender. El módulo debe alertar sobre productos bajos o agotados.

---

## Contexto Actual

- Los productos no tienen campo de stock (`src/data/products.js` solo tiene name, icon, group, um, price, ramo)
- La venta registra ítems en el store `sales` (IndexedDB) sin afectar inventario
- La validación de decimales/ceros está pendiente (ver [09-administracion-analitica.md](09-administracion-analitica.md)): ítems con 0 unidades pero con ingresos — **el inventario depende de resolver esto**
- El store `products` en IndexedDB (`fruteria-db` v6) almacena los productos actuales

---

## Alcance Propuesto

### Fase 1 — Stock básico

- Campo `stock` en cada producto (cantidad decimal, según `um`)
- Pantalla de inventario en Configuración: tabla con producto, um, stock actual, estado
- Ajuste manual de stock (entradas de mercancía, mermas)
- Descuento automático de stock al completar una venta
- Restauración de stock al eliminar una venta

### Fase 2 — Control de nivel

- Umbral mínimo por producto → alerta de "stock bajo"
- Badge visible en la cuadrícula de productos del POS
- Historial de movimientos: fecha, tipo (entrada/salida/ajuste), cantidad, motivo, usuario
- Reporte de inventario (integrable con [09-administracion-analitica.md](09-administracion-analitica.md))

### Fase 3 — Decisiones comerciales (por evaluar)

- ¿Permitir vender sin stock (venta rápida frutería) o bloquear el botón?
- ¿Unidades de inventario por kg, unidad o ambos?
- ¿Ajuste automático por merma diaria (frutas/verduras perecederas)?

---

## Diseño Técnico Propuesto

### Estructura del producto extendido

```javascript
{
  id: 1,
  name: 'Lechuga',
  icon: '🥬',
  group: 'verduras',
  um: 'unidad',
  price: 0.80,
  ramo: 'fruteria',
  stock: 0,          // nuevo: cantidad disponible
  stockMin: 0,       // nuevo: umbral de alerta
  stockBajo: false,  // nuevo: flag calculado o derivado
}
```

### Store de movimientos (IndexedDB)

```javascript
// Store: inventory_movements (nuevo en db.js)
{
  id: autoIncrement,
  productId: 1,
  tipo: 'entrada' | 'salida' | 'ajuste' | 'venta',
  cantidad: 5.5,
  motivo: 'Compra al mayorista' | 'Venta #123' | 'Merma',
  timestamp: '2026-07-31T10:00:00.000Z',
}
```

### Flujo de descuento en venta

```mermaid
flowchart TD
    A[Venta completada] --> B[Recorrer items del carrito]
    B --> C[Actualizar stock del producto]
    C --> D{¿stock < stockMin?}
    D -->|Sí| E[Marcar stockBajo + log WARNING]
    D -->|No| F[Continuar]
    E --> F
    F --> G[Registrar movimiento tipo venta]
```

### Restauración al eliminar venta

- Al eliminar una venta desde el histórico → sumar de vuelta el stock
- Registrar movimiento tipo `ajuste` con motivo "Anulación de venta #id"

---

## Interfaz Propuesta

```
┌──────────────────────────────────────────────────────────┐
│  📦 Inventario                            [✕] Cerrar     │
├──────────────────────────────────────────────────────────┤
│  [Buscar producto...]        [Filtro: Todo|Bajo|Agotado] │
│                                                          │
│  Producto        │ U/M     │ Stock   │ Estado            │
│  ────────────────┼─────────┼─────────┼─────────────────  │
│  Lechuga    🥬   │ unidad  │  45     │ ✅ OK             │
│  Tomate     🍅   │ kg      │  3,5    │ ⚠️ Stock bajo      │
│  Aguacate   🥑   │ kg      │  0      │ ❌ Agotado         │
│                                                          │
│  [＋ Entrada de mercancía]  [✎ Ajustar stock]            │
├──────────────────────────────────────────────────────────┤
│  📜 Historial de movimientos (fecha, tipo, cantidad)     │
└──────────────────────────────────────────────────────────┘
```

---

## Preguntas Abiertas

- [ ] ¿El stock aplica por ramo comercial o es global?
- [ ] ¿Es necesaria la merma automática para perecederos?
- [ ] ¿Se integra con el resumen de ventas (productos vendidos vs stock restante)?
- [ ] ¿El botón de venta debe deshabilitarse si `stock === 0`?

---

## Relacionado

- Ver [08-gestion-productos-categorias.md](Done/08-gestion-productos-categorias.md) — producto sin stock hoy (pendiente)
- Ver [05-historico-ventas.md](05-historico-ventas.md) — anulación de ventas (restaura stock)
- Ver [09-administracion-analitica.md](09-administracion-analitica.md) — validación de decimales/ceros
- Ver [10-persistencia-bases-datos.md](10-persistencia-bases-datos.md) — esquema IndexedDB

---

## Archivos Relacionados

- `src/data/products.js` (datos semilla)
- `src/utils/db.js` (stores `products`, `sales`; se agregaría `inventory_movements`)
- `src/components/Products.jsx` (gestión de productos)
- `src/components/Inventory.jsx` + CSS (nuevo)
- `src/App.jsx` (flujo de venta)
