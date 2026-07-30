# Frutería POS — PWA

Punto de venta táctil para frutería, construido con React + Vite + PWA.

## Características

- Catálogo de frutas y verduras con filtros y búsqueda.
- Carrito / ticket con cálculo en USD y conversión a Bs.
- Teclado numérico para peso/cantidad (kg con decimales, unidad sin decimales).
- Selector de métodos de pago (Pago Móvil, Efectivo $/Bs, Divisa, Punto).
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
