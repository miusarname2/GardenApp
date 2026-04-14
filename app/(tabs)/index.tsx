import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';


import { ThemedText } from '@/components/themed-text';
import { PlantHealthCard } from '@/components/PlantHealthCard';
import { EcoColors } from '@/constants/theme';
import { getDb } from '@/db';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      const db = getDb();
      
      // Fetch latest metrics
      const latestMetrics = db.getFirstSync<any>('SELECT * FROM metrics ORDER BY created_at DESC LIMIT 1');
      if (latestMetrics) {
        setMetrics({
          hydration: latestMetrics.hydration,
          light: latestMetrics.exposure * 300, 
          temp: latestMetrics.temperature,
          humidity: latestMetrics.humidity,
          batPanel: latestMetrics.battery_panel,
          batSys: latestMetrics.battery_system
        });
      }

      // Fetch latest 3 history events for timeline
      const events = db.getAllSync<any>('SELECT * FROM history ORDER BY created_at DESC LIMIT 3');
      setHistory(events);
    } catch (error) {
       console.warn('Dashboard DB Error:', error);
       // Falls back to initial state
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Top Bar (Fixed) */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="local-florist" size={24} color={EcoColors.primary} />
            <ThemedText style={styles.headerTitle}>Digital Garden</ThemedText>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')}>
             <MaterialIcons name="bluetooth-connected" size={22} color={EcoColors.outline} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Plant Hero Card + Metrics Grid (Consolidated in Component) */}
        <PlantHealthCard metrics={metrics} />

        {/* Recent Growth Section */}
        <View style={styles.timelineSection}>
          <ThemedText style={styles.timelineTitle}>Recent Growth</ThemedText>
          
          <View style={styles.timelineWrapper}>
             {/* Vertical Track */}
             <View style={styles.timelineTrack} />
             
             {history.map((item, index) => (
                <View key={item.id || index} style={styles.timelineNode}>
                  <View style={[
                    styles.nodeDot, 
                    index === 2 ? { backgroundColor: EcoColors.outlineVariant, opacity: 0.6 } : {}
                  ]} />
                  <View style={[styles.nodeContent, index === 2 ? { opacity: 0.6 } : {}]}>
                    <ThemedText style={styles.nodeDate}>{formatDate(item.created_at)}</ThemedText>
                    <ThemedText style={styles.nodeAction}>{item.action}</ThemedText>
                  </View>
                </View>
             ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB: Water Now */}
      <TouchableOpacity 
        activeOpacity={0.85} 
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 90 }]}
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
    paddingBottom: 160, // Extra space for FAB and Navbar
  },
  timelineSection: {
    marginTop: 40,
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
  nodeContent: {
    flex: 1,
  },
  nodeDate: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#707a6c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nodeAction: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#171d14',
  },
  fab: {
    position: 'absolute',
    bottom: 110, // Adjusted for tab bar
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