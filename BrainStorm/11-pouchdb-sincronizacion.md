# 11 — PouchDB y Sincronización

> **Estado:** 💡 En evaluación
> **Prioridad:** Baja
> **Depende de:** 10, 12

---

## 🎯 Objetivo

Evaluar si conviene adoptar **PouchDB + Dexie.js** para la sincronización entre múltiples dispositivos POS (hasta 3 cajeros) en una red local Wi-Fi, sin depender de internet.

---

## 📐 El Dilema

### Contexto actual
- El proyecto usa **IndexedDB nativo** — regla explícita: sin PouchDB, sin Dexie.js
- El `brainstorm.md` original propone una **estrategia híbrida**:
  > "Usar PouchDB como canal de comunicación inalámbrico para enviar ventas a través del Wi-Fi local. Usar Dexie.js para indexar rápidamente las ventas entrantes."

### El problema
- 100% frontend sin backend
- 3 cajeros en la misma red Wi-Fi local
- Sin internet (offline-first)
- Necesidad de consolidar ventas en un solo punto

### Opciones

| Opción | Descripción |
|--------|-----------|
| **A — Status quo (IndexedDB nativo)** | Cada cajero opera independiente. No hay sincronización. La consolidación es manual (exportar/importar backup) |
| **B — PouchDB + CouchDB** | Replicación bidireccional automática. Requiere un servidor CouchDB en la red local |
| **C — PouchDB P2P** | Replicación peer-to-peer entre los 3 dispositivos. Cada uno es maestro de sus datos |
| **D — Servidor Node.js liviano** | Una PC económica en la red local recibe ventas vía HTTP. Los POS envían las ventas cuando hay conexión Wi-Fi |

---

## 📊 Análisis Comparativo

### Opción A — IndexedDB nativo (actual)

| Aspecto | Evaluación |
|---------|-----------|
| **Ventajas** | ✅ Sin dependencias externas ✅ Código simple ✅ Offline 100% ✅ Privacidad total |
| **Desventajas** | ❌ Sin sincronización automática ❌ Consolidación manual ❌ Cada cajero tiene datos aislados |
| **Esfuerzo** | 0 (ya implementado) |
| **Recomendación** | ✅ Viable para 1 cajero. Para 3+, requiere solución de sincronización |

### Opción B — PouchDB + CouchDB

| Aspecto | Evaluación |
|---------|-----------|
| **Ventajas** | ✅ Replicación automática ✅ Resolución de conflictos ✅ Historial de cambios ✅ Maduro (10+ años) |
| **Desventajas** | ❌ Requiere CouchDB en la red local (servidor) ❌ Mayor complejidad ❌ Dependencia externa ❌ Curva de aprendizaje |
| **Esfuerzo** | Alto — requiere montar CouchDB, migrar toda la lógica de datos |
| **Recomendación** | ❌ Sobredimensionado para 3 cajeros en una frutería |

### Opción C — PouchDB P2P (sin CouchDB)

| Aspecto | Evaluación |
|---------|-----------|
| **Ventajas** | ✅ Replicación P2P sin servidor central ✅ Offline-first ✅ Cada dispositivo replica cuando hay Wi-Fi |
| **Desventajas** | ❌ Complejidad de conflictos ❌ PouchDB P2P no está diseñado para esto (necesita CouchDB para replicación profesional) ❌ Puede perder datos si dos dispositivos modifican el mismo documento simultáneamente |
| **Esfuerzo** | Alto — implementar lógica de replicación manual |
| **Recomendación** | ⚠️ Posible pero no ideal |

### Opción D — Servidor Node.js liviano

| Aspecto | Evaluación |
|---------|-----------|
| **Ventajas** | ✅ Control total ✅ Sin dependencias externas (Node.js + Express) ✅ Funciona en red local ✅ Puede ser una PC económica o un teléfono maestro |
| **Desventajas** | ❌ Requiere un dispositivo servidor adicional ❌ Punto único de fallo (failover necesario) ❌ Curva de implementación |
| **Esfuerzo** | Medio — crear API REST simple, lógica de cola de ventas |
| **Recomendación** | ✅ Recomendada para 3+ cajeros |

---

## 🏆 Decisión Recomendada

### Para 1 cajero (escenario actual)
**Mantener Opción A** — IndexedDB nativo. Simple, rápido, sin dependencias.

### Para 3 cajeros (futuro)
**Opción D — Servidor Node.js liviano** con la siguiente arquitectura:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Cajero A   │     │  Cajero B   │     │  Cajero C   │
│  (POS)      │     │  (POS)      │     │  (POS)      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Servidor   │
                    │  Local      │
                    │  (PC/Phone) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Reportes   │
                    │  Central    │
                    └─────────────┘
```

**Flujo:**
1. Cada cajero opera su POS con IndexedDB local (funciona sin red)
2. Al completar una venta, la envía al servidor local vía HTTP (fetch)
3. Si no hay red → la venta queda en cola local → se envía cuando reaparezca la red
4. El servidor centraliza todas las ventas para reportes consolidados
5. Failover: si el servidor cae, los POS siguen funcionando y reenvían cuando recupere

### ¿Y PouchDB/Dexie.js?
**No se recomienda** para este proyecto por:
1. Las reglas del proyecto lo prohíben explícitamente
2. Añade complejidad innecesaria para 1 cajero
3. PouchDB brilla con CouchDB (nube), no en red local aislada
4. Dexie.js es una mejora de confort sobre IndexedDB, no una necesidad crítica

**Si en el futuro** se decide adoptar Dexie.js, sería solo por:
- Consultas más expresivas (índices, filtros combinados)
- Mejor manejo de transacciones
- Código más limpio

---

## 📝 Plan de Implementación (Opción D — Futuro)

### Fase 1: API Server (Node.js + Express)
- [ ] Crear `server/` en la raíz del proyecto
- [ ] Endpoint `POST /api/ventas` — recibir venta
- [ ] Endpoint `GET /api/ventas?fecha=...` — consultar ventas
- [ ] Endpoint `GET /api/productos` — sincronizar catálogo
- [ ] Almacenamiento: SQLite (simple, embebido, sin servidor)

### Fase 2: Cliente POS (envío de ventas)
- [ ] Agregar `ventasPendientes` en IndexedDB (cola de envío)
- [ ] Al completar venta → intentar enviar al servidor
- [ ] Si falla → guardar en cola → reintentar periódicamente
- [ ] UI: indicador de conexión al servidor (🟢/🔴)

### Fase 3: Failover
- [ ] Configurar IP del servidor en Settings
- [ ] Interruptor "Actuar como servidor" en Configuración
- [ ] Si el servidor principal cae, otro dispositivo puede asumir

---

## Archivos Relacionados

- `src/utils/db.js`
- `src/utils/backupService.js`
- `src/components/SettingsModal.jsx`
- `BrainStorm/10-persistencia-bases-datos.md`
- `BrainStorm/12-arquitectura-sistema.md`
