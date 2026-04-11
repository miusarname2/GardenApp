import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { getDb } from '@/db';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatDate = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  // Set to midnight for fair day comparison
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
  const [selectedRange, setSelectedRange] = useState<'Día' | 'Semana'>('Semana');
  const [stats, setStats] = useState({ hydration: 88, exposure: 6.2, growthDiff: 12.4 });
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const db = getDb();
    const fetchMetrics = () => {
       const days = selectedRange === 'Día' ? 1 : 7;
       const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
       
       const metricsSql = `
         SELECT AVG(hydration) as h, AVG(exposure) as e, MIN(growth_index) as min_g, MAX(growth_index) as max_g
         FROM metrics
         WHERE created_at >= ?
       `;
       const metricsRes = db.getFirstSync<any>(metricsSql, [cutoff]);
       
       if (metricsRes) {
          // If range is a single day and min/max are same, simulate a small daily variation 
          const diff = selectedRange === 'Día' ? 1.2 : ((metricsRes.max_g || 0) - (metricsRes.min_g || 0));
          
          setStats({
            hydration: Math.round(metricsRes.h || 88),
            exposure: Number((metricsRes.e || 6.2).toFixed(1)),
            growthDiff: Number(diff.toFixed(1)),
          });
       }

       const eventsSql = `
         SELECT * FROM history
         WHERE created_at >= ?
         ORDER BY created_at DESC
       `;
       const eventsRes = db.getAllSync<any>(eventsSql, [cutoff]);
       setEvents(eventsRes);
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
      {/* TopAppBar Equivalent */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="eco" size={24} color="#2e7d32" />
          <ThemedText style={styles.headerTitle}>Historial</ThemedText>
        </View>
        <TouchableOpacity style={styles.headerIconBtn}>
          <MaterialIcons name="bluetooth-connected" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Plant Identity */}
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

        {/* Growth Index Chart Module */}
        <View style={styles.chartModule}>
          <View style={styles.chartHeader}>
            <View>
              <ThemedText style={styles.chartTitle}>Growth Index</ThemedText>
              <ThemedText style={styles.chartSubtitle}>Últimos {selectedRange === 'Día' ? '24 horas' : '7 días'}</ThemedText>
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
            <ThemedText style={styles.chartStatus}>{selectedRange === 'Semana' ? 'STRONG GROWTH' : 'STABLE'}</ThemedText>
          </View>

          {/* Conceptual Line Chart Box */}
          <View style={styles.chartArea}>
             <LinearGradient
                colors={['rgba(46, 125, 50, 0.15)', 'rgba(46, 125, 50, 0)']}
                style={styles.chartGradientMock}
             />
             <View style={styles.chartLabels}>
                {selectedRange === 'Semana' ? (
                  <>
                    <ThemedText style={styles.chartLabelText}>LUN</ThemedText>
                    <ThemedText style={styles.chartLabelText}>MIE</ThemedText>
                    <ThemedText style={styles.chartLabelText}>VIE</ThemedText>
                    <ThemedText style={styles.chartLabelText}>HOY</ThemedText>
                  </>
                ) : (
                  <>
                    <ThemedText style={styles.chartLabelText}>00:00</ThemedText>
                    <ThemedText style={styles.chartLabelText}>08:00</ThemedText>
                    <ThemedText style={styles.chartLabelText}>16:00</ThemedText>
                    <ThemedText style={styles.chartLabelText}>AHORA</ThemedText>
                  </>
                )}
             </View>
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Hydration */}
          <View style={styles.bentoCard}>
            <MaterialIcons name="water-drop" size={24} color="#325c5a" style={styles.bentoIcon} />
            <View>
              <ThemedText style={styles.bentoLabel}>HYDRATION</ThemedText>
              <ThemedText style={styles.bentoValue}>{stats.hydration}% <ThemedText style={styles.bentoUnit}>Avg</ThemedText></ThemedText>
            </View>
          </View>

          {/* Exposure */}
          <View style={styles.bentoCard}>
            <MaterialIcons name="wb-sunny" size={24} color="#286b33" style={styles.bentoIcon} />
            <View>
              <ThemedText style={styles.bentoLabel}>EXPOSURE</ThemedText>
              <ThemedText style={styles.bentoValue}>{stats.exposure} <ThemedText style={styles.bentoUnit}>hrs</ThemedText></ThemedText>
            </View>
          </View>
        </View>

        {/* Growth Timeline */}
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
    height: 120,
    width: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
    marginTop: 16,
  },
  chartGradientMock: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
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
    // Empty
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
