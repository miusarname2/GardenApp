import React, { createContext, useContext } from 'react';
import { useSensorData, UseSensorDataResult } from '@/hooks/use-sensor-data';

// ─────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────

const SensorDataContext = createContext<UseSensorDataResult | null>(null);

// ─────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────

/**
 * Wraps the app with a single instance of useSensorData so all screens
 * share the same BLE connections and metrics state for all sensors.
 *
 * Place this in `_layout.tsx` around `<Stack>`.
 */
export function SensorDataProvider({ children }: { children: React.ReactNode }) {
  const sensorData = useSensorData();

  return (
    <SensorDataContext.Provider value={sensorData}>
      {children}
    </SensorDataContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────
// Consumer Hook
// ─────────────────────────────────────────────────────────

/**
 * Access sensor data from any component within the SensorDataProvider.
 *
 * ## Single-sensor (legacy) API:
 * ```tsx
 * const { metrics, connectionStatus, isMockData } = useSensorContext();
 * // → always points to the active sensor
 * ```
 *
 * ## Multi-sensor API:
 * ```tsx
 * const { allSensors, activeSensorId, setActiveSensor, addSensor, removeSensor } = useSensorContext();
 * // → manage multiple sensors
 * ```
 */
export function useSensorContext(): UseSensorDataResult {
  const ctx = useContext(SensorDataContext);
  if (!ctx) {
    throw new Error(
      'useSensorContext must be used within a <SensorDataProvider>. ' +
      'Make sure SensorDataProvider is in your _layout.tsx.',
    );
  }
  return ctx;
}
