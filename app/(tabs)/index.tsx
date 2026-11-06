import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
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
  const { preferences } = useWidgetPreferences();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [growthIndex, setGrowthIndex] = useState(0);

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
    let fullWidth = false;

    if (widget.id === 'plant') {
      fullWidth = true;
      content = (
        <PlantHealthCard
          plantName={preferences.plantName}
          plantSpecies={preferences.plantSpecies}
          plantImage={preferences.plantImage}
          widgetTitle={widget.title}
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
      fullWidth = true;
      content = (
        <View style={styles.tipCard}>
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
      fullWidth = true;
      content = (
        <View style={styles.timelineSection}>
          <ThemedText style={styles.timelineTitle}>{widget.title}</ThemedText>
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
      <View key={widget.id} style={[styles.widget, fullWidth && styles.fullWidth]}>
        {content}
      </View>
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
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/widget-settings')} accessibilityLabel="Personalizar widgets">
              <MaterialIcons name="tune" size={22} color={EcoColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')} accessibilityLabel="Conectar sensores">
              <MaterialIcons name={connectionStatus === 'connected' ? 'bluetooth-connected' : 'bluetooth-disabled'} size={22} color={connectionStatus === 'connected' ? EcoColors.primary : EcoColors.outline} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.widgetsContainer}>
          {preferences.dashboardWidgets.filter((widget) => widget.enabled).map(renderWidget)}
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
  widget: {
    width: '48%',
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
  timelineTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: '#171d14',
    marginBottom: 24,
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
