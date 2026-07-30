# 04 — Atención Simultánea

> **Estado:** 💡 Idea / Propuesta
> **Prioridad:** Media
> **Depende de:** 01, 03

---

## 🎯 Objetivo

Permitir que el cajero atienda múltiples clientes de forma concurrente, manteniendo carritos separados y cambiando entre ellos sin perder el contexto.

---

## Propuesta

### Escenario de uso
1. Cliente A está siendo atendido (productos en carrito)
2. Llega Cliente B con una compra rápida
3. Cajero "pausa" el carrito de A, abre un nuevo carrito para B
4. Atiende a B, cobra, imprime ticket
5. Vuelve al carrito de A y continúa donde lo dejó

### Cómo funcionaría

| Concepto | Propuesta |
|----------|-----------|
| N° de carritos simultáneos | 2 o 3 (configurable) |
| Persistencia | localStorage: `fruteria-carts` (array de carritos) |
| Interfaz | Pestañas/tabs en el header o en Ticket |
| Estado actual | Carrito "activo" resaltado |
| Límite temporal | Carrito inactivo > 30 min → alerta para liberar |

### UX propuesta

```
[Cliente 1] [Cliente 2] [+]   ← Tabs de clientes
├── Carrito Cliente 1: 3 items
├── Carrito Cliente 2: (vacío)
└── [+] Nuevo cliente
```

- Tap en tab → cambia de carrito activo
- Tap en [+] → abre nuevo carrito (si hay cupo)
- Tap prolongado en tab → cerrar carrito (solo si está vacío)
- Al cobrar → el carrito se limpia y la tab queda disponible

---

## Consideraciones Técnicas

### Cambios necesarios
- `App.jsx`: `cart` pasa de objeto único a `{ carts: [], activeCartIndex: 0 }`
- `Ticket.jsx`: mostrar siempre el carrito activo
- `Header.jsx`: tabs de clientes en la fila inferior
- `localStorage`: migrar de `fruteria-cart` a `fruteria-carts`

### Riesgos
- Complejidad de estado crece significativamente
- Posibles confusiones visuales para el cajero
- Mayor consumo de memoria (varios carritos en localStorage)
- Pruebas de usabilidad necesarias

### Alternativa simplificada
En lugar de tabs, un botón "🔄 Nueva Venta" que:
1. Guarda el carrito actual en un historial temporal
2. Limpia el carrito para el nuevo cliente
3. Botón "↩ Volver a venta anterior" para recuperar

---

## Relacionado

- Ver [02-carrito-ticket.md](02-carrito-ticket.md) — edición rápida de ítems
- Ver [05-historico-ventas.md](05-historico-ventas.md) — persistencia del carrito pausado
