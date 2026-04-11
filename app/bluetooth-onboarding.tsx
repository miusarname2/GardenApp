import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing, withSequence } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/Button';
import { EcoColors } from '@/constants/theme';
import { router } from 'expo-router';

const PulseRing = ({ delay = 0, size = 300, color = EcoColors.primary + '20' }) => {
  const scale = useSharedValue(0.33);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.bezier(0.215, 0.61, 0.355, 1) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        false
      )
    );
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

export default function BluetoothOnboardingScreen() {
  const handleConnect = () => {
    // Connect logic
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <MaterialIcons name="eco" size={32} color={EcoColors.primary} />
          <ThemedText type="titleMedium" style={styles.logoText}>Chlorophyll Pro</ThemedText>
        </View>
        <ThemedText type="labelMedium" style={styles.stepText}>3 de 4</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section / Pulse Animation */}
        <View style={styles.heroSection}>
          <View style={styles.pulseContainer}>
            <PulseRing delay={0} size={300} />
            <PulseRing delay={1000} size={200} color={EcoColors.primary + '30'} />
            
            <View style={styles.iconContainer}>
              <MaterialIcons name="bluetooth-searching" size={40} color={EcoColors.tertiary} />
            </View>
          </View>
          
          <View style={styles.heroTextContainer}>
            <ThemedText type="headlineLarge" style={styles.heroTitle}>Buscando sensores</ThemedText>
            <ThemedText type="labelMedium" style={styles.heroSubtitle}>
              Asegúrate de que tu sensor esté encendido y cerca
            </ThemedText>
          </View>
        </View>

        {/* Devices List */}
        <View style={styles.devicesSection}>
          <View style={styles.devicesHeader}>
            <ThemedText type="labelSmall" style={styles.devicesTitle}>Dispositivos encontrados</ThemedText>
            <View style={styles.pulseIndicator} />
          </View>

          <View style={styles.deviceList}>
            {/* Device Item 1 (Selected/Active) */}
            <View style={[styles.deviceItem, styles.deviceItemSelected]}>
              <View style={styles.deviceItemContent}>
                <View style={[styles.deviceIcon, { backgroundColor: EcoColors.primaryContainer + '20' }]}>
                  <MaterialIcons name="grass" size={24} color={EcoColors.primary} />
                </View>
                <View>
                  <ThemedText type="titleMedium" style={{ fontWeight: 'bold' }}>Sensor Huerto A1</ThemedText>
                  <ThemedText type="labelSmall" style={{ color: EcoColors.outline }}>Señal fuerte • 1.2m de distancia</ThemedText>
                </View>
              </View>
              <View style={styles.checkIcon}>
                <MaterialIcons name="check" size={16} color={EcoColors.onPrimary} />
              </View>
            </View>

            {/* Device Item 2 */}
            <View style={styles.deviceItem}>
              <View style={styles.deviceItemContent}>
                <View style={[styles.deviceIcon, { backgroundColor: EcoColors.surfaceContainerHighest + '50' }]}>
                  <MaterialIcons name="park" size={24} color={EcoColors.outline} />
                </View>
                <View>
                  <ThemedText type="titleMedium" style={{ fontWeight: 'bold' }}>Garden Hub X</ThemedText>
                  <ThemedText type="labelSmall" style={{ color: EcoColors.outline }}>Señal media • 4.5m de distancia</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={EcoColors.outlineVariant} />
            </View>

            {/* Device Item 3 (Ghost) */}
            <View style={[styles.deviceItem, styles.deviceItemGhost]}>
              <View style={styles.deviceItemContent}>
                <View style={[styles.deviceIcon, { backgroundColor: EcoColors.surfaceContainerHighest + '20' }]}>
                  <MaterialIcons name="sensors" size={24} color={EcoColors.outlineVariant} />
                </View>
                <View>
                  <ThemedText type="titleMedium" style={{ fontWeight: 'bold', color: EcoColors.outline }}>Buscando otros...</ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          title="Conectar"
          onPress={handleConnect}
          variant="primary"
          size="large"
          style={{ marginBottom: 16 }}
        />
        <Button
          title="No veo mi dispositivo"
          onPress={() => {}}
          variant="tertiary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: EcoColors.primary,
    fontWeight: '800',
  },
  stepText: {
    color: EcoColors.outline,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    position: 'relative',
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 300,
  },
  pulseRing: {
    position: 'absolute',
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: EcoColors.surfaceContainerLowest,
    borderRadius: 24,
    shadowColor: EcoColors.onSurface,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroTextContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  heroTitle: {
    fontWeight: '800',
    color: EcoColors.onBackground,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: EcoColors.outline,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  devicesSection: {
    marginTop: 32,
    flex: 1,
  },
  devicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  devicesTitle: {
    color: EcoColors.outline,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    backgroundColor: EcoColors.primary,
    borderRadius: 4,
    // Add simple pulse animation if needed
  },
  deviceList: {
    gap: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: EcoColors.surfaceContainerLow,
    padding: 20,
    borderRadius: 24,
  },
  deviceItemSelected: {
    backgroundColor: EcoColors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: EcoColors.primary,
    shadowColor: EcoColors.onSurface,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
  deviceItemGhost: {
    backgroundColor: EcoColors.surfaceContainerLow + '50',
    borderWidth: 1,
    borderColor: EcoColors.outlineVariant + '40',
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  deviceItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: EcoColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
});