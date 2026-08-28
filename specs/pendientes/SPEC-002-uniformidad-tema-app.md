# SPEC-002: Uniformidad del Tema (consistencia visual)

## 1. Problema (¿por qué?)
La app define colores base en `src/index.css` (`:root`), pero muchos componentes no los usan: hay **decenas de colores hex hardcodeados** (#4caf50, #e5e7eb, #111827, etc.) y **~9 variables que se usan sin estar definidas** (ej. `--text-primary`, `--text-secondary`, `--surface`, `--border-color`, `--bg-primary`, `--bg-secondary`, `--bg-hover`, `--accent-color`, `--primary-dark`). Resultado: pantallas con tonos, bordes y cabeceras distintas entre sí. Para un producto comercial, esa incoherencia es lo que se percibe como "no terminado".

## 2. Objetivo (¿qué logramos?)
Toda la app se ve, siente y se comporta unificada: los mismos colores, bordes, redondeos, sombras y tamaños de botón en todos los módulos. Cambiar un color del tema cambia toda la app de forma coherente.

## 3. Alcance (¿qué se hace?) — checklist
- [ ] **Definir el set completo de variables** que la app realmente usa (colores de fondo, superficie, texto, borde, primario, estado, hover, acento) y normalizarlo en `:root`.
- [ ] **Sustituir los colores hex hardcodeados** por las variables del tema en los 24 CSS del proyecto.
- [ ] **Unificar tokens de UI**: redondeo (border-radius), sombras, grosor de borde y tamaños de botón en variables compartidas.
- [ ] **Alinear el tema de cabecera** (bgColor/textColor del dashboard) con la paleta para que se integre sin romper la leggibilità del texto.
- [ ] Crear una **referencia de tokens** (qué variable usar en cada caso) para evitar regresión.
- [ ] Hacer barrido visual por módulo (venta, carrito, inventario, reportes, backup, logs, config) y corregir desviaciones.

## 4. Fuera de alcance (lo que NO se hace ahora)
- ❌ Rediseñar la disposición (layout) de ninguna pantalla — solo color/tokens/consistencia.
- ❌ Cambiar la tipografía actual.
- ❌ Dark mode.
- ❌ Refactorizar la estructura de los componentes.
- ❌ Añadir un sistema de diseño nuevo ni una librería de componentes.

## 5. Decisiones / preguntas abiertas (lo que falta definir para aprobar)
- [ ] **¿Paleta base?** Parte del tema ya existe (verde `#2d6a4f`, acento `#e9c46a`). ¿Se mantiene y solo se unifica, o se aprovecha para ajustar tonos?
- [ ] **¿Qué hacemos con la paleta del negocio (bgColor/textColor)?** ¿La dejamos para la cabecera o la extendemos a botones primarios?
- [ ] **¿Variables existentes sin definición** (`--surface`, `--border-color`, etc.)? ¿Las redefinimos con significado o se mapean a los tokens unificados?
- [ ] **¿Hasta dónde barremos la "leggibilità"?** ¿Nos limitamos a temas/colores o tocamos espaciados/redondeos de botones (puede afectar módulos sensibles al tacto)?
- [ ] **¿Vamos todo de una vez** (24 CSS) **o por módulo** (riesgo de PR grande)?

## 6. Criterios de aceptación (¿cómo sé que quedó bien?)
1. Recorro todos los módulos: botones, tarjetas, bordes, encabezados y textos usan los mismos colores/redondeos/sombras.
2. Cambio un color del negocio en Ajustes → la cabecera y los elementos con `--primary` se actualizan coherentemente.
3. No queda ningún hex hardcodeado fuera de las definiciones del tema (búsqueda por `#` en CSS solo devuelve `src/index.css`).
4. No hay variables usadas pero sin definir en `:root`.
5. Ningún flujo crítico (cobro, inventario, login por PIN) se rompe visual ni funcionalmente.
6. La app se ve unificada en los modos de pantalla principales (venta, carrito, reportes, backup, logs).

## 7. Archivos que probablemente tocaré
- `src/index.css` — definición central de tokens del tema.
- `src/App.jsx` — aplicación del tema de negocio (bgColor/textColor) e integración con tokens.
- Los 24 `*.css` de `src/components/` y `src/features/TasaBcv/`.

## 8. Riesgos / notas
- **Impacto visual amplio.** Un cambio de tokens toca casi toda la app. Se recomienda hacerlo por módulo y verificar cada uno (no un solo commit masivo).
- **Lo verde del negocio vs el verde del tema.** El `bgColor` por defecto (`#4a8c5e`) difiere del `--primary` (`#2d6a4f`). Hay que decidir si se fusionan.
- **Regresiones en módulos sensibles.** Botones grandes táctiles y estados de inventario (verde/ámbar/naranja/rojo) dependen de colores exactos; conservar sus significados semánticos al migrar.
- **Tiempo de verificación.** Es labor de pulido; conviene validar módulo por módulo, no al final.

## 9. Estado
- [x] En definición (se puede crear/tocar; aún no se implementa)
- [ ] Totalmente definida — pendiente de aprobar
- [ ] Aprobada / en implementación
- [ ] Done
