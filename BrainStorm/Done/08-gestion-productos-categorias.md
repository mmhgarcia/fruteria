# 08 — Gestión de Productos y Categorías

> **Estado:** ✅ Completado
> **Prioridad:** Alta
> **Depende de:** N/A

---

## 🎯 Objetivo

CRUD completo de productos y categorías, organizados por ramo comercial, con interfaz táctil y búsqueda.

---

## Implementado

### ~~Ramos Comerciales~~
- CRUD completo: nombre, identificador, flag activo/inactivo
- Check "Asignar a Empresa" alineado a la izquierda
- Componente: `RamosComerciales.jsx`

### ~~Categorías jerárquicas por Ramo~~
- Las categorías pertenecen a un ramo
- Dropdown selector en gestión de categorías
- Ordenamiento por drag & drop (▲/▼) implementado

### ~~Productos con campo Ramo~~
- Cada producto pertenece a un ramo
- Dropdown RamoSelector reutilizable en gestión
- Datos: nombre, precio USD, unidad medida (kg/unidad), categoría, ramo, ícono

### ~~RamoSelector~~
- Componente único y reutilizable para seleccionar ramos en toda la app
- Props: `value`, `onChange`, `placeholder`, `disabled`

### ~~Barra de Búsqueda~~
- Buscador en "Gestión de Productos" para filtrar por nombre
- Útil cuando la lista supera los 100 ítems
- Filtro en tiempo real mientras se escribe

---

## Pendiente / Ideas

### Expansión de Iconografía
- Agregar íconos/emojis para carnicería: 🥩, 🍗, 🐟, 🥓
- Agregar íconos para lácteos/quesos: 🧀
- Permitir mudar el POS al ramo de carnicería y charcutería

### Icono Comodín
- Configurar 📦 (caja de cartón) como ícono por defecto
- Si el usuario no selecciona ícono al crear un producto → asignar 📦

### Mejoras futuras
- [ ] Importar productos desde CSV
- [ ] Exportar catálogo a CSV
- [ ] Precios por volumen (ej: descuento por mayoreo)
- [ ] Múltiples precios (por unidad, por kg, por presentación)
- [ ] Código de barras (lectura con cámara)
- [ ] Stock/inventario (cantidad disponible)

---

## Archivos Relacionados

- `src/components/Products.jsx` + `Products.css`
- `src/components/Categories.jsx`
- `src/components/RamosComerciales.jsx`
- `src/components/RamoSelector.jsx`
- `src/utils/db.js` (stores `products`, `categories`)
- `src/utils/ramos.js`
- `src/utils/categories.js`
