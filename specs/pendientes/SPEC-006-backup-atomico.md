# SPEC-006: Import/export de backup robusto y atómico

> **Prioridad: P0 — CRÍTICA (pérdida total de datos)**

## 1. Problema (¿por qué?)
Restaurar un backup es el momento más frágil: borra store por store y escribe en **transacciones separadas** (`backupService.js:120-129`). Si algo falla a mitad, la DB queda **parcialmente borrada** y los datos originales ya no existen (sin rollback). Además no valida el contenido del archivo (beyond `backup.data`), por lo que un backup corrupto puede inyectar datos inválidos.

## 2. Objetivo (¿qué logramos?)
Que restaurar sea seguro: o importa **todo** correctamente, o **no cambia nada**. Y que un archivo corrupto se rechace sin romper la DB actual.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] Hacer `importBackup` **una sola transacción** `readwrite` que cubra todas las stores (all-or-nothing).
- [ ] Validar el archivo antes de escribir: estructura `{ version, data }`, y que cada store contenga registros con la forma esperada (no cualquier objeto).
- [ ] Respaldar/verificar que, si falla cualquier store, se revierta el borrado (transacción única o snapshot previo).
- [ ] Validar el campo `version` del backup para rechazar archivos incompatibles.
- [ ] Mantener el export manual sin romperse (ya funciona).

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Cifrar el backup.
- ❌ Merge/restauración parcial o automática.
- ❌ Subida a la nube (ver SPEC-001).

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] ¿Errores de `version` o de estructura: rechazar y avisar, o intentar importar todo lo posible? (Recomendado: rechazar con mensaje claro.)
- [ ] ¿Validar cada registro contra el `keyPath` de su store o solo a nivel de estructura del `data`?
- [ ] ¿Confirmar antes de sobrescribir si ya hay datos (doble aviso de irreversibilidad)? El modal ya pregunta. ¿Reforzar?

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Importo un backup válido → todos los datos vuelven, sin errores.
2. Importo un archivo corrupto/ inválido → la app lo rechaza con mensaje y **no borra ni altera** los datos actuales.
3. Fuerzo un error a mitad de la importación → la DB queda como estaba (sin pérdida parcial).
4. Exportar sigue generando el JSON con todas las stores.

## 7. Archivos que probablemente tocaré
- `src/utils/backupService.js` — `importBackup` (transacción única + validación).
- `src/components/BackupModal.jsx` — feedback de error más claro.

## 8. Riesgos / notas
- Las stores se definen hardcodeadas en `backupService.js` y deben seguir coincidiendo con `db.js` (ver SPEC-005 para unificar). Si no, importa incompleto.
- Al agregar validation, revisar que backups exportados por versiones anteriores sigan importando (retrocompatibilidad de `version`).

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
