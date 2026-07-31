# 21 — Navegación del SideMenu

> **Estado:** 🔄 Tema abierto (en evolución continua)
> **Prioridad:** Media

---

## 🎯 Objetivo

Documentar la estructura actual del menú lateral y servir de referencia viva mientras se sigue modificando.

---

## 📐 Estructura Actual

Orden y agrupación definidos por el dueño del negocio:

```
🏪 Ramos Comerciales
📂 Categorías de Producto
📦 Catálogo de Productos
─────────────
📊 Reporte de Ventas
─────────────
💱 Tasa BCV
─────────────
⚙️ Configuración de Sistema
📋 Visor de Logs
─────────────
🔒 Bloquear ahora
```

### Reglas de visibilidad
- **Bloqueo:** si hay PIN configurado y **no** hay sesión activa, solo se muestra **⚙️ Configuración de Sistema** (actúa como puerta de desbloqueo) y 🔒 Bloquear ahora.
- **Admin:** el resto de opciones aparecen únicamente con **sesión activa** (`sesionActiva`). Un cajero nunca las ve.

---

## 🧭 Decisiones Tomadas

- Los modales de admin viven en `App.jsx` (estado elevado), no en SettingsModal:
  `showTasa`, `showSalesReport`, `showLogs`, `showRamos`, `showCategories`, `showProducts`.
- `Configuración de Sistema` quedó reducida a: empresa, ramo asignado (solo lectura), PIN + duración de sesión, colores y Backup.
- Tasa BCV, Reporte de Ventas, Logs, Ramos, Categorías y Productos **no** están en Configuración; solo en el SideMenu.

---

## 🚧 Ideas Abiertas (por definir)

- ¿Separar "Bloquear ahora" con un grupo visual propio?
- ¿Sección de cajero (opciones sin PIN) en el futuro?
- ¿Iconos y etiquetas definitivas?

---

## Archivos Relacionados

- `src/components/SideMenu.jsx` + `SideMenu.css`
- `src/App.jsx` (estados elevados de modales)
- `src/components/SettingsModal.jsx`
- Ver [Done/20-funcionamiento-pin.md](Done/20-funcionamiento-pin.md) — sesión y PIN
