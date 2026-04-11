import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/Card';
import { PlantHealthCard } from '@/components/PlantHealthCard';
import { EcoColors } from '@/constants/theme';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="labelMedium" style={styles.greeting}>Buen día, Botánico</ThemedText>
            <ThemedText type="headlineMedium" style={styles.title}>Tu Ecosistema</ThemedText>
          </View>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={24} color={EcoColors.onSurface} />
          </View>
        </View>

        {/* Primary Plant Health Card */}
        <View style={styles.primaryCardContainer}>
          <PlantHealthCard />
        </View>

        {/* Secondary Dashboard Cards (Asymmetrical layout) */}
        <View style={styles.secondaryCardsGrid}>
          {/* Timeline / History */}
          <Card backgroundColor={EcoColors.surfaceContainerLow} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <MaterialIcons name="history" size={24} color={EcoColors.tertiary} />
              <ThemedText type="titleMedium" style={{ fontWeight: 'bold' }}>Último Riego</ThemedText>
            </View>
            <ThemedText type="bodyMedium" style={{ color: EcoColors.onSurfaceVariant, marginTop: 8 }}>
              Hace 2 días. La humedad actual está en un nivel óptimo, no requiere riego por ahora.
            </ThemedText>
          </Card>

          {/* Quick Action */}
          <Card backgroundColor={EcoColors.surfaceContainerHigh} style={styles.actionCard}>
             <View style={[styles.iconContainer, { backgroundColor: EcoColors.primaryContainer + '20', alignSelf: 'flex-start', marginBottom: 12 }]}>
                <MaterialIcons name="add" size={24} color={EcoColors.primary} />
              </View>
              <ThemedText type="titleMedium" style={{ fontWeight: 'bold' }}>Añadir Planta</ThemedText>
              <ThemedText type="bodySmall" style={{ color: EcoColors.onSurfaceVariant, marginTop: 4 }}>Sincroniza un nuevo sensor.</ThemedText>
          </Card>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    color: EcoColors.outline,
    marginBottom: 4,
  },
  title: {
    color: EcoColors.primary,
    fontWeight: '800',
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
    marginBottom: 24,
  },
  secondaryCardsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  historyCard: {
    flex: 2,
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
});