import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EcoColors } from '@/constants/theme';
import { getPlantImageSource } from '@/constants/plant-images';

interface PlantHealthCardProps {
  style?: ViewStyle;
  plantName?: string;
  plantSpecies?: string;
  plantImage?: string;
  widgetTitle?: string;
  compact?: boolean;
}

export const PlantHealthCard = ({
  style,
  plantName = 'Fiddle Leaf Fig',
  plantSpecies = 'Ficus lyrata',
  plantImage = 'garden',
  widgetTitle = 'CURRENT PLANT',
  compact = false,
}: PlantHealthCardProps) => {
  return (
    <View style={style}>
      <View style={[styles.heroContainer, compact && styles.compactHeroContainer]}>
        <Image
          source={getPlantImageSource(plantImage)}
          style={styles.heroImage}
          contentFit="cover"
        />

        <BlurView intensity={80} tint="light" style={[styles.floatingBadge, compact && styles.compactFloatingBadge]}>
          <View>
            <ThemedText type="labelSmall" style={styles.badgeLabel}>{widgetTitle}</ThemedText>
            <ThemedText type="headlineMedium" style={[styles.badgeTitle, compact && styles.compactBadgeTitle]}>{plantName}</ThemedText>
            {plantSpecies.length > 0 && (
              <ThemedText style={styles.badgeSpecies}>{plantSpecies}</ThemedText>
            )}
          </View>
          <View style={styles.statusPill}>
            <ThemedText type="labelSmall" style={styles.statusPillText}>HEALTHY</ThemedText>
          </View>
        </BlurView>
      </View>

      <View style={[styles.editorialHeader, compact && styles.compactEditorialHeader]}>
        <ThemedText type="labelSmall" style={styles.sectionLabel}>REAL-TIME METRICS</ThemedText>
        <ThemedText type="headlineLarge" style={styles.sectionTitle}>Huerto Digital</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    height: 400,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#171d14',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 8,
    marginTop: 8,
  },
  compactHeroContainer: {
    height: 240,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 252, 237, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  compactFloatingBadge: {
    bottom: 12,
    left: 12,
    right: 12,
    padding: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#707a6c',
    marginBottom: 4,
  },
  badgeTitle: {
    fontWeight: 'bold',
    color: '#171d14',
  },
  compactBadgeTitle: {
    fontSize: 17,
    lineHeight: 21,
  },
  badgeSpecies: {
    fontSize: 12,
    color: '#707a6c',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: 'rgba(32, 98, 35, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
  },
  statusPillText: {
    color: '#206223',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editorialHeader: {
    marginTop: 40,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  compactEditorialHeader: {
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#707a6c',
  },
  sectionTitle: {
    fontWeight: '800',
    color: '#171d14',
    letterSpacing: -0.5,
    marginTop: 4,
  },
});
