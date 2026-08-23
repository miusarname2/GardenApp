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
  STORAGE_KEY_CONNECTED_SENSORS,
  STORAGE_KEY_ACTIVE_SENSOR_ID,
  // Legacy keys for migration
  STORAGE_KEY_CONNECTED_DEVICE_ID,
  STORAGE_KEY_CONNECTED_DEVICE_NAME,
  BleRawSensorData,
  SensorMetrics,
  ConnectionStatus,
  SavedSensorInfo,
  ConnectedSensor,
  mapRawToMetrics,
} from '@/constants/ble';
import { getDb } from '@/db';

// ─────────────────────────────────────────────────────────
// Public Result Type
// ─────────────────────────────────────────────────────────

export interface UseSensorDataResult {
  // ── Legacy single-sensor API (retrocompat) ──────────
  // These always point to the ACTIVE sensor.

  /** Current metrics of the active sensor */
  metrics: SensorMetrics | null;
  /** Connection status of the active sensor */
  connectionStatus: ConnectionStatus;
  /** Whether the data source is mock / SQLite fallback */
  isMockData: boolean;
  /** Human-readable error from the active sensor */
  error: string | null;
  /** Name of the active sensor */
  deviceName: string | null;
  /** Reconnect all saved sensors */
  reconnect: () => Promise<void>;
  /** Switch between mock and real mode */
  setMockMode: (useMock: boolean) => Promise<void>;

  // ── Multi-sensor API (new) ──────────────────────────

