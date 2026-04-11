import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/Card';
import { EcoColors } from '@/constants/theme';

interface PlantHealthCardProps {
  style?: ViewStyle;
}

export const PlantHealthCard = ({ style }: PlantHealthCardProps) => {
  return (
    <Card backgroundColor={EcoColors.surfaceContainerLowest} style={[styles.primaryCard, style]}>
      <View style={styles.plantHeader}>
        <View style={[styles.iconContainer, { backgroundColor: EcoColors.primaryContainer + '20' }]}>
          <MaterialIcons name="grass" size={28} color={EcoColors.primary} />
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <ThemedText type="labelSmall" style={styles.statusText}>Conectado</ThemedText>
        </View>
      </View>
      
      <View style={styles.plantInfo}>
        <ThemedText type="displayMedium" style={styles.plantHealth}>98%</ThemedText>
        <ThemedText type="labelMedium" style={styles.plantSubtitle}>HIDRATACIÓN GENERAL</ThemedText>
        <ThemedText type="titleLarge" style={styles.plantName}>Monstera Deliciosa</ThemedText>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <MaterialIcons name="water-drop" size={20} color={EcoColors.primary} />
          <ThemedText type="titleSmall" style={styles.metricValue}>Húmedo</ThemedText>
          <ThemedText type="labelSmall" style={styles.metricLabel}>Sustrato</ThemedText>
        </View>
        <View style={styles.metricItem}>
          <MaterialIcons name="wb-sunny" size={20} color={EcoColors.tertiary} />
          <ThemedText type="titleSmall" style={styles.metricValue}>Adecuada</ThemedText>
          <ThemedText type="labelSmall" style={styles.metricLabel}>Luz Solar</ThemedText>
        </View>
        <View style={styles.metricItem}>
          <MaterialIcons name="device-thermostat" size={20} color={EcoColors.secondary} />
          <ThemedText type="titleSmall" style={styles.metricValue}>22°C</ThemedText>
          <ThemedText type="labelSmall" style={styles.metricLabel}>Temperatura</ThemedText>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  primaryCard: {
    padding: 32,
    borderRadius: 24, // xl roundedness
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24, // rounded-full fallback
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: EcoColors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EcoColors.primary,
  },
  statusText: {
    color: EcoColors.onSurface,
  },
  plantInfo: {
    marginBottom: 32, // spacing-6+
  },
  plantHealth: {
    color: EcoColors.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  plantSubtitle: {
    color: EcoColors.outline,
    letterSpacing: 1,
    marginBottom: 8,
  },
  plantName: {
    color: EcoColors.onSurfaceVariant,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: EcoColors.surfaceDim + '30',
    padding: 20,
    borderRadius: 20,
  },
  metricItem: {
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontWeight: 'bold',
    marginTop: 4,
    color: EcoColors.onSurface,
  },
  metricLabel: {
    color: EcoColors.outline,
  },
});
