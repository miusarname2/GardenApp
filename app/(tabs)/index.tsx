import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { EditableWidget, WidgetBounds } from '@/components/EditableWidget';
import { PlantHealthCard } from '@/components/PlantHealthCard';
import { DashboardMetricCard } from '@/components/DashboardMetricCard';
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingWidgets, setIsSavingWidgets] = useState(false);
  const [positionVersion, setPositionVersion] = useState(0);
  const [draftWidgets, setDraftWidgets] = useState(preferences.dashboardWidgets);
  const widgetBounds = useRef<Record<string, WidgetBounds>>({});
  const lastDropTarget = useRef<string | null>(null);

  const beginEditing = () => {
    setDraftWidgets(preferences.dashboardWidgets);
    setIsEditing(true);
  };

  const saveWidgetLayout = async () => {
    setIsSavingWidgets(true);
    try {
      await savePreferences({ ...preferences, dashboardWidgets: draftWidgets });
      setIsEditing(false);
    } catch (error) {
      console.warn('[Dashboard] Failed to save widget layout:', error);
      Alert.alert('No se guardó el diseño', 'Revisa el almacenamiento del dispositivo e inténtalo de nuevo.');
    } finally {
      setIsSavingWidgets(false);
    }
  };

  const handleWidgetDrag = (id: string, x: number, y: number) => {
    const enabledIds = new Set(draftWidgets.filter((widget) => widget.enabled).map((widget) => widget.id));
    const target = Object.entries(widgetBounds.current).find(([targetId, bounds]) =>
      targetId !== id &&
      enabledIds.has(targetId) &&
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height,
    );
    if (!target || lastDropTarget.current === target[0]) return;

    lastDropTarget.current = target[0];
    setDraftWidgets((current) => {
      const sourceIndex = current.findIndex((widget) => widget.id === id);
      const targetIndex = current.findIndex((widget) => widget.id === target[0]);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
      return next;
    });
  };

  const updateWidget = (id: string, updates: Partial<WidgetItem>) => {
    setDraftWidgets((current) => current.map((widget) => (
      widget.id === id ? { ...widget, ...updates } : widget
    )));
  };

  const addWidget = (id: string) => {
    const count = draftWidgets.filter((widget) => widget.enabled).length;
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
        editing={isEditing}
        positionVersion={positionVersion}
        style={[styles.widget, widget.size === 'large' ? styles.fullWidth : styles.halfWidth]}
        onPosition={(id, bounds) => { widgetBounds.current[id] = bounds; }}
        onDrag={handleWidgetDrag}
        onDragEnd={() => { lastDropTarget.current = null; }}
        onToggleSize={() => updateWidget(widget.id, { size: widget.size === 'large' ? 'small' : 'large' })}
        onRemove={() => updateWidget(widget.id, { enabled: false })}
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
              onPress={() => isEditing ? void saveWidgetLayout() : beginEditing()}
              disabled={isSavingWidgets}
              accessibilityLabel={isEditing ? 'Guardar diseño del Dashboard' : 'Editar widgets del Dashboard'}
            >
              <MaterialIcons name={isEditing ? 'check' : 'edit'} size={22} color={EcoColors.primary} />
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
        onScroll={() => {
          if (isEditing) setPositionVersion((version) => version + 1);
        }}
      >
        {isEditing && (
          <View style={styles.editingHint}>
            <ThemedText style={styles.editingHintText}>Arrastra desde el icono para ordenar; usa los controles para ajustar el tamaño u ocultar widgets.</ThemedText>
          </View>
        )}
        <View style={styles.widgetsContainer}>
          {(isEditing ? draftWidgets : preferences.dashboardWidgets)
            .filter((widget) => widget.enabled)
            .map(renderWidget)}
        </View>
        {isEditing && (
          <View style={styles.availableWidgets}>
            <ThemedText style={styles.availableWidgetsTitle}>Añadir widgets ({draftWidgets.filter((widget) => widget.enabled).length}/8)</ThemedText>
            <View style={styles.availableWidgetsList}>
              {draftWidgets.filter((widget) => !widget.enabled).map((widget) => (
                <TouchableOpacity key={widget.id} style={styles.availableWidget} onPress={() => addWidget(widget.id)}>
                  <MaterialIcons name="add" size={16} color={EcoColors.primary} />
                  <ThemedText style={styles.availableWidgetText}>{widget.title}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
  editingHint: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#e7f1df',
  },
  editingHintText: {
    color: '#40523b',
    fontSize: 12,
    lineHeight: 18,
  },
  availableWidgets: {
    marginTop: 16,
    gap: 10,
  },
  availableWidgetsTitle: {
    color: '#206223',
    fontSize: 14,
    fontWeight: '700',
  },
  availableWidgetsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#e7f1df',
  },
  availableWidgetText: {
    color: '#206223',
    fontSize: 12,
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
