import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, LayoutAnimation, UIManager, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { getDb } from '@/db';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 96; // 24 outer padding * 2 + 24 inner padding * 2
const CHART_HEIGHT = 100;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatDate = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const dDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = nDay.getTime() - dDay.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  if (diffDays === 0) return 'HOY';
  if (diffDays === 1) return 'AYER';
  
  const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return `${date.getDate()} ${monthNames[date.getMonth()]}`;
};

export default function ExploreScreen() {
  const [selectedRange, setSelectedRange] = useState<'Día' | 'Semana'>('Día');
  const [stats, setStats] = useState({ hydration: 88, exposure: 6.2, growthDiff: 12.4 });
  const [events, setEvents] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const db = getDb();
    const fetchMetrics = () => {
       try {
         const db = getDb();
         // "Día" -> Últimos 7 días (Gráfico de barras)
         // "Semana" -> Últimas 3-6 semanas (Gráfico de línea - pedimos últimos 30 días para trazar la curva)
         const daysLimit = selectedRange === 'Día' ? 7 : 30;
         const cutoff = new Date(Date.now() - (daysLimit * 24 * 60 * 60 * 1000)).toISOString();
         
         const metricsSql = `
           SELECT AVG(hydration) as h, AVG(exposure) as e, MIN(growth_index) as min_g, MAX(growth_index) as max_g
           FROM metrics
           WHERE created_at >= ?
         `;
         const metricsRes = db.getFirstSync<any>(metricsSql, [cutoff]);
         
         if (metricsRes) {
            const diff = ((metricsRes.max_g || 0) - (metricsRes.min_g || 0));
            
            setStats({
              hydration: Math.round(metricsRes.h || 88),
              exposure: Number((metricsRes.e || 6.2).toFixed(1)),
              growthDiff: Number(diff.toFixed(1)) || 1.2,
            });
         }

         const eventsSql = `
           SELECT * FROM history
           WHERE created_at >= ?
           ORDER BY created_at DESC
         `;
         const eventsRes = db.getAllSync<any>(eventsSql, [cutoff]);
         setEvents(eventsRes);

         const chartSql = `
           SELECT created_at, growth_index 
           FROM metrics 
           WHERE created_at >= ? 
           ORDER BY created_at ASC
         `;
         const chartRes = db.getAllSync<any>(chartSql, [cutoff]);
         
         // Filter empty arrays to at least have a flatline prevent crash
         setChartData(chartRes.length > 0 ? chartRes : [{ growth_index: 0 }, { growth_index: 1 }]);
       } catch (error) {
         console.warn('Explore DB Error:', error);
       }
    };

    fetchMetrics();
  }, [selectedRange]);

  const toggleRange = (range: 'Día' | 'Semana') => {
    if (selectedRange === range) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedRange(range);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="eco" size={24} color="#2e7d32" />
          <ThemedText style={styles.headerTitle}>Historial</ThemedText>
        </View>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/settings')}>
          <MaterialIcons name="bluetooth-connected" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroText}>
            <ThemedText style={styles.heroSubtitle}>ACTIVE SPECIMEN</ThemedText>
            <ThemedText style={styles.heroTitle}>Monstera Deliciosa</ThemedText>
          </View>
          <View style={styles.heroImageContainer}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsXmx0GPwZaHBVDKDo7FRAkRSTOGdnd2xpCxZLI1aA_SYZ1aUnTuNnGJASXFrA49RE8L8QFKTLEJM1mFoOn05qcO0gYDfIuXSBSma0gUKJWlTCe4HqOSO-a49mfWHkO2ZW5uDYKX3IIKaVE_WVYrtE8uXDLgyrMWbHfBKKzQGuUb7PiXTD-DKKoZGss3ufw30bsfvD3lEbLwoYFgwYCEKY-cy8ZosYYhgayWpcceBJ9xfcOdezsrNRx3n3MIui7wh5ov0gLiZhVC-S' }}
              style={styles.heroImage}
              contentFit="cover"
            />
          </View>
        </View>

        <View style={styles.chartModule}>
          <View style={styles.chartHeader}>
            <View>
              <ThemedText style={styles.chartTitle}>Growth Index</ThemedText>
              <ThemedText style={styles.chartSubtitle}>Últimos {selectedRange === 'Día' ? '7 días' : '30 días'}</ThemedText>
            </View>
            <View style={styles.segmentedControl}>
              <TouchableOpacity 
                style={selectedRange === 'Día' ? styles.segmentBtnActive : styles.segmentBtnInactive}
                onPress={() => toggleRange('Día')}
              >
                <ThemedText style={selectedRange === 'Día' ? styles.segmentTextActive : styles.segmentTextInactive}>Día</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={selectedRange === 'Semana' ? styles.segmentBtnActive : styles.segmentBtnInactive}
                onPress={() => toggleRange('Semana')}
              >
                <ThemedText style={selectedRange === 'Semana' ? styles.segmentTextActive : styles.segmentTextInactive}>Semana</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chartStats}>
            <ThemedText style={styles.chartValue}>+{stats.growthDiff}%</ThemedText>
            <ThemedText style={styles.chartStatus}>{selectedRange === 'Semana' ? 'STRONG GROWTH' : 'STABLE VITALITY'}</ThemedText>
          </View>

          {/* Dynamic Data-Driven Chart Box */}
          <View style={styles.chartArea}>
             <LinearGradient
                colors={['rgba(46, 125, 50, 0.12)', 'rgba(46, 125, 50, 0)']}
                style={styles.chartGradientMock}
             />
             
             {selectedRange === 'Día' ? (
                /* Bar Chart (Día = 7 Días) */
                <View style={styles.chartBarsContainer}>
                  {chartData.map((d, i) => {
                    const maxVal = Math.max(...chartData.map(c => c.growth_index || 0), 0.1);
                    const heightPct = Math.max(10, ((d.growth_index || 0) / maxVal) * 100);
                    return (
                      <View key={"bar-" + i} style={styles.chartBarWrapper}>
                         <View style={[styles.chartBar, { height: heightPct + '%' }]} />
                      </View>
                    );
                  })}
                </View>
             ) : (
                /* Line Chart Native (Semana = Último Mes) */
                <View style={styles.chartLineContainer}>
                  {chartData.length > 1 && chartData.map((d, i) => {
                     if (i === chartData.length - 1) return null;
                     const next = chartData[i+1];
                     
                     const maxVal = Math.max(...chartData.map(c => c.growth_index || 0), 0.1);
                     const minVal = Math.min(...chartData.map(c => c.growth_index || 0));
                     const range = (maxVal - minVal) || 1;

                     const px = (i / (chartData.length - 1)) * CHART_WIDTH;
                     const py = CHART_HEIGHT - (((d.growth_index || 0) - minVal) / range) * (CHART_HEIGHT * 0.8) - 10;
                     
                     const nx = ((i + 1) / (chartData.length - 1)) * CHART_WIDTH;
                     const ny = CHART_HEIGHT - (((next.growth_index || 0) - minVal) / range) * (CHART_HEIGHT * 0.8) - 10;

                     const length = Math.hypot(nx - px, ny - py);
                     const angle = Math.atan2(ny - py, nx - px) * (180 / Math.PI);

                     return (
                       <View key={`line-${i}`} style={{
                          position: 'absolute',
                          left: px,
                          top: py - 2.5,
                          width: length,
                          height: 5,
                          backgroundColor: '#206223',
                          // native anchor fallback approach to rotate correctly between two points from top-left origin
                          transform: [
                             { translateX: length/2 - length/2 },
                             { rotate: angle + 'deg' },
                          ],
                          transformOrigin: 'left',
                          borderRadius: 3,
                          zIndex: 2,
                       }} />
                     );
                  })}
                  
                  {/* Decorative Dots */}
                  {chartData.map((d, i) => {
                     if (i % 3 !== 0 && i !== chartData.length - 1) return null; // Show dots selectively
                     const maxVal = Math.max(...chartData.map(c => c.growth_index || 0), 0.1);
                     const minVal = Math.min(...chartData.map(c => c.growth_index || 0));
                     const range = (maxVal - minVal) || 1;
                     const px = (i / (chartData.length - 1)) * CHART_WIDTH;
                     const py = CHART_HEIGHT - (((d.growth_index || 0) - minVal) / range) * (CHART_HEIGHT * 0.8) - 10;
                     
                     return (
                       <View key={`dot-${i}`} style={{
                         position: 'absolute',
                         left: px - 5,
                         top: py - 5,
                         width: 10, height: 10,
                         borderRadius: 5,
                         backgroundColor: '#e3ebdc',
                         borderWidth: 2.5,
                         borderColor: '#206223',
                         zIndex: 3,
                       }} />
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

        <View style={styles.bentoGrid}>
          <View style={styles.bentoCard}>
            <MaterialIcons name="water-drop" size={24} color="#325c5a" style={styles.bentoIcon} />
            <View>
              <ThemedText style={styles.bentoLabel}>HYDRATION</ThemedText>
              <ThemedText style={styles.bentoValue}>{stats.hydration}% <ThemedText style={styles.bentoUnit}>Avg</ThemedText></ThemedText>
            </View>
          </View>

          <View style={styles.bentoCard}>
            <MaterialIcons name="wb-sunny" size={24} color="#286b33" style={styles.bentoIcon} />
            <View>
              <ThemedText style={styles.bentoLabel}>EXPOSURE</ThemedText>
              <ThemedText style={styles.bentoValue}>{stats.exposure} <ThemedText style={styles.bentoUnit}>hrs</ThemedText></ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <ThemedText style={styles.timelineTitle}>Resumen</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.timelineAction}>{events.length} Eventos</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineList}>
            {events.length > 0 && <View style={styles.timelineTrack} />}

            {events.length === 0 && (
              <ThemedText style={{ color: '#707a6c', textAlign: 'center', marginTop: 24 }}>
                No se registraron eventos en este periodo.
              </ThemedText>
            )}

            {events.map((evt, index) => {
              const isRecent = index === 0;
              return (
                <View key={evt.id || index} style={styles.timelineNode}>
                  <View style={[styles.timelineDot, isRecent && styles.timelineDotActive]} />
                  <View style={[styles.timelineCard, { backgroundColor: isRecent ? '#eff6e7' : 'rgba(239, 246, 231, 0.6)' }]}>
                    <View style={styles.timelineCardHeader}>
                      <ThemedText style={[styles.timelineCardTitle, !isRecent && { opacity: 0.7 }]}>
                        {evt.action}
                      </ThemedText>
                      <ThemedText style={styles.timelineCardDate}>
                        {formatDate(evt.created_at)}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.timelineCardDesc, !isRecent && { opacity: 0.7 }]}>
                      {evt.details}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

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
    paddingBottom: 150, 
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
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
  heroImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#e9f0e1',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  chartModule: {
    backgroundColor: '#eff6e7',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
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
    paddingHorizontal: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  segmentTextActive: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  chartStats: {
    marginBottom: 16,
  },
  chartValue: {
    fontSize: 32,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#206223',
  },
  chartStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#286b33',
    marginTop: 4,
  },
  chartArea: {
    height: 140,
    width: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
    marginTop: 16,
  },
  chartGradientMock: {
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
    zIndex: 10,
  },
  chartBarWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 4,
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
    zIndex: 10,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  chartLabelText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#bfcaba',
  },
  bentoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  bentoCard: {
    width: '47.5%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#171d14',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
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
    fontSize: 24,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#171d14',
  },
  bentoUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#707a6c',
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
    marginBottom: 8,
  },
  timelineCardTitle: {
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
});
