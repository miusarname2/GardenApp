# GardenApp 🌱

Bluetooth Low Energy (BLE) センサーを使用して植物の健康状態を監視するモバイルアプリケーション。水分、光照射、温度、湿度、バッテリーレベルなどの環境指標を追跡し、植物を最適な状態に保ちます。

## 🚀 動作原理

GardenApp は植物に設置されたワイヤレスセンサーに接続し、リアルタイムデータを収集します。アプリケーションは現在の指標、成長の履歴チャート、Bluetooth スキャンシステムを表示し、新しいデバイスの設定を行います。

### 主な機能

- **リアルタイムダッシュボード**: 植物の現在の指標を視覚化
- **履歴チャート**: 時間経過による成長と傾向を追跡
- **Bluetooth スキャン**: 近くの BLE センサーを検知して接続
- **ローカルデータベース**: SQLite を使用してオフライン操作用のデータを保存
- **直感的なインターフェース**: タブナビゲーション付きのモダンデザイン

## 📦 インストール

### 前提条件

- Node.js (バージョン 18 以上)
- npm または yarn
- Expo CLI
- Android/iOS 搭載モバイルデバイスまたはエミュレータ

### インストール手順

1. **リポジトリをクローン**
   ```bash
   git clone <リポジトリ-url>
   cd GardenApp
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **アプリケーションを起動**
   ```bash
   npx expo start
   ```

4. **デバイスで実行**
   - Expo Go アプリで QR コードをスキャン
   - またはエミュレータ/シミュレータを使用
   - ネイティブ開発の場合: `npm run android` または `npm run ios`

## 🏗️ アーキテクチャ

### プロジェクト構造

```
GardenApp/
├── app/                    # ページ (Expo Router を使用したファイルベースのルーティング)
│   ├── (tabs)/            # タブナビゲーション
│   │   ├── index.tsx      # メインダッシュボード
│   │   ├── explore.tsx    # 履歴とチャート
│   │   └── settings.tsx   # 設定と BLE スキャン
│   ├── bluetooth-onboarding.tsx  # 接続チュートリアル
│   └── _layout.tsx        # ルートレイアウト
├── components/            # 再利用可能なコンポーネント
│   └── PlantHealthCard.tsx # 指標カード
├── constants/             # 設定とテーマ
├── db/                    # SQLite データベース
│   └── index.ts          # 設定とシード
└── assets/               # 画像とリソース
```

### 使用技術

- **フレームワーク**: Expo SDK 54 を使用した React Native
- **ナビゲーション**: Expo Router (ファイルベースのルーティング)
- **データベース**: expo-sqlite を使用した SQLite
- **Bluetooth**: BLE 通信用の react-native-ble-plx
- **UI/UX**: アニメーション用の React Native Reanimated
- **スタイリング**: LinearGradient と Material Icons を使用した StyleSheet
- **型付け**: TypeScript
- **フォント**: Google Fonts (Inter, Manrope)

### データベース

アプリケーションは以下のテーブルを持つ SQLite をローカルストレージに使用します：

- **sensors**: 接続デバイスの情報
- **metrics**: 環境指標 (水分、温度など)
- **history**: イベントとアクションの記録

初回使用時にデータはサンプル値で初期化されます。

## 🔧 開発

### 利用可能なコマンド

```bash
npm start          # 開発サーバーを起動
npm run android    # Android で実行
npm run ios        # iOS で実行
npm run web        # ブラウザで実行
npm run lint       # ESLint を実行
```

### Bluetooth 設定

アプリケーションは動作するために Bluetooth 権限が必要です。Android では権限が自動的に要求されます。iOS の場合は `app.json` で権限が設定されていることを確認してください。

### テーマと色

色は Material Design 3 のガイドラインに従って `constants/theme.ts` で定義されています。

## 📚 追加リソース

- [Expo ドキュメント](https://docs.expo.dev/)
- [React Native BLE PLX](https://github.com/dotintent/react-native-ble-plx)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

## 🤝 貢献

貢献を歓迎します。大きな変更についてはまず issue を開いてください。

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下にあります。