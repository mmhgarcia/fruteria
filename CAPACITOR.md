# Capacitor - Guía de Configuración y Uso

## Configuración Instalada

Capacitor ha sido configurado en el proyecto para crear aplicaciones nativas de Android e iOS.

### Archivos de Configuración

- **capacitor.config.ts**: Configuración principal de Capacitor
- **tsconfig.json**: Configuración de TypeScript para el archivo de configuración

### Dependencias Instaladas

**Producción:**
- @capacitor/core: ^8.5.0
- @capacitor/cli: ^8.5.0

**Desarrollo:**
- @capacitor/android: ^8.5.0
- @capacitor/ios: ^8.5.0
- typescript: ^5.0.0

## Comandos Disponibles

### Desarrollo
```bash
npm run dev              # Servidor de desarrollo Vite
npm run build            # Build de producción
npm run preview          # Preview del build
```

### Capacitor
```bash
npm run cap:sync         # Sincronizar con plataformas nativas
npm run cap:android      # Abrir proyecto Android en Android Studio
npm run cap:ios          # Abrir proyecto iOS en Xcode
npm run cap:build:android # Build + sync para Android
npm run cap:build:ios   # Build + sync para iOS
```

## Flujo de Trabajo Recomendado

### Para Desarrollo Mobile

1. **Desarrollo Web:**
   ```bash
   npm run dev
   ```
   Desarrolla la interfaz en el navegador como normalmente lo haces.

2. **Preparar para Mobile:**
   ```bash
   npm run build
   npm run cap:sync
   ```
   Esto compila el proyecto y sincroniza los archivos con las plataformas nativas.

3. **Abrir en Android Studio:**
   ```bash
   npm run cap:android
   ```
   O para iOS:
   ```bash
   npm run cap:ios
   ```

4. **Pruebas en Emulador/Dispositivo:**
   - Android: Ejecuta desde Android Studio
   - iOS: Ejecuta desde Xcode

### Comando Combinado
```bash
npm run cap:build:android   # Build + sync en un solo paso
npm run cap:build:ios       # Build + sync en un solo paso
```

## Configuración Actual

### capacitor.config.ts
```typescript
{
  appId: 'com.fruteriapos.app',
  appName: 'Frutería POS',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
}
```

## Plugins Capacitor Disponibles

Para agregar funcionalidades nativas, instala los plugins de Capacitor:

```bash
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/local-notifications
# etc...
```

Luego sincroniza:
```bash
npm run cap:sync
```

## Consideraciones Especiales

### Para React + Vite + Capacitor

1. **Directorio web:** Configurado como `dist` (salida de Vite)
2. **Scheme HTTPS:** Configurado para Android para evitar problemas de mixed content
3. **Runtime Web:** Desactivado para usar el runtime del dispositivo

### Primer Uso

Para iOS, necesitas:
- Mac con Xcode instalado
- CocoaPods instalado

Para Android, necesitas:
- Android Studio instalado
- SDK de Android configurado

### Agregar Nuevas Plataformas

Si necesitas agregar soporte para otras plataformas:

```bash
npx cap add android    # Ya agregado
npx cap add ios        # Ya agregado
npx cap add electron   # Para escritorio
```

## Solución de Problemas Comunes

### Capacitor no detecta cambios
```bash
npm run build
npm run cap:sync
```

### Errores de permisos en Android
Verifica que los permisos estén configurados en `android/app/src/main/AndroidManifest.xml`

### Problemas con iOS
```bash
cd ios
pod install
cd ..
npm run cap:sync ios
```

## Recursos

- [Documentación oficial de Capacitor](https://capacitorjs.com/docs)
- [Plugins oficiales](https://capacitorjs.com/docs/plugins)
- [Guía de Getting Started](https://capacitorjs.com/docs/getting-started)