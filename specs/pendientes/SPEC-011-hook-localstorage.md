# SPEC-011: Hook useLocalStorage con actualizadores funcionales correctos

> **Prioridad: P2 — MEDIA (estado del carrito)**

## 1. Problema (¿por qué?)
`useLocalStorage.js:16` resuelve el actualizador funcional contra `storedValue` capturado en la **clausura**, no contra el estado más reciente de React. Si dos `setCart(fn)` corren en el mismo batch (ej. agregar 2 productos seguidos), el segundo computa sobre el estado antiguo y **descarta el primer cambio**, persistiendo además ese valor desactualizado en localStorage.

## 2. Objetivo (¿qué logramos?)
Que los actualizadores funcionales del carrito se comporten como los de React: cada uno opera sobre el estado previo real, sin perder cambios en operaciones rápidas.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Corregir `setValue` para que acepte el actualizador funcional con el **estado real previo** (usando una referencia al estado vigente).
- [ ] Verificar que la persistencia en localStorage guarde el valor resultante final (el más reciente).
- [ ] Asegurar que `key` y `initialValue` no cambien entre renders de forma inesperada.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Migrar el estado del carrito a otro mecanismo (context/reducer/store).
- ❌ Cambiar el modelo de datos del carrito.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] ¿Solución con patrón de ref (referencia mutable al último valor) o reimplementar con `useEffect` + estado? (Recomendado: ref para el actualizador funcional.)
- [ ] ¿Impacta a otros usos del hook (tasa, settings)? Verificar que ninguno dependa del comportamiento actual.

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Agrego 2 productos seguidos muy rápido → ambos quedan en el carrito (ninguno se pierde).
2. Recargo la página → el carrito tiene exactamente los productos agregados.
3. Edito cantidad y luego agrego otro producto en el mismo ciclo → ambos cambios se respetan.

## 7. Archivos que probablemente tocaré
- `src/hooks/useLocalStorage.js` — corrección del actualizador funcional.

## 8. Riesgos / notas
- Riesgo bajo, pero afecta a todos los usos del hook (carrito, tasa, settings). Probar manualmente cada consumo.
- Se recomienda correr tests cuando exista SPEC-003 (o al menos pruebas manuales del carrito).

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
