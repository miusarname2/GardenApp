# GardenApp 🌱

Una aplicación móvil para monitorear la salud de tus plantas utilizando sensores Bluetooth Low Energy (BLE). Rastrea métricas ambientales como hidratación, exposición a la luz, temperatura, humedad y niveles de batería para mantener tus plantas en óptimas condiciones.

> **Versiones en otros idiomas**: [English](README.en.md) | [中文](README.cn.md) | [Русский](README.ru.md) | [日本語](README.jp.md)

## 🚀 Cómo funciona

GardenApp conecta sensores inalámbricos colocados en tus plantas para recopilar datos en tiempo real. La aplicación muestra un dashboard con métricas actuales, gráficos históricos de crecimiento y un sistema de escaneo Bluetooth para configurar nuevos dispositivos.

### Características principales

- **Dashboard en tiempo real**: Visualiza métricas actuales de tus plantas
- **Gráficos históricos**: Rastrea el crecimiento y tendencias a lo largo del tiempo
- **Escaneo Bluetooth**: Descubre y conecta sensores BLE cercanos
- **Base de datos local**: Almacena datos usando SQLite para funcionamiento offline
- **Interfaz intuitiva**: Diseño moderno con navegación por pestañas
- **Widgets personalizables**: Cambia el orden, nombre y visibilidad de las tarjetas de Dashboard e Historial
- **Perfil de planta editable**: Guarda el nombre, la especie y una foto predefinida o una imagen propia mediante URL/URI

### Personalización del Dashboard e Historial

Pulsa el icono de ajustes en Dashboard o Historial para editar el perfil de la planta y las tarjetas de cada pantalla. Puedes renombrar, ocultar y reordenar widgets; el cambio de orden se realiza con las flechas de cada tarjeta. En Historial, Growth Index es un widget independiente y se puede colocar en la posición que prefieras.

Las preferencias se guardan en el almacenamiento local del dispositivo. No requieren cambios ni migraciones en SQLite, por lo que las métricas y eventos existentes se conservan. Para una foto propia, pega una URL o URI de imagen; la aplicación la recorta visualmente para adaptarla al espacio disponible.

## 📦 Instalación

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Expo CLI
- Dispositivo móvil con Android/iOS o emulador

### Pasos de instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd GardenApp
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Inicia la aplicación**
   ```bash
   npx expo start
   ```

4. **Ejecuta en dispositivo**
   - Escanea el código QR con la app Expo Go
   - O usa un emulador/simulador
   - Para desarrollo nativo: `npm run android` o `npm run ios`

## 🏗️ Arquitectura

### Estructura del proyecto

```
GardenApp/
├── app/                    # Páginas (file-based routing con Expo Router)
│   ├── (tabs)/            # Navegación por pestañas
│   │   ├── index.tsx      # Dashboard principal
│   │   ├── explore.tsx    # Historial y gráficos
│   │   └── settings.tsx   # Configuración y escaneo BLE
│   ├── widget-settings.tsx # Personalización de planta y widgets
│   ├── bluetooth-onboarding.tsx  # Tutorial de conexión
│   └── _layout.tsx        # Layout raíz
├── components/            # Componentes reutilizables
│   └── PlantHealthCard.tsx # Perfil visual de la planta
├── constants/             # Configuraciones y temas
├── db/                    # Base de datos SQLite
│   └── index.ts          # Configuración y seeding
└── assets/               # Imágenes y recursos
```

### Tecnologías utilizadas

- **Framework**: React Native con Expo SDK 54
- **Navegación**: Expo Router (file-based routing)
- **Base de datos**: SQLite con expo-sqlite
- **Bluetooth**: react-native-ble-plx para comunicación BLE
- **UI/UX**: React Native Reanimated para animaciones
- **Estilos**: StyleSheet con LinearGradient y Material Icons
- **Tipado**: TypeScript
- **Fuentes**: Google Fonts (Inter, Manrope)

### Base de datos

La aplicación utiliza SQLite para almacenamiento local con las siguientes tablas:

- **sensors**: Información de dispositivos conectados
- **metrics**: Métricas ambientales (hidratación, temperatura, etc.)
- **history**: Registro de eventos y acciones

Los datos se inicializan con valores de ejemplo al primer uso.

## 🔧 Desarrollo

### Comandos disponibles

```bash
npm start          # Inicia el servidor de desarrollo
npm run android    # Ejecuta en Android
npm run ios        # Ejecuta en iOS
npm run web        # Ejecuta en navegador
npm run lint       # Ejecuta ESLint
```

### Configuración Bluetooth

La aplicación requiere permisos de Bluetooth para funcionar. En Android, solicita permisos automáticamente. Para iOS, asegúrate de configurar los permisos en `app.json`.

### Temas y colores

Los colores están definidos en `constants/theme.ts` siguiendo las guías de Material Design 3.

## 📚 Recursos adicionales

- [Documentación de Expo](https://docs.expo.dev/)
- [React Native BLE PLX](https://github.com/dotintent/react-native-ble-plx)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir cambios mayores.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
