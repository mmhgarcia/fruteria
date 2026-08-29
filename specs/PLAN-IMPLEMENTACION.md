# PLAN DE IMPLEMENTACIÓN DE SPECS

> **Documento de trabajo del programador** — NO es documentación del producto.
> Propósito: registrar el **orden de ejecución** para atacar las issues por prioridad.
> Cuando una spec se completa, se mueve de `pendientes/` a `hechas/` y se actualiza esta tabla.

---

## Orden recomendado

Estas issues forman la **deuda técnica top de la app** (dinero + integridad de datos + seguridad).
Cada una es un entregable accionable. Se prioriza primero lo crítico, y se intercala el testing
al inicio para tener red de seguridad antes de los refactors de dinero/stock.

| Orden | Spec | Prioridad | Tema | Estado | Nota de ejecución |
|-------|------|-----------|------|--------|-------------------|
| — | SPEC-003 | P0 | Testing del flujo de cobro | ✅ Done | Red de seguridad lista; protege refactors de 004/008/009 |

| 2 | SPEC-005 | P0 | Unificar openDB + logs rotos | En definición | Causa raíz; desbloquea logs; base técnica |

| 3 | SPEC-006 | P0 | Backup atómico | En definición | Independiente; protege datos |

| 4 | SPEC-004 | P0 | Cobro seguro | En definición | Crítico de dinero; depende buenos logs |

| 5 | SPEC-007 | P1 | Seguridad PIN/sesión | En definición | Independiente O como apertura del paquete P1 |

| 6 | SPEC-008 | P1 | Dinero y stock consistente | En definición | Requiere tests (003) antes |

| 7 | SPEC-009 | P1 | Validación stock en carrito | En definición | 
Decisiones de negocio pendientes (§5) |

| 8 | SPEC-010 | P2 | Limpieza código muerto | En definición | Hacer después de 005 (evitar choques) |

| 9 | SPEC-011 | P2 | Hook useLocalStorage | En definición | Independiente; acompaña 008/009 |

| — | SPEC-001 | — | Backup automático (posnube) | En definición (pausada) | En espera de decisión de respaldo externo |

| — | SPEC-002 | — | Uniformidad de tema | En definición | Diseño/pulido, no urgente; se puede hacer en paralelo |

---

## Secuencia sugerida

**Fase A — Fundaciones (P0)**
1. ~~SPEC-003 (testing)~~ ✅ Done — red de seguridad lista.
2. SPEC-005 (unificar DB + logs) → desbloquea raíz técnica.
3. SPEC-006 (backup atómico) → protege datos.
4. SPEC-004 (cobro seguro) → crítico de dinero, con tests ya en su lugar.

**Fase B — Alto impacto (P1)**
5. SPEC-007 (seguridad PIN/sesión).
6. SPEC-008 (dinero/stock consistente).
7. SPEC-009 (validación stock en carrito).

**Fase C — Calidad/mantenimiento (P2)**
8. SPEC-010 (limpieza código muerto).
9. SPEC-011 (hook localStorage).

**En paralelo (no bloquean)**
- SPEC-002 (tema) y SPEC-001 (backup automático) cuando haya banda; 001 sigue en espera de decisión de dónde vive el respaldo externo.

---

## Reglas de avance

- **REGLARIA GENERAL:** toda spec implementada **debe pasar el test correspondiente** antes de considerarse finalizada. Sin test verde, no se mueve a `hechas/` ni se declara `Done`.
- Una spec solo se implementa cuando está **`Totalmente definida`** (sección 5 de decisiones abiertas sin ítems pendientes) y **`Aprobada`**.
- Antes de empezar una issue, marcar en `pendientes/<spec>.md` el estado **`Aprobada / en implementación`**.
- Al terminar: mover la fila de esta tabla (y el archivo) de `pendientes/` → `hechas/`, marcar **`Done`** y actualizar `CHANGELOG.md` + `ARQUITECTURA.md`.

---

## Checklist rápido por issue

Antes de dar una issue por terminada:
- [ ] Criterios de aceptación verificados (sección 6 de la spec).
- [ ] **Test correspondiente implementado y en verde (`npm test` pasa).** — REGLA GENERAL, obligatorio.
- [ ] Decisiones abiertas resueltas y documentadas.
- [ ] Regresión manual del flujo afectado.
- [ ] `CHANGELOG.md` / `ARQUITECTURA.md` actualizados.
- [ ] Movida a `hechas/`.

---

## Completadas

| Spec | Tema | Fecha | Nota |
|------|------|-------|------|
| SPEC-003 | Testing del flujo de cobro | 2026-08-28 | Vitest + fake-indexeddb; 20 tests en verde; merge a main |
