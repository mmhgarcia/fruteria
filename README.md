# Frutería POS — PWA

Punto de venta táctil para frutería, construido con React + Vite + PWA.

## Características

- Catálogo de frutas y verduras con filtros y búsqueda.
- Carrito / ticket con cálculo en USD y conversión a Bs.
- Teclado numérico para peso/cantidad.
- Selector de métodos de pago.
- Vista previa de ticket e impresión.
- PWA: instalable y funciona offline.
- Persistencia de carrito y tasa en `localStorage`.

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

## Despliegue en GitHub Pages

1. Configura `base` en `vite.config.js` si tu repo no es el perfil principal:
   ```js
   export default defineConfig({
     base: '/nombre-del-repo/',
     // ...
   })
   ```
2. Ejecuta:
   ```bash
   npm run build
   npm run deploy
   ```

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. Importa el proyecto en Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.

## Notas

- Recuerda que en WSL con `/mnt/d`, Vite a veces no detecta cambios en archivos; reinicia el dev server si es necesario.
