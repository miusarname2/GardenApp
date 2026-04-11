import React from 'react';
import { StyleSheet, View, ViewStyle, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/themed-text';

import Animated, { useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';

interface PlantHealthCardProps {
  style?: ViewStyle;
  metrics?: {
    hydration: number;
    light: number;
    temp: number;
    humidity: number;
    batPanel: number;
    batSys: number;
  };
}

export const PlantHealthCard = ({ style, metrics }: PlantHealthCardProps) => {
  // Default values if no metrics provided
  const data = metrics || {
    hydration: 68,
    light: 1200,
    temp: 24,
    humidity: 52,
    batPanel: 92,
    batSys: 78
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: withDelay(300, withTiming(`${data.hydration}%`, { duration: 1000 })),
  }));

  return (
    <View style={style}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8eEZt2iLE0DsKwb5g5WkiaXJ3HAMQqa1wwGBNWDtdjTnQ6xrdkcxxAxm_hi2-u-aHz_8cKk3GAOPAwSHrYYXqYY5WM377E-sCj0NvAtQaoPZlv0O6-svPqbUcmuPXEzlmXJU52z5b1CZPwzVxa6g-jn32KtonlDZdeY8qcczAlyVIVUKSp40gwRldHTBpHrS8KlyL6EKB17456PyNhZ6bozJm7eZ_YA3irUUMdUHAxy0yh0Q0UZ2Sz7GhCSlqaDTh59c_j4SSNcZY' }}
          style={styles.heroImage}
          contentFit="cover"
        />
        
        {/* Floating ID Badge */}
        <BlurView intensity={80} tint="light" style={styles.floatingBadge}>
          <View>
            <ThemedText type="labelSmall" style={styles.badgeLabel}>CURRENT PLANT</ThemedText>
            <ThemedText type="headlineMedium" style={styles.badgeTitle}>Fiddle Leaf Fig</ThemedText>
          </View>
          <View style={styles.statusPill}>
            <ThemedText type="labelSmall" style={styles.statusPillText}>HEALTHY</ThemedText>
          </View>
        </BlurView>
      </View>

      {/* Editorial Headline */}
      <View style={styles.editorialHeader}>
        <ThemedText type="labelSmall" style={styles.sectionLabel}>REAL-TIME METRICS</ThemedText>
        <ThemedText type="headlineLarge" style={styles.sectionTitle}>Huerto Digital</ThemedText>
      </View>

      {/* Stats Bento Grid */}
      <View style={styles.gridContainer}>
        
        {/* Hydration Card */}
        <View style={[styles.bentoCard, { backgroundColor: '#eff6e7' }]}>
          <View>
            <MaterialIcons name="water-drop" size={24} color="#206223" style={styles.cardIcon} />
            <ThemedText type="labelSmall" style={styles.cardSubtitle}>Hydration</ThemedText>
          </View>
          <View style={styles.cardBottom}>
            <ThemedText type="displaySmall" style={styles.cardValue}>{data.hydration}%</ThemedText>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, progressStyle]} />
            </View>
          </View>
        </View>

        {/* Light Card */}
        <View style={[styles.bentoCard, { backgroundColor: '#dee5d6' }]}>
           <View>
            <MaterialIcons name="wb-sunny" size={24} color="#325c5a" style={styles.cardIcon} />
            <ThemedText type="labelSmall" style={styles.cardSubtitle}>Light Level</ThemedText>
          </View>
          <View style={styles.cardBottom}>
            <ThemedText type="displaySmall" style={styles.cardValue}>{(data.light / 1000).toFixed(1)}k</ThemedText>
            <ThemedText type="labelSmall" style={styles.cardDetail}>LUX • OPTIMAL</ThemedText>
          </View>
        </View>

        {/* Temp Card */}
        <View style={[styles.bentoCard, { backgroundColor: '#e3ebdc' }]}>
          <View>
            <MaterialIcons name="device-thermostat" size={24} color="#ba1a1a" style={styles.cardIcon} />
            <ThemedText type="labelSmall" style={styles.cardSubtitle}>Temp</ThemedText>
          </View>
          <View style={styles.cardBottom}>
             <ThemedText type="displaySmall" style={styles.cardValue}>{data.temp}°C</ThemedText>
          </View>
        </View>

        {/* Humidity Card */}
        <View style={[styles.bentoCard, { backgroundColor: '#e9f0e1' }]}>
          <View>
            <MaterialIcons name="water" size={24} color="#286b33" style={styles.cardIcon} />
            <ThemedText type="labelSmall" style={styles.cardSubtitle}>Humidity</ThemedText>
          </View>
          <View style={styles.cardBottom}>
             <ThemedText type="displaySmall" style={styles.cardValue}>{data.humidity}%</ThemedText>
          </View>
        </View>

        {/* Batería de Panel Card */}
        <View style={[styles.bentoCard, { backgroundColor: '#eff6e7' }]}>
          <View>
            <MaterialIcons name="solar-power" size={24} color="#206223" style={styles.cardIcon} />
            <ThemedText type="labelSmall" style={styles.cardSubtitle}>Batería de Panel</ThemedText>
          </View>
          <View style={styles.cardBottom}>
             <ThemedText type="displaySmall" style={styles.cardValue}>{data.batPanel}%</ThemedText>
          </View>
        </View>

        {/* Batería de Sistema Card */}
        <View style={[styles.bentoCard, { backgroundColor: '#dee5d6' }]}>
          <View>
            <MaterialIcons name="battery-full" size={24} color="#325c5a" style={styles.cardIcon} />
            <ThemedText type="labelSmall" style={styles.cardSubtitle}>Batería de Sistema</ThemedText>
          </View>
          <View style={styles.cardBottom}>
             <ThemedText type="displaySmall" style={styles.cardValue}>{data.batSys}%</ThemedText>
          </View>
        </View>

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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  bentoCard: {
    width: '47.5%', // Half slightly reduced for the gap
    aspectRatio: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#707a6c',
  },
  cardBottom: {
    marginTop: 'auto',
  },
  cardValue: {
    fontWeight: '900',
    color: '#171d14',
    letterSpacing: -1,
  },
  cardDetail: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#707a6c',
    marginTop: 4,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#cbd8c2',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#206223',
    borderRadius: 3,
  },
});
