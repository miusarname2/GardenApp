import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { EditableWidget, WidgetBounds } from '@/components/EditableWidget';
import { PlantHealthCard } from '@/components/PlantHealthCard';
import { DashboardMetricCard } from '@/components/DashboardMetricCard';
import { WidgetActionSheet } from '@/components/WidgetActionSheet';
import { EcoColors } from '@/constants/theme';
import { getDb } from '@/db';
import { useSensorContext } from '@/contexts/sensor-context';
import { useWidgetPreferences, WidgetItem } from '@/contexts/widget-preferences-context';

interface HistoryEntry {
  id: number;
  action: string;
  created_at: string;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { metrics, connectionStatus, allSensors, activeSensorId } = useSensorContext();
  const { preferences, savePreferences } = useWidgetPreferences();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [growthIndex, setGrowthIndex] = useState(0);
  const [positionVersion, setPositionVersion] = useState(0);
  const [widgets, setWidgets] = useState(preferences.dashboardWidgets);
  const [isWidgetSheetOpen, setIsWidgetSheetOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const widgetBounds = useRef<Record<string, WidgetBounds>>({});
  const lastDropTarget = useRef<string | null>(null);
  const widgetsRef = useRef(preferences.dashboardWidgets);

  useEffect(() => {
    widgetsRef.current = preferences.dashboardWidgets;
    setWidgets(preferences.dashboardWidgets);
  }, [preferences.dashboardWidgets]);

  const persistWidgets = async (nextWidgets: WidgetItem[]) => {
    try {
      await savePreferences({ ...preferences, dashboardWidgets: nextWidgets });
    } catch (error) {
      console.warn('[Dashboard] Failed to save widgets:', error);
      Alert.alert('No se guardaron los widgets', 'Revisa el almacenamiento del dispositivo e inténtalo de nuevo.');
    }
  };

  const handleWidgetDrag = (id: string, x: number, y: number) => {
    const enabledIds = new Set(widgetsRef.current.filter((widget) => widget.enabled).map((widget) => widget.id));
    const target = Object.entries(widgetBounds.current).find(([targetId, bounds]) =>
      targetId !== id &&
      enabledIds.has(targetId) &&
      x >= bounds.x + bounds.width * 0.25 &&
      x <= bounds.x + bounds.width * 0.75 &&
      y >= bounds.y + bounds.height * 0.25 &&
      y <= bounds.y + bounds.height * 0.75,
    );
    if (!target || lastDropTarget.current === target[0]) return null;

    const sourceIndex = widgetsRef.current.findIndex((widget) => widget.id === id);
    const targetIndex = widgetsRef.current.findIndex((widget) => widget.id === target[0]);
    if (sourceIndex < 0 || targetIndex < 0) return null;
    const sourceBounds = widgetBounds.current[id];
    const targetBounds = widgetBounds.current[target[0]];
    if (!sourceBounds || !targetBounds) return null;
    lastDropTarget.current = target[0];
    const next = [...widgetsRef.current];
    [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
    widgetBounds.current[id] = targetBounds;
    widgetBounds.current[target[0]] = sourceBounds;
    widgetsRef.current = next;
    setWidgets(next);
    return {
      layoutDeltaX: targetBounds.x + targetBounds.width / 2 - sourceBounds.x - sourceBounds.width / 2,
      layoutDeltaY: targetBounds.y + targetBounds.height / 2 - sourceBounds.y - sourceBounds.height / 2,
    };
  };

  const updateWidget = (id: string, updates: Partial<WidgetItem>) => {
    const next = widgetsRef.current.map((widget) => (
      widget.id === id ? { ...widget, ...updates } : widget
    ));
    widgetsRef.current = next;
    setWidgets(next);
    void persistWidgets(next);
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const current = widgetsRef.current;
    const activeIndexes = current.flatMap((widget, index) => widget.enabled ? [index] : []);
    const currentPosition = activeIndexes.findIndex((index) => current[index].id === id);
    const targetPosition = currentPosition + (direction === 'up' ? -1 : 1);
    if (currentPosition < 0 || targetPosition < 0 || targetPosition >= activeIndexes.length) return;

    const next = [...current];
    const currentIndex = activeIndexes[currentPosition];
    const targetIndex = activeIndexes[targetPosition];
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    widgetsRef.current = next;
    setWidgets(next);
    void persistWidgets(next);
  };

  const addWidget = (id: string) => {
    const count = widgetsRef.current.filter((widget) => widget.enabled).length;
    if (count >= 8) {
      Alert.alert('Límite alcanzado', 'El Dashboard permite un máximo de 8 widgets.');
      return;
    }
    updateWidget(id, { enabled: true });
  };

  useEffect(() => {
    try {
      const db = getDb();
      setHistory(db.getAllSync<HistoryEntry>('SELECT id, action, created_at FROM history ORDER BY created_at DESC LIMIT 3'));
    } catch (error) {
      console.warn('Dashboard DB Error:', error);
    }
  }, []);

  useEffect(() => {
    try {
      const db = getDb();
      const activeSensor = allSensors.find((sensor) => sensor.deviceId === activeSensorId);
      const latestMetric = activeSensor?.sensorDbId != null
        ? db.getFirstSync<{ growth_index: number | null }>(
          'SELECT growth_index FROM metrics WHERE sensor_id = ? OR sensor_id IS NULL ORDER BY created_at DESC LIMIT 1',
          [activeSensor.sensorDbId],
        )
        : db.getFirstSync<{ growth_index: number | null }>(
          'SELECT growth_index FROM metrics WHERE sensor_id IS NULL ORDER BY created_at DESC LIMIT 1',
        );
      setGrowthIndex(latestMetric?.growth_index ?? 0);
    } catch (error) {
      console.warn('Dashboard growth index error:', error);
    }
  }, [metrics, allSensors, activeSensorId]);

  const metricValues = {
    hydration: metrics?.hydration ?? 68,
    light: metrics?.light ?? 1200,
    temp: metrics?.temp ?? 24,
    humidity: metrics?.humidity ?? 52,
    batPanel: metrics?.batPanel ?? 92,
    batSys: metrics?.batSys ?? 78,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
  };

  const renderWidget = (widget: WidgetItem) => {
    const metricCards: Record<string, React.ReactNode> = {
      hydration: (
        <DashboardMetricCard
          icon="water-drop"
          title={widget.title}
          value={`${metricValues.hydration}%`}
          color={EcoColors.primary}
          backgroundColor={EcoColors.surfaceContainerLow}
        />
      ),
      light: (
        <DashboardMetricCard
          icon="light-mode"
          title={widget.title}
          value={`${(metricValues.light / 1000).toFixed(1)}k`}
          detail="LUX • OPTIMAL"
          color={EcoColors.tertiary}
          backgroundColor={EcoColors.surfaceContainerHighest}
        />
      ),
      temperature: (
        <DashboardMetricCard
          icon="thermostat"
          title={widget.title}
          value={`${metricValues.temp}°C`}
          color={EcoColors.error}
          backgroundColor={EcoColors.surfaceContainerHigh}
        />
      ),
      humidity: (
        <DashboardMetricCard
          icon="waves"
          title={widget.title}
          value={`${metricValues.humidity}%`}
          color={EcoColors.secondary}
          backgroundColor={EcoColors.surfaceContainer}
        />
      ),
      panelBattery: (
        <DashboardMetricCard
          icon="solar-power"
          title={widget.title}
          value={`${metricValues.batPanel}%`}
          color={EcoColors.primary}
          backgroundColor={EcoColors.surfaceContainerLow}
        />
      ),
      systemBattery: (
        <DashboardMetricCard
          icon="battery-full"
          title={widget.title}
          value={`${metricValues.batSys}%`}
          color={EcoColors.tertiary}
          backgroundColor={EcoColors.surfaceContainerHighest}
        />
      ),
    };

    let content: React.ReactNode;
    if (widget.id === 'plant') {
      content = (
        <PlantHealthCard
          plantName={preferences.plantName}
          plantSpecies={preferences.plantSpecies}
          plantImage={preferences.plantImage}
          widgetTitle={widget.title}
          compact={widget.size === 'small'}
        />
      );
    } else if (metricCards[widget.id]) {
      content = metricCards[widget.id];
    } else if (widget.id === 'growthSnapshot') {
      content = (
        <DashboardMetricCard
          icon="trending-up"
          title={widget.title}
          value={`${growthIndex.toFixed(1)}%`}
          detail="Último registro"
          color={EcoColors.primary}
          backgroundColor="#e9f0e1"
        />
      );
    } else if (widget.id === 'environment') {
      content = (
        <DashboardMetricCard
          icon="air"
          title={widget.title}
          value={`${metricValues.temp}°C`}
          detail={`Humedad ${metricValues.humidity}%`}
          color={EcoColors.secondary}
          backgroundColor="#e5efeb"
        />
      );
    } else if (widget.id === 'careTip') {
      content = (
        <View style={[styles.tipCard, widget.size === 'small' && styles.compactTipCard]}>
          <MaterialIcons name="lightbulb" size={24} color={EcoColors.primary} />
          <View style={styles.tipContent}>
            <ThemedText style={styles.tipTitle}>{widget.title}</ThemedText>
            <ThemedText style={styles.tipDescription}>
              {metricValues.hydration < 40
                ? 'La hidratación está baja; revisa la humedad del sustrato.'
                : 'La hidratación se ve bien. Mantén el seguimiento regular de tu planta.'}
            </ThemedText>
          </View>
        </View>
      );
    } else if (widget.id === 'recentGrowth') {
      content = (
        <View style={[styles.timelineSection, widget.size === 'small' && styles.compactTimelineSection]}>
          <ThemedText style={[styles.timelineTitle, widget.size === 'small' && styles.compactTimelineTitle]}>{widget.title}</ThemedText>
          {history.length === 0 ? (
            <ThemedText style={styles.emptyHistory}>Aún no hay eventos registrados.</ThemedText>
          ) : (
            <View style={styles.timelineWrapper}>
              <View style={styles.timelineTrack} />
              {history.map((item, index) => (
                <View key={item.id} style={styles.timelineNode}>
                  <View style={[styles.nodeDot, index === 2 && styles.lastNodeDot]} />
                  <View style={[styles.nodeContent, index === 2 && styles.lastNodeContent]}>
                    <ThemedText style={styles.nodeDate}>{formatDate(item.created_at)}</ThemedText>
                    <ThemedText style={styles.nodeAction}>{item.action}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    } else {
      return null;
    }

    return (
      <EditableWidget
        key={widget.id}
        widget={widget}
        positionVersion={positionVersion}
        style={[styles.widget, widget.size === 'large' ? styles.fullWidth : styles.halfWidth]}
        onPosition={(id, bounds) => { widgetBounds.current[id] = bounds; }}
        onDrag={handleWidgetDrag}
        onLongPress={(selected) => {
          setSelectedWidgetId(selected.id);
          setIsWidgetSheetOpen(true);
        }}
        onDragEnd={() => {
          lastDropTarget.current = null;
          void persistWidgets(widgetsRef.current);
        }}
      >
        {content}
      </EditableWidget>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="local-florist" size={24} color={EcoColors.primary} />
            <ThemedText style={styles.headerTitle}>Digital Garden</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setSelectedWidgetId(null);
                setIsWidgetSheetOpen(true);
              }}
              accessibilityLabel="Añadir widgets al Dashboard"
            >
              <MaterialIcons name="edit" size={22} color={EcoColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')} accessibilityLabel="Conectar sensores">
              <MaterialIcons name={connectionStatus === 'connected' ? 'bluetooth-connected' : 'bluetooth-disabled'} size={22} color={connectionStatus === 'connected' ? EcoColors.primary : EcoColors.outline} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={100}
        onScrollEndDrag={() => setPositionVersion((version) => version + 1)}
        onMomentumScrollEnd={() => setPositionVersion((version) => version + 1)}
      >
        <View style={styles.widgetsContainer}>
          {widgets
            .filter((widget) => widget.enabled)
            .map(renderWidget)}
        </View>
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 90 }]}
        accessibilityLabel="Regar ahora"
      >
        <LinearGradient
          colors={[EcoColors.primary, '#3a7b3a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialIcons name="water-drop" size={20} color="white" />
          <ThemedText style={styles.fabText}>Water Now</ThemedText>
        </LinearGradient>
      </TouchableOpacity>
      <WidgetActionSheet
        visible={isWidgetSheetOpen}
        selectedWidget={widgets.find((widget) => widget.id === selectedWidgetId) ?? null}
        activeWidgets={widgets.filter((widget) => widget.enabled)}
        availableWidgets={widgets.filter((widget) => !widget.enabled)}
        activeWidgetCount={widgets.filter((widget) => widget.enabled).length}
        maxWidgets={8}
        onClose={() => setIsWidgetSheetOpen(false)}
        onAdd={addWidget}
        onMove={moveWidget}
        onToggleSize={(id) => {
          const widget = widgetsRef.current.find((item) => item.id === id);
          if (widget) updateWidget(id, { size: widget.size === 'large' ? 'small' : 'large' });
        }}
        onRemove={(id) => updateWidget(id, { enabled: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.background,
  },
  topBar: {
    backgroundColor: '#eff6e7',
    zIndex: 10,
  },
  headerContent: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    color: EcoColors.primary,
    letterSpacing: -1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(112, 122, 108, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 160,
  },
  widgetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  widget: {
    marginBottom: 8,
  },
  fullWidth: {
    width: '100%',
  },
  tipCard: {
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#eff6e7',
  },
  compactTipCard: {
    minHeight: 110,
    padding: 12,
    gap: 8,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: '#171d14',
    marginBottom: 6,
  },
  tipDescription: {
    color: '#40493d',
    fontSize: 13,
    lineHeight: 19,
  },
  timelineSection: {
    marginTop: 24,
    paddingHorizontal: 8,
  },
  compactTimelineSection: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  timelineTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: '#171d14',
    marginBottom: 24,
  },
  compactTimelineTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  timelineWrapper: {
    paddingLeft: 24,
    position: 'relative',
  },
  timelineTrack: {
    position: 'absolute',
    left: 3,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: EcoColors.outlineVariant,
    opacity: 0.3,
  },
  timelineNode: {
    position: 'relative',
    marginBottom: 32,
  },
  nodeDot: {
    position: 'absolute',
    left: -27,
    top: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: EcoColors.primary,
    borderWidth: 3,
    borderColor: EcoColors.background,
  },
  lastNodeDot: {
    backgroundColor: EcoColors.outlineVariant,
    opacity: 0.6,
  },
  nodeContent: {
    flex: 1,
  },
  lastNodeContent: {
    opacity: 0.6,
  },
  nodeDate: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#707a6c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nodeAction: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#171d14',
  },
  emptyHistory: {
    color: '#707a6c',
    marginBottom: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    zIndex: 50,
    borderRadius: 24,
    shadowColor: '#206223',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    height: 60,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fabText: {
    color: 'white',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
