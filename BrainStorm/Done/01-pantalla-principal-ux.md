# 01 — Pantalla Principal y UX

> **Estado:** ✅ Completado
> **Prioridad:** Alta
> **Depende de:** N/A

---

## 🎯 Objetivo

Diseñar una experiencia de usuario táctil, rápida e intuitiva para el cajero, optimizada para el mercado venezolano (offline-first, pantalla táctil, alta concurrencia).

---

## Implementado

### ~~Header Reorganizado~~
- Diseño en dos filas: superior (marca + tasa) e inferior (buscador + carrito)
- Tasa de cambio visible siempre en el header
- Badge rojo de alertas del sistema junto al carrito
- Botón menú (☰) para acceder a Configuración

### ~~Modales Diferenciados (Peso vs. Unidad)~~
- `WeightModal` separado: si `um === 'kg'` → teclado con decimal y punto
- Si `um === 'unidad'` → solo enteros, sin punto decimal
- Validación visual: botón decimal desactivado/oculto en modo unidad

### ~~Cero Inicial Automático~~
- Si el cajero presiona el punto (.) estando en cero en productos por peso → autocompleta a `0.`
- Agiliza carga de gramos: `.350` → `0.350` kg

### ~~Subtotal en Tiempo Real~~
- Debajo del campo de cantidad se muestra: `3 un × $3,50 = $10,50`
- Se actualiza al instante mientras el usuario escribe

### ~~Límite de 3 Decimales en kg~~
- Teclado numérico limitado a 3 decimales para productos por peso
- Badge, carrito y ticket muestran 3 decimales en kg

---

## Pendiente / Ideas

### Estandarizar modelo de base de datos a usar
> _Ref: ver [10-persistencia-bases-datos.md](10-persistencia-bases-datos.md)_

- Evaluar si conviene migrar a Dexie.js para consultas más ágiles
- Mantener IndexedDB nativo como está, o encapsularlo

### Mejoras UX futuras
- Feedback háptico en botones (vibration API)
- Animaciones de transición entre pantallas
- Modo oscuro (opcional)
- Soporte para gestos (swipe para eliminar del carrito)

---

## 📐 Reglas de UI/UX

| Regla | Detalle |
|-------|---------|
| Táctil | Botones ≥ 44px, espaciado amplio |
| Tipografía | Courier/monospace para tickets y montos |
| Sin scroll horizontal | Todo debe caber en el viewport |
| Colores | Configurables desde Settings (bg + texto) |
| Feedback visual | Botón presionado → cambio de opacidad/color |

---

## Archivos Relacionados

- `src/components/Header.jsx` + `Header.css`
- `src/components/ProductGrid.jsx` + `ProductGrid.css`
- `src/components/ProductCard.jsx` + `ProductCard.css`
- `src/components/WeightModal.jsx` + `WeightModal.css`
- `src/components/SideMenu.jsx` + `SideMenu.css`
- `src/App.jsx` (estado global)
