import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EditableWidget, WidgetBounds } from '@/components/EditableWidget';
import { ThemedText } from '@/components/themed-text';
import { getPlantImageSource } from '@/constants/plant-images';
import { getDb } from '@/db';
import { useSensorContext } from '@/contexts/sensor-context';
import { useWidgetPreferences, WidgetItem } from '@/contexts/widget-preferences-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 100;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HistoryEvent {
  id: number;
  action: string;
  details: string;
  created_at: string;
}

interface ChartPoint {
  created_at?: string;
  growth_index: number | null;
}

const formatDate = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const dDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = (nDay.getTime() - dDay.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return 'HOY';
  if (diffDays === 1) return 'AYER';

  const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return `${date.getDate()} ${monthNames[date.getMonth()]}`;
};

export default function ExploreScreen() {
  const [selectedRange, setSelectedRange] = useState<'Día' | 'Semana'>('Día');
  const { metrics: liveMetrics, connectionStatus, allSensors, activeSensorId } = useSensorContext();
  const { preferences, savePreferences } = useWidgetPreferences();
  const [stats, setStats] = useState({ hydration: 88, exposure: 6.2, growthDiff: 12.4, temperature: 24, humidity: 52 });
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartWidth, setChartWidth] = useState(Math.max(SCREEN_WIDTH - 96, 1));
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingWidgets, setIsSavingWidgets] = useState(false);
  const [positionVersion, setPositionVersion] = useState(0);
  const [draftWidgets, setDraftWidgets] = useState(preferences.historyWidgets);
  const widgetBounds = useRef<Record<string, WidgetBounds>>({});
  const lastDropTarget = useRef<string | null>(null);

  const beginEditing = () => {
    setDraftWidgets(preferences.historyWidgets);
    setIsEditing(true);
  };

  const saveWidgetLayout = async () => {
    setIsSavingWidgets(true);
    try {
      await savePreferences({ ...preferences, historyWidgets: draftWidgets });
      setIsEditing(false);
    } catch (error) {
      console.warn('[History] Failed to save widget layout:', error);
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
    if (count >= 4) {
      Alert.alert('Límite alcanzado', 'El Historial permite un máximo de 4 widgets.');
      return;
    }
    updateWidget(id, { enabled: true });
  };

  useEffect(() => {
    if (liveMetrics) {
      setStats((previous) => ({
        ...previous,
        hydration: liveMetrics.hydration,
        exposure: Number((liveMetrics.light / 300).toFixed(1)),
        temperature: liveMetrics.temp,
        humidity: liveMetrics.humidity,
      }));
    }
  }, [liveMetrics]);

  useEffect(() => {
    try {
      const db = getDb();
      const daysLimit = selectedRange === 'Día' ? 7 : 30;
      const cutoff = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000).toISOString();
      const activeSensor = allSensors.find((sensor) => sensor.deviceId === activeSensorId);
      const sensorDbId = activeSensor?.sensorDbId;
      const sensorCondition = sensorDbId != null ? '(sensor_id = ? OR sensor_id IS NULL)' : 'sensor_id IS NULL';
      const params = sensorDbId != null ? [cutoff, sensorDbId] : [cutoff];

      const metricsRes = db.getFirstSync<{
        h: number | null;
        e: number | null;
        min_g: number | null;
        max_g: number | null;
      }>(
        `SELECT AVG(hydration) as h, AVG(exposure) as e, MIN(growth_index) as min_g, MAX(growth_index) as max_g
         FROM metrics WHERE created_at >= ? AND ${sensorCondition}`,
        params,
      );

      if (metricsRes) {
        const diff = (metricsRes.max_g ?? 0) - (metricsRes.min_g ?? 0);
        setStats((previous) => ({
          hydration: liveMetrics?.hydration ?? Math.round(metricsRes.h || 88),
          exposure: liveMetrics ? Number((liveMetrics.light / 300).toFixed(1)) : Number((metricsRes.e || 6.2).toFixed(1)),
          growthDiff: Number(diff.toFixed(1)) || 1.2,
          temperature: liveMetrics?.temp ?? previous.temperature,
          humidity: liveMetrics?.humidity ?? previous.humidity,
        }));
      }

      const eventsRes = db.getAllSync<HistoryEvent>(
        `SELECT * FROM history WHERE created_at >= ? AND ${sensorCondition} ORDER BY created_at DESC`,
        params,
      );
      setEvents(eventsRes);

      const chartRes = db.getAllSync<ChartPoint>(
        `SELECT created_at, growth_index FROM metrics WHERE created_at >= ? AND ${sensorCondition} ORDER BY created_at ASC`,
        params,
      );
      setChartData(chartRes.length > 0 ? chartRes : [{ growth_index: 0 }, { growth_index: 1 }]);
    } catch (error) {
      console.warn('Explore DB Error:', error);
    }
  }, [selectedRange, liveMetrics, allSensors, activeSensorId]);

  const toggleRange = (range: 'Día' | 'Semana') => {
    if (selectedRange === range) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedRange(range);
  };

  const renderWidget = (widget: WidgetItem) => {
    if (widget.id === 'plant') {
      return (
        <View key={widget.id} style={[styles.heroSection, widget.size === 'small' && styles.compactHeroSection]}>
          <View style={styles.heroText}>
            <ThemedText style={styles.heroSubtitle}>{widget.title}</ThemedText>
            <ThemedText style={[styles.heroTitle, widget.size === 'small' && styles.compactHeroTitle]}>{preferences.plantName}</ThemedText>
            {preferences.plantSpecies.length > 0 && (
              <ThemedText style={styles.heroSpecies}>{preferences.plantSpecies}</ThemedText>
            )}
          </View>
          <View style={[styles.heroImageContainer, widget.size === 'small' && styles.compactHeroImageContainer]}>
            <Image source={getPlantImageSource(preferences.plantImage)} style={styles.heroImage} contentFit="cover" />
          </View>
        </View>
      );
    }

    if (widget.id === 'growthChart') {
      const values = chartData.map((point) => point.growth_index ?? 0);
      const maxValue = Math.max(...values, 0.1);
      const minValue = Math.min(...values);
      const valueRange = maxValue - minValue || 1;

      return (
        <View key={widget.id} style={[styles.chartModule, widget.size === 'small' && styles.compactChartModule]}>
          <View style={[styles.chartHeader, widget.size === 'small' && styles.compactChartHeader]}>
            <View>
              <ThemedText style={styles.chartTitle}>{widget.title}</ThemedText>
              <ThemedText style={styles.chartSubtitle}>Últimos {selectedRange === 'Día' ? '7 días' : '30 días'}</ThemedText>
            </View>
            <View style={styles.segmentedControl}>
              {(['Día', 'Semana'] as const).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={selectedRange === range ? styles.segmentBtnActive : styles.segmentBtnInactive}
                  onPress={() => toggleRange(range)}
                >
                  <ThemedText style={selectedRange === range ? styles.segmentTextActive : styles.segmentTextInactive}>
                    {range}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View
            style={styles.chartArea}
            onLayout={(event) => {
              const nextWidth = Math.max(event.nativeEvent.layout.width, 1);
              setChartWidth((current) => Math.abs(current - nextWidth) > 1 ? nextWidth : current);
            }}
          >
            <LinearGradient
              colors={['rgba(46, 125, 50, 0.12)', 'rgba(46, 125, 50, 0)']}
              style={styles.chartGradient}
            />
            {selectedRange === 'Día' ? (
              <View style={styles.chartBarsContainer}>
                {chartData.map((point, index) => {
                  const heightPct = Math.max(10, ((point.growth_index ?? 0) / maxValue) * 100);
                  return (
                    <View key={`bar-${index}`} style={styles.chartBarWrapper}>
                      <View style={[styles.chartBar, { height: `${heightPct}%` }]} />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.chartLineContainer}>
                {chartData.slice(0, -1).map((point, index) => {
                  const next = chartData[index + 1];
                  const x = (index / (chartData.length - 1)) * chartWidth;
                  const y = CHART_HEIGHT - (((point.growth_index ?? 0) - minValue) / valueRange) * (CHART_HEIGHT * 0.8) - 10;
                  const nextX = ((index + 1) / (chartData.length - 1)) * chartWidth;
                  const nextY = CHART_HEIGHT - (((next.growth_index ?? 0) - minValue) / valueRange) * (CHART_HEIGHT * 0.8) - 10;
                  const length = Math.hypot(nextX - x, nextY - y);
                  const angle = Math.atan2(nextY - y, nextX - x) * (180 / Math.PI);

                  return (
                    <View
                      key={`line-${index}`}
                      style={{
                        position: 'absolute',
                        left: x,
                        top: y - 2.5,
                        width: length,
                        height: 5,
                        backgroundColor: '#206223',
                        transform: [{ rotate: `${angle}deg` }],
                        transformOrigin: 'left',
                        borderRadius: 3,
                      }}
                    />
                  );
                })}
              </View>
            )}
            <View style={styles.chartLabels}>
              {selectedRange === 'Día' ? (
                <>
                  <ThemedText style={styles.chartLabelText}>LUN</ThemedText>
                  <ThemedText style={styles.chartLabelText}>MIE</ThemedText>
                  <ThemedText style={styles.chartLabelText}>VIE</ThemedText>
                  <ThemedText style={styles.chartLabelText}>HOY</ThemedText>
                </>
              ) : (
                <>
                  <ThemedText style={styles.chartLabelText}>Hace 3 Sem</ThemedText>
                  <ThemedText style={styles.chartLabelText}>Hace 2 Sem</ThemedText>
                  <ThemedText style={styles.chartLabelText}>Esta Sem</ThemedText>
                </>
              )}
            </View>
          </View>
        </View>
      );
    }

    if (widget.id === 'growthIndex') {
      return (
        <View key={widget.id} style={[styles.growthIndexCard, widget.size === 'small' && styles.compactGrowthIndexCard]}>
          <ThemedText style={styles.sectionTitle}>{widget.title}</ThemedText>
          <ThemedText style={styles.growthValue}>+{stats.growthDiff}%</ThemedText>
          <ThemedText style={styles.growthStatus}>
            {selectedRange === 'Semana' ? 'STRONG GROWTH' : 'STABLE VITALITY'}
          </ThemedText>
        </View>
      );
    }

    if (widget.id === 'summary') {
      return (
        <View key={widget.id} style={styles.summarySection}>
          <ThemedText style={styles.sectionTitle}>{widget.title}</ThemedText>
          <View style={[styles.bentoGrid, widget.size === 'small' && styles.compactBentoGrid]}>
            <View style={[styles.bentoCard, widget.size === 'small' && styles.compactBentoCard]}>
              <MaterialIcons name="water-drop" size={24} color="#325c5a" style={styles.bentoIcon} />
              <ThemedText style={styles.bentoLabel}>HYDRATION</ThemedText>
              <ThemedText style={styles.bentoValue}>
                {stats.hydration}% <ThemedText style={styles.bentoUnit}>Avg</ThemedText>
              </ThemedText>
            </View>
            <View style={[styles.bentoCard, widget.size === 'small' && styles.compactBentoCard]}>
              <MaterialIcons name="wb-sunny" size={24} color="#286b33" style={styles.bentoIcon} />
              <ThemedText style={styles.bentoLabel}>EXPOSURE</ThemedText>
              <ThemedText style={styles.bentoValue}>
                {stats.exposure} <ThemedText style={styles.bentoUnit}>hrs</ThemedText>
              </ThemedText>
            </View>
          </View>
        </View>
      );
    }

    if (widget.id === 'careTip') {
      return (
        <View key={widget.id} style={[styles.extraCard, widget.size === 'small' && styles.compactExtraCard]}>
          <MaterialIcons name="lightbulb" size={24} color="#206223" />
          <View style={styles.extraCardText}>
            <ThemedText style={styles.sectionTitle}>{widget.title}</ThemedText>
            <ThemedText style={styles.extraDescription}>
              {stats.hydration < 40
                ? 'La hidratación está baja; revisa la humedad del sustrato.'
                : 'La planta mantiene una hidratación adecuada. Continúa con el seguimiento.'}
            </ThemedText>
          </View>
        </View>
      );
    }

    if (widget.id === 'environment') {
      return (
        <View key={widget.id} style={[styles.extraCard, widget.size === 'small' && styles.compactExtraCard]}>
          <MaterialIcons name="air" size={24} color="#206223" />
          <View style={styles.extraCardText}>
            <ThemedText style={styles.sectionTitle}>{widget.title}</ThemedText>
            <ThemedText style={styles.extraDescription}>
              Temperatura {stats.temperature}°C · Humedad {stats.humidity}% · Luz {stats.exposure} hrs
            </ThemedText>
          </View>
        </View>
      );
    }

    if (widget.id === 'events') {
      return (
        <View key={widget.id} style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <ThemedText style={styles.timelineTitle}>{widget.title}</ThemedText>
            <ThemedText style={styles.timelineAction}>{events.length} Eventos</ThemedText>
          </View>
          <View style={styles.timelineList}>
            {events.length > 0 && <View style={styles.timelineTrack} />}
            {events.length === 0 && (
              <ThemedText style={styles.emptyEvents}>No se registraron eventos en este periodo.</ThemedText>
            )}
            {events.map((event, index) => {
              const isRecent = index === 0;
              return (
                <View key={event.id} style={styles.timelineNode}>
                  <View style={[styles.timelineDot, isRecent && styles.timelineDotActive]} />
                  <View style={[styles.timelineCard, { backgroundColor: isRecent ? '#eff6e7' : 'rgba(239, 246, 231, 0.6)' }]}>
                    <View style={styles.timelineCardHeader}>
                      <ThemedText style={[styles.timelineCardTitle, !isRecent && styles.inactiveEvent]}>
                        {event.action}
                      </ThemedText>
                      <ThemedText style={styles.timelineCardDate}>{formatDate(event.created_at)}</ThemedText>
                    </View>
                    <ThemedText style={[styles.timelineCardDesc, !isRecent && styles.inactiveEvent]}>
                      {event.details}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="eco" size={24} color="#2e7d32" />
          <ThemedText style={styles.headerTitle}>Historial</ThemedText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => isEditing ? void saveWidgetLayout() : beginEditing()}
            disabled={isSavingWidgets}
            accessibilityLabel={isEditing ? 'Guardar diseño del Historial' : 'Editar widgets del Historial'}
          >
            <MaterialIcons name={isEditing ? 'check' : 'edit'} size={22} color="#2e7d32" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/settings')} accessibilityLabel="Conectar sensores">
            <MaterialIcons name={connectionStatus === 'connected' ? 'bluetooth-connected' : 'bluetooth-disabled'} size={24} color={connectionStatus === 'connected' ? '#2e7d32' : '#707a6c'} />
          </TouchableOpacity>
        </View>
      </View>

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
          {(isEditing ? draftWidgets : preferences.historyWidgets)
            .filter((widget) => widget.enabled)
            .map((widget) => (
              <EditableWidget
                key={widget.id}
                widget={widget}
                editing={isEditing}
                positionVersion={positionVersion}
                style={widget.size === 'large' ? styles.fullWidget : styles.compactWidget}
                onPosition={(id, bounds) => { widgetBounds.current[id] = bounds; }}
                onDrag={handleWidgetDrag}
                onDragEnd={() => { lastDropTarget.current = null; }}
                onToggleSize={() => updateWidget(widget.id, { size: widget.size === 'large' ? 'small' : 'large' })}
                onRemove={() => updateWidget(widget.id, { enabled: false })}
              >
                {renderWidget(widget)}
              </EditableWidget>
            ))}
        </View>
        {isEditing && (
          <View style={styles.availableWidgets}>
            <ThemedText style={styles.availableWidgetsTitle}>Añadir widgets ({draftWidgets.filter((widget) => widget.enabled).length}/4)</ThemedText>
            <View style={styles.availableWidgetsList}>
              {draftWidgets.filter((widget) => !widget.enabled).map((widget) => (
                <TouchableOpacity key={widget.id} style={styles.availableWidget} onPress={() => addWidget(widget.id)}>
                  <MaterialIcons name="add" size={16} color="#206223" />
                  <ThemedText style={styles.availableWidgetText}>{widget.title}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5fced',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    color: '#206223',
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 160,
  },
  widgetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },
  fullWidget: {
    width: '100%',
  },
  compactWidget: {
    width: '48%',
  },
  editingHint: {
    marginBottom: 20,
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
    marginTop: 20,
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
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactHeroSection: {
    gap: 8,
  },
  heroText: {
    flex: 1,
    paddingRight: 16,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#707a6c',
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 30,
    color: '#206223',
    letterSpacing: -1,
  },
  compactHeroTitle: {
    fontSize: 20,
  },
  heroSpecies: {
    color: '#707a6c',
    fontSize: 14,
    marginTop: 3,
  },
  heroImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#e9f0e1',
    overflow: 'hidden',
  },
  compactHeroImageContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  chartModule: {
    backgroundColor: '#eff6e7',
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
  },
  compactChartModule: {
    padding: 14,
    borderRadius: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  compactChartHeader: {
    flexDirection: 'column',
    gap: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#171d14',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#707a6c',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#dee5d6',
    padding: 4,
    borderRadius: 12,
  },
  segmentBtnInactive: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentTextInactive: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#40493d',
  },
  segmentBtnActive: {
    backgroundColor: '#206223',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 2,
  },
  segmentTextActive: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  chartArea: {
    height: 140,
    width: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
    marginTop: 8,
  },
  chartGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    height: 100,
    paddingBottom: 24,
    position: 'absolute',
    bottom: 0,
  },
  chartBarWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  chartBar: {
    width: 14,
    backgroundColor: '#206223',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    opacity: 0.9,
  },
  chartLineContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    width: '100%',
    height: 100,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  chartLabelText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#899584',
  },
  growthIndexCard: {
    backgroundColor: '#eff6e7',
    padding: 22,
    borderRadius: 24,
  },
  compactGrowthIndexCard: {
    padding: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#171d14',
  },
  growthValue: {
    fontSize: 32,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#206223',
    marginTop: 10,
  },
  growthStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#286b33',
    marginTop: 4,
  },
  summarySection: {
    gap: 14,
  },
  compactBentoGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  bentoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 24,
    minHeight: 140,
  },
  compactBentoCard: {
    padding: 14,
    minHeight: 110,
  },
  bentoIcon: {
    marginBottom: 12,
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#707a6c',
    marginBottom: 4,
  },
  bentoValue: {
    fontSize: 23,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#171d14',
  },
  bentoUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#707a6c',
  },
  extraCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#eff6e7',
  },
  compactExtraCard: {
    padding: 12,
    gap: 8,
  },
  extraCardText: {
    flex: 1,
    gap: 6,
  },
  extraDescription: {
    color: '#40493d',
    fontSize: 13,
    lineHeight: 19,
  },
  timelineSection: {
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  timelineTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#171d14',
  },
  timelineAction: {
    color: '#206223',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timelineList: {
    position: 'relative',
    paddingLeft: 16,
  },
  timelineTrack: {
    position: 'absolute',
    left: 23,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: 'rgba(191, 202, 186, 0.4)',
  },
  timelineNode: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#bfcaba',
    borderWidth: 4,
    borderColor: '#f5fced',
    marginTop: 8,
    marginRight: 16,
    zIndex: 10,
  },
  timelineDotActive: {
    backgroundColor: '#206223',
  },
  timelineCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timelineCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#171d14',
  },
  timelineCardDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#707a6c',
  },
  timelineCardDesc: {
    fontSize: 12,
    color: '#40493d',
    lineHeight: 18,
  },
  inactiveEvent: {
    opacity: 0.7,
  },
  emptyEvents: {
    color: '#707a6c',
    textAlign: 'center',
    marginTop: 12,
  },
});
