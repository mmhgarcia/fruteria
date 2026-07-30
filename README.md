# Frutería POS

> Punto de Venta táctil para fruterías, carnicerías y charcuterías en Venezuela.
> 100% offline-first. Sin internet. Sin backend. Solo tu negocio.

<!-- 🚧 Documentación en construcción — Se completará al finalizar la fase de brainstorming -->

**Estado:** 🚧 En desarrollo activo

---

## ✨ Features

- 🖐️ Interfaz 100% táctil, grandes botones
- 💵 **Dólar y Bolívar** con tasa BCV actualizable
- 💳 **Pagos mixtos**: Pago Móvil, Punto, Efectivo ($ y Bs), Divisa
- 🧾 Ticket digital imprimible con desglose por método de pago
- 🔐 PIN de administrador para proteger configuraciones
- 🗂️ Ramos comerciales: frutería, carnicería, charcutería…
- 📦 Instalable como app (PWA), funciona sin internet
- 🔄 Backup y restauración de datos

---

## 🚀 Instalación

1. Abre la URL en Chrome o Edge
2. Toca "Instalar" (o "Agregar a pantalla de inicio")
3. Listo. Funciona como app nativa.

> No requiere Play Store, no requiere internet para operar.

---

## 📖 Documentación

| Para | Archivo |
|------|---------|
| 🧑‍🔧 **Manual del Cajero** | [`docs/MANUAL-USUARIO.md`](docs/MANUAL-USUARIO.md) |
| 👑 **Manual del Administrador** | [`docs/MANUAL-ADMIN.md`](docs/MANUAL-ADMIN.md) |
| ❓ **Solución de problemas** | [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) |
| 🏗️ **Arquitectura del sistema** | [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) |
| 🗄️ **Modelo de datos** | [`docs/MODELO-DATOS.md`](docs/MODELO-DATOS.md) |
| 🚢 **Despliegue** | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) |
| 🛡️ **Seguridad** | [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md) |

---

## 🧠 BrainStorm

El roadmap y análisis de features vive en [`BrainStorm/`](BrainStorm/Main.md).

---

## 📄 Licencia

Este producto tiene licencia comercial. Ver [`LICENSE`](LICENSE).

---

## 🔗 Enlaces

- **Última versión**: [CHANGELOG.md](CHANGELOG.md)
- **Reportar error**: Abre un issue en GitHub
- Pagos mixtos: combinar múltiples métodos en una misma venta.
- IGTF 3% opcional configurable.
- Vista previa de ticket e impresión.
- **Ramos Comerciales**: CRUD de ramos, categorías jerárquicas por ramo.
- **Histórico de Tasas BCV**: registro manual de tasas de cambio.
- **Sistema de Logs**: registro de eventos (INFO, WARNING, ERROR, FATAL, ALERT).
- **Seguridad**: PIN de administrador con hash SHA-256, bloqueo tras 3 intentos fallidos.
- **Badge de alertas**: indicador rojo en header para logs ALERT no leídos.
- **Backup**: exportar e importar todos los datos del sistema.
- PWA: instalable y funciona offline.
- Persistencia de carrito y tasa en `localStorage`; datos en IndexedDB.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. Importa el proyecto en Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.

> ⚠️ NO usar GitHub Pages. El deploy automático se hace mediante Vercel conectado al repositorio de GitHub. Los `_headers` en `/public` fuerzan `no-cache` para JS/CSS/HTML.

## Notas

- Recuerda que en WSL con `/mnt/d`, Vite a veces no detecta cambios en archivos; reinicia el dev server si es necesario.
