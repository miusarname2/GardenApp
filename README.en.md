# GardenApp 🌱

A mobile application for monitoring your plants' health using Bluetooth Low Energy (BLE) sensors. It tracks environmental metrics such as hydration, light exposure, temperature, humidity, and battery levels to keep your plants in optimal condition.

## 🚀 How it works

GardenApp connects wireless sensors placed in your plants to collect real-time data. The application displays a dashboard with current metrics, historical growth charts, and a Bluetooth scanning system to set up new devices.

### Main features

- **Real-time dashboard**: Visualise current metrics of your plants
- **Historical charts**: Track growth and trends over time
- **Bluetooth scanning**: Discover and connect nearby BLE sensors
- **Local database**: Store data using SQLite for offline operation
- **Intuitive interface**: Modern design with tab navigation

## 📦 Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Expo CLI
- Mobile device with Android/iOS or emulator

### Installation steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GardenApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npx expo start
   ```

4. **Run on device**
   - Scan the QR code with the Expo Go app
   - Or use an emulator/simulator
   - For native development: `npm run android` or `npm run ios`

## 🏗️ Architecture

### Project structure

```
GardenApp/
├── app/                    # Pages (file-based routing with Expo Router)
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Main dashboard
│   │   ├── explore.tsx    # History and charts
│   │   └── settings.tsx   # Settings and BLE scanning
│   ├── bluetooth-onboarding.tsx  # Connection tutorial
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   └── PlantHealthCard.tsx # Metrics card
├── constants/             # Configurations and themes
├── db/                    # SQLite database
│   └── index.ts          # Configuration and seeding
└── assets/               # Images and resources
```

### Technologies used

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Database**: SQLite with expo-sqlite
- **Bluetooth**: react-native-ble-plx for BLE communication
- **UI/UX**: React Native Reanimated for animations
- **Styling**: StyleSheet with LinearGradient and Material Icons
- **Typing**: TypeScript
- **Fonts**: Google Fonts (Inter, Manrope)

### Database

The application uses SQLite for local storage with the following tables:

- **sensors**: Information about connected devices
- **metrics**: Environmental metrics (hydration, temperature, etc.)
- **history**: Record of events and actions

Data is initialised with sample values on first use.

## 🔧 Development

### Available commands

```bash
npm start          # Start the development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in browser
npm run lint       # Run ESLint
```

### Bluetooth configuration

The application requires Bluetooth permissions to function. On Android, permissions are requested automatically. For iOS, ensure permissions are configured in `app.json`.

### Themes and colours

Colours are defined in `constants/theme.ts` following Material Design 3 guidelines.

## 📚 Additional resources

- [Expo documentation](https://docs.expo.dev/)
- [React Native BLE PLX](https://github.com/dotintent/react-native-ble-plx)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

## 🤝 Contributions

Contributions are welcome. Please open an issue first to discuss major changes.

## 📄 Licence

This project is under the MIT Licence.