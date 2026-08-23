import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { Device, Subscription } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoDevice from 'expo-device';

import {
  bleManager,
  SENSOR_SERVICE_UUID,
  SENSOR_METRICS_CHARACTERISTIC_UUID,
  STORAGE_KEY_USE_MOCK_DATA,
  STORAGE_KEY_CONNECTED_DEVICE_ID,
  STORAGE_KEY_CONNECTED_DEVICE_NAME,
  BleRawSensorData,
  SensorMetrics,
  mapRawToMetrics,
} from '@/constants/ble';
import { getDb } from '@/db';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'mock_mode'
  | 'error';

export interface UseSensorDataResult {
  /** Current metrics in the shape consumed by PlantHealthCard, Dashboard, etc. */
  metrics: SensorMetrics | null;
  /** BLE connection status */
  connectionStatus: ConnectionStatus;
  /** Whether the data source is mock / SQLite fallback */
  isMockData: boolean;
  /** Human-readable error message, if any */
  error: string | null;
  /** Name of the connected BLE device */
  deviceName: string | null;
  /** Attempt to reconnect to the last known device */
  reconnect: () => Promise<void>;
  /** Switch between mock and real mode */
  setMockMode: (useMock: boolean) => Promise<void>;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Read the latest metrics row from SQLite as a SensorMetrics object. */
function readMetricsFromDb(): SensorMetrics | null {
  try {
    const db = getDb();
    const row = db.getFirstSync<any>(
      'SELECT * FROM metrics ORDER BY created_at DESC LIMIT 1',
    );
    if (!row) return null;
    return {
      hydration: row.hydration,
      light: (row.exposure ?? 0) * 300,
      temp: row.temperature,
      humidity: row.humidity,
      batPanel: row.battery_panel,
      batSys: row.battery_system,
    };
  } catch {
    return null;
  }
}

/** Persist a BLE reading into the SQLite metrics table. */
function persistMetricsToDb(raw: BleRawSensorData): void {
  try {
    const db = getDb();
    db.runSync(
      `INSERT INTO metrics (hydration, exposure, growth_index, temperature, humidity, battery_panel, battery_system, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Math.round(raw.hydration),
        Number(raw.exposure.toFixed(1)),
        0, // growth_index — computed server-side or left at 0 for real data
        Number(raw.temperature.toFixed(1)),
        Math.round(raw.humidity),
        Math.round(raw.battery_panel),
        Math.round(raw.battery_system),
        new Date().toISOString(),
      ],
    );
  } catch (err) {
    console.warn('[useSensorData] Failed to persist metrics:', err);
  }
}

/** Request BLE-related permissions on Android. */
async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);

  return (
    results['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
    results['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
    results['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
  );
}

/**
 * Parse a base64-encoded BLE characteristic value into a BleRawSensorData object.
 * The sensor sends a JSON string; BLE-PLX returns it as a base64 string.
 */
function parseBleValue(base64Value: string | null): BleRawSensorData | null {
  if (!base64Value) return null;
  try {
    // Decode base64 → UTF-8 string → JSON parse
    const decoded = globalThis.atob(base64Value);
    const data = JSON.parse(decoded) as BleRawSensorData;

    // Basic sanity check
    if (
      typeof data.hydration !== 'number' ||
      typeof data.exposure !== 'number' ||
      typeof data.temperature !== 'number' ||
      typeof data.humidity !== 'number' ||
      typeof data.battery_panel !== 'number' ||
      typeof data.battery_system !== 'number'
    ) {
      console.warn('[useSensorData] Invalid sensor payload shape:', data);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[useSensorData] Failed to parse BLE value:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export function useSensorData(): UseSensorDataResult {
  const [metrics, setMetrics] = useState<SensorMetrics | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isMockData, setIsMockData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  const subscriptionRef = useRef<Subscription | null>(null);
  const connectedDeviceRef = useRef<Device | null>(null);
  const isMountedRef = useRef(true);

  // ── Load initial state ──────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    (async () => {
      try {
        const useMock = await AsyncStorage.getItem(STORAGE_KEY_USE_MOCK_DATA);
        const savedName = await AsyncStorage.getItem(STORAGE_KEY_CONNECTED_DEVICE_NAME);

        if (savedName) setDeviceName(savedName);

        // Default to mock mode if flag is not explicitly 'false'
        if (useMock !== 'false') {
          loadMockData();
          return;
        }

        // Try to connect to saved device
        await connectToSavedDevice();
      } catch {
        loadMockData();
      }
    })();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  // ── Mock data loader ────────────────────────────────
  const loadMockData = useCallback(() => {
    setIsMockData(true);
    setConnectionStatus('mock_mode');
    setError(null);
    const dbMetrics = readMetricsFromDb();
    setMetrics(dbMetrics);
  }, []);

  // ── Cleanup subscriptions ──────────────────────────
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  // ── Connect to a specific device ───────────────────
  const connectToDevice = useCallback(async (deviceId: string): Promise<void> => {
    if (!isMountedRef.current) return;

    setConnectionStatus('connecting');
    setError(null);

    try {
      const hasPerms = await requestBlePermissions();
      if (!hasPerms) {
        throw new Error('Permisos de Bluetooth denegados');
      }

      // Check if already connected
      const isConnected = await bleManager.isDeviceConnected(deviceId);
      let device: Device;

      if (isConnected) {
        device = await bleManager.devices([deviceId]).then(ds => ds[0]);
      } else {
        device = await bleManager.connectToDevice(deviceId, {
          requestMTU: 256,
        });
      }

      // Discover services & characteristics
      await device.discoverAllServicesAndCharacteristics();

      connectedDeviceRef.current = device;

      if (device.name) {
        setDeviceName(device.name);
        await AsyncStorage.setItem(STORAGE_KEY_CONNECTED_DEVICE_NAME, device.name);
      }

      // Subscribe to NOTIFY on the metrics characteristic
      cleanup();
      const subscription = device.monitorCharacteristicForService(
        SENSOR_SERVICE_UUID,
        SENSOR_METRICS_CHARACTERISTIC_UUID,
        (err, characteristic) => {
          if (err) {
            console.warn('[useSensorData] Monitor error:', err.message);
            // If disconnected, fall back
            if (err.message?.includes('disconnected') || err.errorCode === 205) {
              if (isMountedRef.current) {
                setConnectionStatus('disconnected');
                setError('Sensor desconectado. Usando último dato guardado.');
                // Keep last metrics visible, or load from DB
                const dbMetrics = readMetricsFromDb();
                if (dbMetrics) setMetrics(dbMetrics);
              }
            }
            return;
          }

          if (characteristic?.value && isMountedRef.current) {
            const raw = parseBleValue(characteristic.value);
            if (raw) {
              const transformed = mapRawToMetrics(raw);
              setMetrics(transformed);
              setIsMockData(false);
              persistMetricsToDb(raw);
            }
          }
        },
      );
      subscriptionRef.current = subscription;

      // Also do an initial read to get data immediately
      try {
        const initialRead = await device.readCharacteristicForService(
          SENSOR_SERVICE_UUID,
          SENSOR_METRICS_CHARACTERISTIC_UUID,
        );
        if (initialRead?.value) {
          const raw = parseBleValue(initialRead.value);
          if (raw) {
            const transformed = mapRawToMetrics(raw);
            setMetrics(transformed);
            setIsMockData(false);
            persistMetricsToDb(raw);
          }
        }
      } catch {
        // Initial read may fail if characteristic is notify-only; that's OK
        console.log('[useSensorData] Initial read skipped (notify-only)');
      }

      if (isMountedRef.current) {
        setConnectionStatus('connected');
        setIsMockData(false);
        setError(null);
      }

      // Listen for unexpected disconnection
      bleManager.onDeviceDisconnected(deviceId, (_err, _dev) => {
        if (isMountedRef.current) {
          setConnectionStatus('disconnected');
          setError('Sensor desconectado inesperadamente.');
          cleanup();
          // Fall back to last DB reading
          const dbMetrics = readMetricsFromDb();
          if (dbMetrics) setMetrics(dbMetrics);
        }
      });

    } catch (err: any) {
      console.warn('[useSensorData] Connection failed:', err);
      if (isMountedRef.current) {
        setConnectionStatus('error');
        setError(err?.message || 'Error al conectar con el sensor');
        // Fallback to SQLite
        const dbMetrics = readMetricsFromDb();
        if (dbMetrics) {
          setMetrics(dbMetrics);
          setIsMockData(true);
        }
      }
    }
  }, [cleanup]);

  // ── Connect to saved device from AsyncStorage ──────
  const connectToSavedDevice = useCallback(async () => {
    const savedDeviceId = await AsyncStorage.getItem(STORAGE_KEY_CONNECTED_DEVICE_ID);
    if (!savedDeviceId) {
      loadMockData();
      return;
    }
    await connectToDevice(savedDeviceId);
  }, [connectToDevice, loadMockData]);

  // ── Public: reconnect ──────────────────────────────
  const reconnect = useCallback(async () => {
    cleanup();
    await connectToSavedDevice();
  }, [cleanup, connectToSavedDevice]);

  // ── Public: toggle mock mode ───────────────────────
  const setMockMode = useCallback(async (useMock: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEY_USE_MOCK_DATA, useMock ? 'true' : 'false');

    if (useMock) {
      // Disconnect BLE and switch to mock
      cleanup();
      if (connectedDeviceRef.current) {
        try {
          await bleManager.cancelDeviceConnection(connectedDeviceRef.current.id);
        } catch {
          // ignore
        }
        connectedDeviceRef.current = null;
      }
      loadMockData();
    } else {
      // Try to connect to saved device
      await connectToSavedDevice();
    }
  }, [cleanup, loadMockData, connectToSavedDevice]);

  return {
    metrics,
    connectionStatus,
    isMockData,
    error,
    deviceName,
    reconnect,
    setMockMode,
  };
}
