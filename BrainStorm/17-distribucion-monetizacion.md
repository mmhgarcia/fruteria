# 17 — Distribución y Monetización

> **Estado:** 💡 Idea
> **Prioridad:** Baja
> **Depende de:** 14

---

## 🎯 Objetivo

Definir cómo distribuir la app a los clientes, cómo gestionar licencias y cómo monetizar el producto.

---

## 📦 Modelo de Distribución

### App Web (PWA)
- Hosteada en **Vercel** (auto-deploy desde GitHub)
- El cliente accede a la URL → se instala como PWA
- No hay tienda de apps (Play Store, App Store)
- Ventajas: actualizaciones instantáneas, sin aprobación de terceros

### Flujo de entrega a un cliente
1. Tú desarrollas y publicas en tu dominio (ej: tu-app.vercel.app)
2. Cliente abre la URL en Chrome/Edge
3. Cliente toca "Instalar" (add to home screen)
4. La app queda instalada como una app nativa
5. Cliente ingresa la licencia → app desbloqueada

**Variante:** Si cada cliente necesita su propia URL:
- Usar **Vercel Domains** o **Cloudflare Pages**
- Cada cliente tiene `su-negocio.mi-plataforma.com`
- Mismo código, diferentes deployments

---

## 💰 Modelo de Monetización

### Opción A: Licencia perpetua por dispositivo
| Concepto | Detalle |
|----------|---------|
| Precio | $XX por dispositivo (único pago) |
| Incluye | App completa, actualizaciones de por vida |
| Soporte | Email / WhatsApp |
| Ideal para | Fruterías, carnicerías, charcuterías pequeñas |
| Licencia | RSA firmada (ver [14-proteccion-copias.md](14-proteccion-copias.md)) |

### Opción B: Suscripción mensual/anual
| Concepto | Detalle |
|----------|---------|
| Precio | $X/mes o $X/año por dispositivo |
| Incluye | App + actualizaciones + soporte prioritario |
| Ideal para | Negocios que quieren soporte continuo |
| Desafío | Requiere backend para validar suscripción |

### Opción C: Código abierto + soporte
| Concepto | Detalle |
|----------|---------|
| Precio | App gratis (open source) |
| Ingresos | Soporte técnico, instalación, personalización |
| Ideal para | Comunidad, credibilidad, contribuciones |
| Desafío | Menor ingreso por cliente |

---

## 🛠️ Herramientas para Monetización

### Sin backend (recomendado)
- **Licencias RSA**: generas licencias manualmente con script CLI
- **Pago único**: transferencia bancaria, PayPal, Zelle, Binance
- **Sin infraestructura recurrente**: no pagas servidores

### Con backend mínimo (futuro)
- Stripe / PayPal para pagos recurrentes
- Vercel Serverless Functions para validar suscripciones
- Base de datos simple (Supabase o Firebase) para gestionar clientes

---

## 📈 Estrategia de Precios Sugerida

| Plan | Precio | Descripción |
|------|--------|-------------|
| **Básico** | $30 | 1 dispositivo, licencia perpetua, actualizaciones vía PWA |
| **Comercial** | $70 | 3 dispositivos, licencia perpetua, soporte prioritario |
| **Premium** | $150 | Ilimitado, personalización de marca, instalación remota |

---

## 🚀 Plan de Acción

### Fase 1 — Distribución básica (ahora)
- [ ] La app ya está en Vercel
- [ ] Cualquiera puede acceder e instalarla
- [ ] Sin restricciones (modo libre)

### Fase 2 — Licencias (próximo paso)
- [ ] Implementar licencias RSA (ver [14-proteccion-copias.md](14-proteccion-copias.md))
- [ ] Modo gracia: 30 días de prueba completos
- [ ] Script para generar licencias
- [ ] Instrucciones para el cliente

### Fase 3 — Landing page + pago
- [ ] Página simple de producto: features, screenshots, precio
- [ ] Botón de pago (PayPal / Binance)
- [ ] Entrega automática de licencia (o manual vía email)

---

## Archivos Relacionados

- `BrainStorm/14-proteccion-copias.md` — sistema de licencias
- `BrainStorm/12-arquitectura-sistema.md` — hosting y PWA
- `BrainStorm/11-pouchdb-sincronizacion.md` — multi-dispositivo (valor adicional)
