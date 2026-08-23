import { BleManager } from 'react-native-ble-plx';

/**
 * Singleton instance of BleManager to be shared across the entire app.
 * Creating multiple instances of BleManager can cause native crashes and 
 * permission issues, especially on Android.
 */
export const bleManager = new BleManager();

// ─────────────────────────────────────────────────────────
// BLE Service & Characteristic UUIDs
// ─────────────────────────────────────────────────────────
// These UUIDs must match the firmware on the garden sensor.
// The sensor exposes one primary service with two characteristics:

/** Primary BLE Service exposed by the garden sensor */
export const SENSOR_SERVICE_UUID = '0000FE00-0000-1000-8000-00805F9B34FB';

/**
 * READ / NOTIFY characteristic.
 * The sensor pushes a JSON-encoded string with the following schema:
 *
 * ```json
 * {
 *   "hydration": 72,          // int   — Soil moisture percentage (0-100)
 *   "exposure": 6.5,          // float — Daily sunlight hours (0-24)
 *   "temperature": 24.3,      // float — Ambient temperature in °C
 *   "humidity": 55,            // int   — Relative humidity percentage (0-100)
 *   "battery_panel": 88,      // int   — Solar panel battery level (0-100)
 *   "battery_system": 76      // int   — System battery level (0-100)
 * }
 * ```
 */
export const SENSOR_METRICS_CHARACTERISTIC_UUID = '0000FE01-0000-1000-8000-00805F9B34FB';

/** WRITE characteristic — for sending commands to the sensor (future use) */
export const SENSOR_COMMAND_CHARACTERISTIC_UUID = '0000FE02-0000-1000-8000-00805F9B34FB';

// ─────────────────────────────────────────────────────────
// AsyncStorage Keys
// ─────────────────────────────────────────────────────────

/** When 'true', the app ignores BLE and reads from SQLite seed/mock data */
export const STORAGE_KEY_USE_MOCK_DATA = 'USE_MOCK_DATA';

/** Stores the BLE device ID of the last successfully connected sensor */
export const STORAGE_KEY_CONNECTED_DEVICE_ID = 'CONNECTED_DEVICE_ID';

/** Stores the human-readable name of the connected sensor */
export const STORAGE_KEY_CONNECTED_DEVICE_NAME = 'CONNECTED_DEVICE_NAME';

// ─────────────────────────────────────────────────────────
// TypeScript Interfaces
// ─────────────────────────────────────────────────────────

/**
 * Raw payload received from the BLE sensor via the metrics characteristic.
 * Field names match the SQLite `metrics` table columns exactly.
 */
export interface BleRawSensorData {
  hydration: number;
  exposure: number;
  temperature: number;
  humidity: number;
  battery_panel: number;
  battery_system: number;
}

/**
 * Transformed metrics used by UI components (PlantHealthCard, Dashboard, etc.).
 * This is the contract that components consume — do NOT change field names.
 */
export interface SensorMetrics {
  hydration: number;   // 0-100 percentage
  light: number;       // lux (exposure * 300)
  temp: number;        // °C
  humidity: number;    // 0-100 percentage
  batPanel: number;    // 0-100 percentage
  batSys: number;      // 0-100 percentage
}

/**
 * Converts raw BLE data to the UI-ready SensorMetrics format.
 * This mapping is the single source of truth for the transformation.
 */
export function mapRawToMetrics(raw: BleRawSensorData): SensorMetrics {
  return {
    hydration: Math.round(raw.hydration),
    light: raw.exposure * 300,
    temp: Number(raw.temperature.toFixed(1)),
    humidity: Math.round(raw.humidity),
    batPanel: Math.round(raw.battery_panel),
    batSys: Math.round(raw.battery_system),
  };
}
