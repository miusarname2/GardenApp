import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface WidgetItem {
  id: string;
  title: string;
  enabled: boolean;
}

export interface GardenPreferences {
  plantName: string;
  plantSpecies: string;
  plantImage: string;
  dashboardWidgets: WidgetItem[];
  historyWidgets: WidgetItem[];
}

const STORAGE_KEY = 'garden-widget-preferences-v1';

export const DEFAULT_PREFERENCES: GardenPreferences = {
  plantName: 'Fiddle Leaf Fig',
  plantSpecies: 'Ficus lyrata',
  plantImage: 'garden',
  dashboardWidgets: [
    { id: 'plant', title: 'Planta actual', enabled: true },
    { id: 'hydration', title: 'Hydration', enabled: true },
    { id: 'light', title: 'Light Level', enabled: true },
    { id: 'temperature', title: 'Temp', enabled: true },
    { id: 'humidity', title: 'Humidity', enabled: true },
    { id: 'panelBattery', title: 'Batería de Panel', enabled: true },
    { id: 'systemBattery', title: 'Batería de Sistema', enabled: true },
    { id: 'growthSnapshot', title: 'Growth Snapshot', enabled: true },
    { id: 'careTip', title: 'Plant Care Tip', enabled: true },
    { id: 'environment', title: 'Environment', enabled: true },
    { id: 'recentGrowth', title: 'Recent Growth', enabled: true },
  ],
  historyWidgets: [
    { id: 'plant', title: 'Planta activa', enabled: true },
    { id: 'growthChart', title: 'Growth Index', enabled: true },
    { id: 'growthIndex', title: 'Growth Summary', enabled: true },
    { id: 'summary', title: 'Resumen', enabled: true },
    { id: 'careTip', title: 'Plant Care Tip', enabled: true },
    { id: 'environment', title: 'Environment', enabled: true },
    { id: 'events', title: 'Historial de eventos', enabled: true },
  ],
};

function mergeWidgets(saved: unknown, defaults: WidgetItem[]): WidgetItem[] {
  const savedWidgets: unknown[] = Array.isArray(saved) ? saved : [];
  const merged = defaults.map((defaultWidget) => {
    const stored = savedWidgets.find(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && 'id' in item && item.id === defaultWidget.id,
    );
    return {
      ...defaultWidget,
      title: typeof stored?.title === 'string' ? stored.title : defaultWidget.title,
      enabled: typeof stored?.enabled === 'boolean' ? stored.enabled : defaultWidget.enabled,
    };
  });

  savedWidgets.forEach((item) => {
    if (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      typeof item.id === 'string' &&
      !defaults.some((widget) => widget.id === item.id)
    ) {
      const customWidget = item as Record<string, unknown>;
      if (typeof customWidget.title === 'string' && typeof customWidget.enabled === 'boolean') {
        merged.push({ id: item.id, title: customWidget.title, enabled: customWidget.enabled });
      }
    }
  });

  return merged.sort((first, second) => {
    const firstIndex = savedWidgets.findIndex(
      (item) => typeof item === 'object' && item !== null && 'id' in item && item.id === first.id,
    );
    const secondIndex = savedWidgets.findIndex(
      (item) => typeof item === 'object' && item !== null && 'id' in item && item.id === second.id,
    );
    if (firstIndex < 0 && secondIndex < 0) return 0;
    if (firstIndex < 0) return 1;
    if (secondIndex < 0) return -1;
    return firstIndex - secondIndex;
  });
}

function mergePreferences(saved: unknown): GardenPreferences {
  if (typeof saved !== 'object' || saved === null) return DEFAULT_PREFERENCES;
  const value = saved as Partial<GardenPreferences>;

  return {
    plantName: typeof value.plantName === 'string' ? value.plantName : DEFAULT_PREFERENCES.plantName,
    plantSpecies: typeof value.plantSpecies === 'string' ? value.plantSpecies : DEFAULT_PREFERENCES.plantSpecies,
    plantImage: typeof value.plantImage === 'string' ? value.plantImage : DEFAULT_PREFERENCES.plantImage,
    dashboardWidgets: mergeWidgets(value.dashboardWidgets, DEFAULT_PREFERENCES.dashboardWidgets),
    historyWidgets: mergeWidgets(value.historyWidgets, DEFAULT_PREFERENCES.historyWidgets),
  };
}

interface WidgetPreferencesContextValue {
  preferences: GardenPreferences;
  isLoaded: boolean;
  loadError: string | null;
  savePreferences: (preferences: GardenPreferences) => Promise<void>;
}

const WidgetPreferencesContext = createContext<WidgetPreferencesContextValue | null>(null);

export function WidgetPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && stored) setPreferences(mergePreferences(JSON.parse(stored)));
      } catch (error) {
        console.warn('[WidgetPreferences] Failed to load saved preferences:', error);
        if (active) setLoadError('No se pudieron cargar las preferencias guardadas.');
      } finally {
        if (active) setIsLoaded(true);
      }
    };

    void loadPreferences();
    return () => {
      active = false;
    };
  }, []);

  const savePreferences = useCallback(async (nextPreferences: GardenPreferences) => {
    const normalized = mergePreferences(nextPreferences);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setPreferences(normalized);
    setLoadError(null);
  }, []);

  const value = useMemo(
    () => ({ preferences, isLoaded, loadError, savePreferences }),
    [preferences, isLoaded, loadError, savePreferences],
  );

  return <WidgetPreferencesContext.Provider value={value}>{children}</WidgetPreferencesContext.Provider>;
}

export function useWidgetPreferences() {
  const context = useContext(WidgetPreferencesContext);
  if (!context) {
    throw new Error('useWidgetPreferences must be used within a WidgetPreferencesProvider.');
  }
  return context;
}