  /** All connected/saved sensors with their individual state */
  allSensors: ConnectedSensor[];
  /** Device ID of the currently active sensor (shown in Dashboard) */
  activeSensorId: string | null;
  /** Change which sensor is shown in Dashboard */
  setActiveSensor: (deviceId: string) => Promise<void>;
  /** Add and connect a new sensor */
  addSensor: (deviceId: string, name: string) => Promise<void>;
  /** Disconnect and remove a sensor */
  removeSensor: (deviceId: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────
// Internal Types
// ─────────────────────────────────────────────────────────

interface SensorConnection {
  device: Device | null;
  subscription: Subscription | null;
  metrics: SensorMetrics | null;
  status: ConnectionStatus;
  error: string | null;
  sensorDbId: number | null;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Read the latest metrics from SQLite, optionally filtered by sensor_id. */
function readMetricsFromDb(sensorDbId?: number | null): SensorMetrics | null {
  try {
    const db = getDb();
    let row: any;
    if (sensorDbId != null) {
      row = db.getFirstSync<any>(
        'SELECT * FROM metrics WHERE sensor_id = ? ORDER BY created_at DESC LIMIT 1',
        [sensorDbId],
      );
    }
    // Fallback: try without sensor_id filter (for legacy/mock data with NULL sensor_id)
    if (!row) {
      row = db.getFirstSync<any>(
        'SELECT * FROM metrics ORDER BY created_at DESC LIMIT 1',
      );
    }
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

/** Persist a BLE reading into SQLite with sensor_id. */
function persistMetricsToDb(raw: BleRawSensorData, sensorDbId: number | null): void {
  try {
    const db = getDb();
    db.runSync(
      `INSERT INTO metrics (sensor_id, hydration, exposure, growth_index, temperature, humidity, battery_panel, battery_system, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sensorDbId,
        Math.round(raw.hydration),
        Number(raw.exposure.toFixed(1)),
        0,
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

/** Register or find a sensor in the SQLite `sensors` table. Returns the DB id. */
function ensureSensorInDb(deviceId: string, name: string): number | null {
  try {
    const db = getDb();
    // Try to find existing
    const existing = db.getFirstSync<any>(
      'SELECT id FROM sensors WHERE mac_address = ?',
      [deviceId],
    );
    if (existing) return existing.id;

    // Insert new
    const result = db.runSync(
      'INSERT INTO sensors (name, mac_address) VALUES (?, ?)',
      [name, deviceId],
    );
    return result.lastInsertRowId ?? null;
  } catch (err) {
    console.warn('[useSensorData] Failed to register sensor in DB:', err);
    return null;
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

/** Parse base64 BLE characteristic value into BleRawSensorData. */
function parseBleValue(base64Value: string | null): BleRawSensorData | null {
  if (!base64Value) return null;
  try {
    const decoded = globalThis.atob(base64Value);
    const data = JSON.parse(decoded) as BleRawSensorData;

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

// ── AsyncStorage persistence ─────────────────────────

async function loadSavedSensors(): Promise<SavedSensorInfo[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_CONNECTED_SENSORS);
    if (json) return JSON.parse(json) as SavedSensorInfo[];
  } catch { /* ignore */ }
  return [];
}

async function saveSensors(sensors: SavedSensorInfo[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_CONNECTED_SENSORS, JSON.stringify(sensors));
}

/** Migrate from legacy single-sensor keys to multi-sensor format. */
async function migrateLegacyKeys(): Promise<SavedSensorInfo | null> {
  try {
    const legacyId = await AsyncStorage.getItem(STORAGE_KEY_CONNECTED_DEVICE_ID);
    const legacyName = await AsyncStorage.getItem(STORAGE_KEY_CONNECTED_DEVICE_NAME);

    if (!legacyId) return null;

    const migrated: SavedSensorInfo = {
      deviceId: legacyId,
      name: legacyName || 'Sensor (migrado)',
      sensorDbId: null,
    };

    // Clean up legacy keys
    await AsyncStorage.multiRemove([
      STORAGE_KEY_CONNECTED_DEVICE_ID,
      STORAGE_KEY_CONNECTED_DEVICE_NAME,
    ]);

    console.log('[useSensorData] Migrated legacy sensor:', migrated);
    return migrated;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export function useSensorData(): UseSensorDataResult {
  const [sensors, setSensors] = useState<Map<string, SensorConnection>>(new Map());
  const [savedSensors, setSavedSensors] = useState<SavedSensorInfo[]>([]);
  const [activeSensorId, setActiveSensorIdState] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(true);

  const connectionsRef = useRef<Map<string, SensorConnection>>(new Map());
  const isMountedRef = useRef(true);

  // ── Utility: update a single sensor's state ────────
  const updateSensor = useCallback((deviceId: string, update: Partial<SensorConnection>) => {
    if (!isMountedRef.current) return;

    connectionsRef.current.set(deviceId, {
      ...(connectionsRef.current.get(deviceId) || {
        device: null,
        subscription: null,
        metrics: null,
        status: 'disconnected' as ConnectionStatus,
        error: null,
        sensorDbId: null,
      }),
      ...update,
    });

    // Trigger React re-render with a new Map instance
    setSensors(new Map(connectionsRef.current));
  }, []);

  // ── Connect to a single BLE sensor ─────────────────
  const connectSingle = useCallback(async (info: SavedSensorInfo): Promise<void> => {
    if (!isMountedRef.current) return;

    const { deviceId, name } = info;
    let sensorDbId = info.sensorDbId;

    // Register in SQLite if not already
    if (sensorDbId == null) {
      sensorDbId = ensureSensorInDb(deviceId, name);
      // Update saved info with DB id
      if (sensorDbId != null) {
        info.sensorDbId = sensorDbId;
      }
    }

    updateSensor(deviceId, {
      status: 'connecting',
      error: null,
      sensorDbId,
    });

    try {
      const hasPerms = await requestBlePermissions();
      if (!hasPerms) throw new Error('Permisos de Bluetooth denegados');

      // Check if already connected
      const isConnected = await bleManager.isDeviceConnected(deviceId);
      let device: Device;

      if (isConnected) {
        const devices = await bleManager.devices([deviceId]);
        device = devices[0];
      } else {
        device = await bleManager.connectToDevice(deviceId, { requestMTU: 256 });
      }

      await device.discoverAllServicesAndCharacteristics();

      // Clean up previous subscription for this sensor
      const prev = connectionsRef.current.get(deviceId);
      if (prev?.subscription) {
        prev.subscription.remove();
      }

      // Subscribe to NOTIFY
      const subscription = device.monitorCharacteristicForService(
        SENSOR_SERVICE_UUID,
        SENSOR_METRICS_CHARACTERISTIC_UUID,
        (err, characteristic) => {
          if (err) {
            console.warn(`[Sensor ${name}] Monitor error:`, err.message);
            if (err.message?.includes('disconnected') || err.errorCode === 205) {
              if (isMountedRef.current) {
                const fallback = readMetricsFromDb(sensorDbId);
                updateSensor(deviceId, {
                  status: 'disconnected',
                  error: 'Sensor desconectado.',
                  metrics: fallback,
                  subscription: null,
                });
              }
            }
            return;
          }

          if (characteristic?.value && isMountedRef.current) {
            const raw = parseBleValue(characteristic.value);
            if (raw) {
              const transformed = mapRawToMetrics(raw);
              updateSensor(deviceId, { metrics: transformed });
              setIsMockData(false);
              persistMetricsToDb(raw, sensorDbId);
            }
          }
        },
      );

      // Initial read attempt
      try {
        const initialRead = await device.readCharacteristicForService(
          SENSOR_SERVICE_UUID,
          SENSOR_METRICS_CHARACTERISTIC_UUID,
        );
        if (initialRead?.value) {
          const raw = parseBleValue(initialRead.value);
          if (raw) {
            const transformed = mapRawToMetrics(raw);
            updateSensor(deviceId, { metrics: transformed });
            setIsMockData(false);
            persistMetricsToDb(raw, sensorDbId);
          }
        }
      } catch {
        console.log(`[Sensor ${name}] Initial read skipped (notify-only)`);
      }

      if (isMountedRef.current) {
        updateSensor(deviceId, {
          device,
          subscription,
          status: 'connected',
          error: null,
          sensorDbId,
        });
      }

      // Listen for unexpected disconnection
      bleManager.onDeviceDisconnected(deviceId, () => {
        if (isMountedRef.current) {
          const conn = connectionsRef.current.get(deviceId);
          if (conn?.subscription) conn.subscription.remove();
          const fallback = readMetricsFromDb(sensorDbId);
          updateSensor(deviceId, {
            device: null,
            subscription: null,
            status: 'disconnected',
            error: 'Sensor desconectado inesperadamente.',
            metrics: fallback,
          });
        }
      });

    } catch (err: any) {
      console.warn(`[Sensor ${name}] Connection failed:`, err);
      if (isMountedRef.current) {
        const fallback = readMetricsFromDb(sensorDbId);
        updateSensor(deviceId, {
          status: 'error',
          error: err?.message || 'Error al conectar',
          metrics: fallback,
          sensorDbId,
        });
      }
    }
  }, [updateSensor]);

  // ── Load mock data ─────────────────────────────────
  const loadMockData = useCallback(() => {
    setIsMockData(true);
    // Set all sensors to mock mode
    connectionsRef.current.forEach((conn, deviceId) => {
      const fallback = readMetricsFromDb(conn.sensorDbId);
      updateSensor(deviceId, {
        status: 'mock_mode',
        error: null,
        metrics: fallback,
      });
    });
    // If no sensors exist at all, nothing to update — Dashboard will use PlantHealthCard's internal fallback
    setSensors(new Map(connectionsRef.current));
  }, [updateSensor]);

  // ── Initialize: load saved sensors + migrate legacy ──
  useEffect(() => {
    isMountedRef.current = true;

    (async () => {
      try {
        const useMock = await AsyncStorage.getItem(STORAGE_KEY_USE_MOCK_DATA);

        // 1. Load saved sensors (or migrate from legacy)
        let saved = await loadSavedSensors();

        if (saved.length === 0) {
          const migrated = await migrateLegacyKeys();
          if (migrated) {
            saved = [migrated];
            await saveSensors(saved);
          }
        }

        setSavedSensors(saved);

        // 2. Load active sensor ID
        let activeId = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_SENSOR_ID);
        if (!activeId && saved.length > 0) {
          activeId = saved[0].deviceId;
          await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SENSOR_ID, activeId);
        }
        setActiveSensorIdState(activeId);

        // 3. Initialize connection map with saved sensors (disconnected state)
        saved.forEach((s) => {
          const dbId = s.sensorDbId ?? ensureSensorInDb(s.deviceId, s.name);
          s.sensorDbId = dbId;
          connectionsRef.current.set(s.deviceId, {
            device: null,
            subscription: null,
            metrics: readMetricsFromDb(dbId),
            status: 'disconnected',
            error: null,
            sensorDbId: dbId,
          });
        });
        setSensors(new Map(connectionsRef.current));

        // 4. If mock mode, don't connect BLE
        if (useMock !== 'false') {
          saved.forEach((s) => {
            updateSensor(s.deviceId, { status: 'mock_mode' });
          });
          setIsMockData(true);
          return;
        }

        // 5. Connect all saved sensors
        setIsMockData(false);
        await Promise.allSettled(saved.map((s) => connectSingle(s)));

        // Persist any sensorDbId updates from registration
        await saveSensors(saved);
      } catch (err) {
        console.warn('[useSensorData] Init error:', err);
        setIsMockData(true);
      }
    })();

    return () => {
      isMountedRef.current = false;
      // Cleanup all subscriptions
      connectionsRef.current.forEach((conn) => {
        if (conn.subscription) conn.subscription.remove();
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public: set active sensor ──────────────────────
  const setActiveSensor = useCallback(async (deviceId: string) => {
    setActiveSensorIdState(deviceId);
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SENSOR_ID, deviceId);
  }, []);

  // ── Public: add a new sensor ───────────────────────
  const addSensor = useCallback(async (deviceId: string, name: string) => {
    const sensorDbId = ensureSensorInDb(deviceId, name);
    const newInfo: SavedSensorInfo = { deviceId, name, sensorDbId };

    // Add to saved list (avoid duplicates)
    const updated = [...savedSensors.filter((s) => s.deviceId !== deviceId), newInfo];
    setSavedSensors(updated);
    await saveSensors(updated);

    // If this is the first sensor, make it active
    if (updated.length === 1 || !activeSensorId) {
      await setActiveSensor(deviceId);
    }

    // Disable mock mode
    await AsyncStorage.setItem(STORAGE_KEY_USE_MOCK_DATA, 'false');
    setIsMockData(false);

    // Connect
    await connectSingle(newInfo);
  }, [savedSensors, activeSensorId, connectSingle, setActiveSensor]);

  // ── Public: remove a sensor ────────────────────────
  const removeSensor = useCallback(async (deviceId: string) => {
    // Disconnect BLE
    const conn = connectionsRef.current.get(deviceId);
    if (conn?.subscription) conn.subscription.remove();
    if (conn?.device) {
      try { await bleManager.cancelDeviceConnection(deviceId); } catch { /* ignore */ }
    }
    connectionsRef.current.delete(deviceId);
    setSensors(new Map(connectionsRef.current));

    // Remove from saved list
    const updated = savedSensors.filter((s) => s.deviceId !== deviceId);
    setSavedSensors(updated);
    await saveSensors(updated);

    // If we removed the active sensor, switch to the first remaining (or null)
    if (activeSensorId === deviceId) {
      const newActive = updated.length > 0 ? updated[0].deviceId : null;
      setActiveSensorIdState(newActive);
      if (newActive) {
        await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SENSOR_ID, newActive);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_SENSOR_ID);
      }
    }

    // If no sensors left, switch to mock mode
    if (updated.length === 0) {
      await AsyncStorage.setItem(STORAGE_KEY_USE_MOCK_DATA, 'true');
      setIsMockData(true);
    }
  }, [savedSensors, activeSensorId]);

  // ── Public: reconnect all ──────────────────────────
  const reconnect = useCallback(async () => {
    // Cleanup all existing subscriptions
    connectionsRef.current.forEach((conn) => {
      if (conn.subscription) conn.subscription.remove();
    });

    // Reconnect all saved sensors
    await Promise.allSettled(savedSensors.map((s) => connectSingle(s)));
  }, [savedSensors, connectSingle]);

  // ── Public: toggle mock mode ───────────────────────
  const setMockMode = useCallback(async (useMock: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEY_USE_MOCK_DATA, useMock ? 'true' : 'false');

    if (useMock) {
      // Disconnect all BLE
      connectionsRef.current.forEach((conn, deviceId) => {
        if (conn.subscription) conn.subscription.remove();
        if (conn.device) {
          bleManager.cancelDeviceConnection(deviceId).catch(() => { /* ignore */ });
        }
      });
      loadMockData();
    } else {
      setIsMockData(false);
      await Promise.allSettled(savedSensors.map((s) => connectSingle(s)));
    }
  }, [loadMockData, savedSensors, connectSingle]);

  // ── Derive active sensor state (retrocompat API) ───
  const activeConn = activeSensorId ? sensors.get(activeSensorId) : undefined;

  // Derive overall connection status
  let overallStatus: ConnectionStatus = 'disconnected';
  if (isMockData) {
    overallStatus = 'mock_mode';
  } else if (activeConn) {
    overallStatus = activeConn.status;
  } else if (sensors.size === 0) {
    overallStatus = 'disconnected';
  }

  // Find active sensor name
  const activeSaved = savedSensors.find((s) => s.deviceId === activeSensorId);

  // Build allSensors array
  const allSensors: ConnectedSensor[] = savedSensors.map((saved) => {
    const conn = sensors.get(saved.deviceId);
    return {
      deviceId: saved.deviceId,
      name: saved.name,
      sensorDbId: saved.sensorDbId,
      status: isMockData ? 'mock_mode' : (conn?.status ?? 'disconnected'),
      metrics: conn?.metrics ?? null,
      error: conn?.error ?? null,
    };
  });

  return {
    // Legacy single-sensor API (points to active sensor)
    metrics: activeConn?.metrics ?? null,
    connectionStatus: overallStatus,
    isMockData,
    error: activeConn?.error ?? null,
    deviceName: activeSaved?.name ?? null,
    reconnect,
    setMockMode,

    // Multi-sensor API
    allSensors,
    activeSensorId,
    setActiveSensor,
    addSensor,
    removeSensor,
  };
}
