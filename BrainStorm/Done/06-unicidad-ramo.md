# 06 — Unicidad de Ramo

> **Estado:** ✅ Implementado (selección única al instalar)
> **Prioridad:** Media

---

## 🎯 Objetivo

Garantizar que una instalación de la app quede asignada a **un solo ramo comercial**, elegido una sola vez al instalar, sin posibilidad de cambio posterior.

---

## Decisión Final de Negocio

```
Al instalar la app el usuario selecciona de una lista predefinida
el ramo al que pertenece la empresa (una sola vez).

El cambio de ramo no debe estar al alcance del admin:
se selecciona al instalar únicamente.

Los ramos están preestablecidos (catálogo fijo en el código).
Cuando la empresa selecciona un ramo, queda asignada a ese ramo.
```

---

## Implementación

### Catálogo predefinido (`src/data/ramos.js`)
- Lista fija de ramos: Frutería, Carnicería, Charcutería, Panadería, Bodega/Abarrotes, Licorería.
- Cada ramo define sus **categorías** iniciales (y productos solo Frutería; el resto inicia vacío).
- `getRamoPorId(id)` para resolver nombre/icono desde cualquier componente.

### Asistente de instalación (`src/components/RamoSetup.jsx`)
- Se muestra cuando `settings.ramoId` está vacío (primer arranque).
- Lista los ramos del catálogo → el usuario elige uno → se guarda en `fruteria-settings` → se siembran categorías/productos del ramo → log `INFO "Ramo comercial asignado"`.
- **No se muestra nunca más** (a menos que se borren los datos de la app).

### Sin selector de ramo en el uso diario
- `SideMenu`: se eliminó la pantalla "Ramos Comerciales" (CRUD).
- `Categories.jsx` y `Products.jsx`: trabajan siempre con el ramo asignado (`ramoId` prop), sin dropdown de ramo.
- `RamosComerciales.jsx`: **se conserva en el repo** sin uso (decisión del dueño, puede retomarse).

### Seeding por ramo (`App.jsx`)
- `loadProducts()` / `loadCategories()` siembran según el ramo activo.
- Instalaciones existentes: mantienen su ramo actual sin pasar por el asistente.

---

## Archivos Relacionados

- `src/data/ramos.js` (catálogo + `getRamoPorId`)
- `src/components/RamoSetup.jsx` + `RamoSetup.css`
- `src/components/Categories.jsx`, `src/components/Products.jsx`
- `src/components/RamosComerciales.jsx` (sin uso, conservado)
- `src/App.jsx` (orquestación del asistente y seeding)
- Ver [21-sidemenu-navegacion.md](21-sidemenu-navegacion.md) — estructura del menú
