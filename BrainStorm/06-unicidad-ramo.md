# 06 — Unicidad de Ramo

> **Estado:** 💡 Idea / Propuesta
> **Prioridad:** Media
> **Depende de:** 08

---

## 🎯 Objetivo

Garantizar que solo haya **un ramo comercial activo** por instalación. Si el administrador cambia de ramo, se debe advertir que los datos previos (productos, categorías, ventas) serán eliminados.

---

## Regla de Negocio

```
"Al instalar la app solo puede haber un ramo configurado.
Si ya hay uno configurado y se trata de configurar otro,
debe haber un alert que los datos previos serán eliminados.
Si el usuario insiste, es su responsabilidad y quedará un
log FATAL con user, fecha y hora."
```

---

## Flujo Propuesto

### Cambio de Ramo

1. Admin va a Configuración → Administración → Ramos Comerciales
2. Selecciona/crea un ramo diferente al activo
3. **Modal de advertencia**:
   ```
   ⚠️ ¿Cambiar ramo comercial?
   Al cambiar de ramo, TODOS los datos actuales serán eliminados:
   • Productos
   • Categorías
   • Historial de ventas
   • Historial de tasas
   • Logs del sistema
   
   Esta acción NO se puede deshacer.
   
   [Cancelar] [Confirmar cambio]
   ```
4. Si confirma:
   - Se registra log `FATAL` con: usuario, fecha, hora, ramo anterior, ramo nuevo
   - Se **limpian todas las stores** de IndexedDB
   - Se ejecuta `seedProducts()` y `seedCategories()` con los defaults del nuevo ramo
   - Se actualiza `settings.ramoId`
   - La app recarga

### Consideraciones

- **Backup automático**: antes de limpiar, sugerir exportar un backup
- **PIN requerido**: solo admin autenticado puede cambiar de ramo
- **Registro FATAL**: queda evidencia permanente en los nuevos logs (el log se genera después de limpiar)

---

## Implementación Técnica

### Cambios necesarios

| Archivo | Cambio |
|---------|--------|
| `src/utils/ramos.js` | Agregar función `changeRamo(newRamoId, newRamoName)` |
| `src/components/RamosComerciales.jsx` | Integrar flujo de confirmación |
| `src/utils/db.js` | Función `clearAllStores()` |
| `src/utils/backupService.js` | Ofrecer backup automático antes del cambio |

### Código base para `changeRamo()`

```javascript
export async function changeRamo(newRamoId, newRamoName, settings, onSave) {
  // 1. Registrar log FATAL del cambio
  await addLog(LOG_TYPES.FATAL, 'CAMBIO DE RAMO COMERCIAL', {
    ramoAnterior: settings.ramoId,
    ramoNuevo: newRamoId,
    timestamp: new Date().toISOString()
  })

  // 2. Limpiar todas las stores
  const db = await openDB()
  for (const store of ['products', 'categories', 'historico_tasas', 'sales', 'ramos', 'logs']) {
    // ... clear store
  }

  // 3. Sembrar datos por defecto del nuevo ramo
  await seedCategories(defaultCategories(newRamoId))
  await seedProducts(defaultProducts(newRamoId))

  // 4. Actualizar settings
  onSave({
    ...settings,
    ramoId: newRamoId
  })

  // 5. Recargar la app
  window.location.reload()
}
```

---

## Archivos Relacionados

- `src/utils/ramos.js`
- `src/components/RamosComerciales.jsx`
- `src/components/RamoSelector.jsx`
- `src/utils/db.js`
- `src/utils/logService.js`
