import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { PlantHealthCard } from '@/components/PlantHealthCard';
import { EcoColors } from '@/constants/theme';
import { getDb } from '@/db';

export default function DashboardScreen() {
  const [metrics, setMetrics] = useState<any>(null);
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    const db = getDb();
    
    // Fetch latest metrics
    const latestMetrics = db.getFirstSync<any>('SELECT * FROM metrics ORDER BY created_at DESC LIMIT 1');
    if (latestMetrics) {
      setMetrics({
        hydration: latestMetrics.hydration,
        light: latestMetrics.exposure * 300, // Simulated LUX conversion for display
        temp: latestMetrics.temperature,
        humidity: latestMetrics.humidity,
        batPanel: latestMetrics.battery_panel,
        batSys: latestMetrics.battery_system
      });
    }

    // Fetch latest history event
    const event = db.getFirstSync<any>('SELECT * FROM history ORDER BY created_at DESC LIMIT 1');
    setLastEvent(event);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="labelMedium" style={styles.greeting}>BUEN DÍA, BOTÁNICO</ThemedText>
            <ThemedText type="headlineMedium" style={styles.title}>Tu Ecosistema</ThemedText>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <MaterialIcons name="person" size={24} color={EcoColors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Primary Plant Health Card */}
        <View style={styles.primaryCardContainer}>
          <PlantHealthCard metrics={metrics} />
        </View>

        {/* Secondary Dashboard Cards (Asymmetrical layout) */}
        <View style={styles.secondaryCardsGrid}>
          {/* Latest Event Card */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={[styles.bentoCard, { backgroundColor: EcoColors.surfaceContainerLow, flex: 2 }]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="history" size={20} color={EcoColors.tertiary} />
              <ThemedText style={styles.cardLabel}>ÚLTIMO EVENTO</ThemedText>
            </View>
            <ThemedText style={styles.cardTitle}>{lastEvent?.action || 'Sin eventos'}</ThemedText>
            <ThemedText style={styles.cardDesc} numberOfLines={2}>
              {lastEvent?.details || 'Día tranquilo en el huerto.'}
            </ThemedText>
          </TouchableOpacity>

          {/* Quick Action Card */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={[styles.bentoCard, { backgroundColor: EcoColors.surfaceContainerHigh, flex: 1.2 }]}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="add" size={20} color={EcoColors.primary} />
            </View>
            <ThemedText style={styles.actionTitle}>Añadir Planta</ThemedText>
          </TouchableOpacity>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120, // Extra space for floating tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#707a6c',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 30,
    color: '#206223',
    letterSpacing: -1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: EcoColors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCardContainer: {
    marginBottom: 16,
  },
  secondaryCardsGrid: {
    flexDirection: 'row',
    gap: 16,
    height: 140,
  },
  bentoCard: {
    borderRadius: 28,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#171d14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#707a6c',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#171d14',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#40493d',
    lineHeight: 18,
    opacity: 0.8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(32, 98, 35, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#206223',
  },
});