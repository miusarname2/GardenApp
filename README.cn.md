# GardenApp 🌱

一款使用蓝牙低功耗 (BLE) 传感器监控植物健康的移动应用。它跟踪环境指标，如水分、光照、温度、湿度以及电池电量，以保持植物的最佳状态。

## 🚀 工作原理

GardenApp 连接放置在植物上的无线传感器，以收集实时数据。应用显示包含当前指标、历史生长图表以及蓝牙扫描系统的仪表板，用于设置新设备。

### 主要功能

- **实时仪表板**：可视化植物的当前指标
- **历史图表**：跟踪生长趋势和时间变化
- **蓝牙扫描**：发现并连接附近的 BLE 传感器
- **本地数据库**：使用 SQLite 存储数据，支持离线操作
- **直观界面**：现代设计，带有标签页导航

## 📦 安装

### 先决条件

- Node.js（版本 18 或更高）
- npm 或 yarn
- Expo CLI
- 带有 Android/iOS 的移动设备或模拟器

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <仓库-url>
   cd GardenApp
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动应用**
   ```bash
   npx expo start
   ```

4. **在设备上运行**
   - 使用 Expo Go 应用扫描二维码
   - 或使用模拟器/仿真器
   - 对于原生开发：`npm run android` 或 `npm run ios`

## 🏗️ 架构

### 项目结构

```
GardenApp/
├── app/                    # 页面（使用 Expo Router 的基于文件的路由）
│   ├── (tabs)/            # 标签页导航
│   │   ├── index.tsx      # 主仪表板
│   │   ├── explore.tsx    # 历史记录和图表
│   │   └── settings.tsx   # 设置和 BLE 扫描
│   ├── bluetooth-onboarding.tsx  # 连接教程
│   └── _layout.tsx        # 根布局
├── components/            # 可重用组件
│   └── PlantHealthCard.tsx # 指标卡片
├── constants/             # 配置和主题
├── db/                    # SQLite 数据库
│   └── index.ts          # 配置和种子数据
└── assets/               # 图片和资源
```

### 使用的技术

- **框架**：使用 Expo SDK 54 的 React Native
- **导航**：Expo Router（基于文件的路由）
- **数据库**：使用 expo-sqlite 的 SQLite
- **蓝牙**：react-native-ble-plx 用于 BLE 通信
- **UI/UX**：React Native Reanimated 用于动画
- **样式**：StyleSheet 与 LinearGradient 和 Material Icons
- **类型检查**：TypeScript
- **字体**：Google Fonts（Inter, Manrope）

### 数据库

应用使用 SQLite 进行本地存储，具有以下表：

- **sensors**：连接设备的信息
- **metrics**：环境指标（水分、温度等）
- **history**：事件和操作记录

首次使用时，数据使用示例值进行初始化。

## 🔧 开发

### 可用的命令

```bash
npm start          # 启动开发服务器
npm run android    # 在 Android 上运行
npm run ios        # 在 iOS 上运行
npm run web        # 在浏览器中运行
npm run lint       # 运行 ESLint
```

### 蓝牙配置

应用需要蓝牙权限才能正常工作。在 Android 上，权限会自动请求。对于 iOS，请确保在 `app.json` 中配置权限。

### 主题和颜色

颜色在 `constants/theme.ts` 中定义，遵循 Material Design 3 指南。

## 📚 其他资源

- [Expo 文档](https://docs.expo.dev/)
- [React Native BLE PLX](https://github.com/dotintent/react-native-ble-plx)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

## 🤝 贡献

欢迎贡献。请先打开 issue 来讨论重大更改。

## 📄 许可证

本项目采用 MIT 许可证。