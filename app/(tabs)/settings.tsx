import React, { useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  Easing 
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { EcoColors } from '@/constants/theme';

const { width } = Dimensions.get('window');

const PulseCircle = ({ delay = 0 }: { delay?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withDelay(delay, withTiming(1.5, { duration: 3000, easing: Easing.out(Easing.quad) })),
      -1,
      false
    );
    opacity.value = withRepeat(
      withDelay(delay, withTiming(0, { duration: 3000, easing: Easing.out(Easing.quad) })),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseCircle, animatedStyle]} />;
};

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="local-florist" size={24} color={EcoColors.primary} />
            <ThemedText style={styles.headerTitle}>Conectar Huerto</ThemedText>
          </View>
          <TouchableOpacity style={styles.headerIconButton}>
            <MaterialIcons name="bluetooth-connected" size={24} color={EcoColors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Connection Visualizer */}
        <View style={styles.visualizerSection}>
          <View style={styles.pulseContainer}>
            <PulseCircle delay={0} />
            <PulseCircle delay={1000} />
            <TouchableOpacity activeOpacity={0.9} style={styles.scannerDisk}>
              <LinearGradient
                colors={[EcoColors.primary, '#3a7b3a']}
                style={styles.scannerGradient}
              >
                <MaterialIcons name="bluetooth-searching" size={40} color="white" />
              </LinearGradient>
              <ThemedText style={styles.scannerStatus}>Buscando...</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.scannerInstructions}>
            Asegúrate de que tu sensor esté encendido
          </ThemedText>
        </View>

        {/* Discovered Devices */}
        <View style={styles.devicesSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Dispositivos Cerca</ThemedText>
            <View style={styles.countBadge}>
              <ThemedText style={styles.countText}>3 encontrados</ThemedText>
            </View>
          </View>

          <View style={styles.deviceList}>
            {/* Device 1 */}
            <TouchableOpacity style={[styles.deviceCard, styles.deviceCardActive]}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceIconContainer}>
                  <MaterialIcons name="sensors" size={24} color={EcoColors.primary} />
                </View>
                <View>
                  <ThemedText style={styles.deviceName}>Huerto_Frontal_01</ThemedText>
                  <ThemedText style={styles.deviceStatus}>Estado: Disponible</ThemedText>
                </View>
              </View>
              <View style={styles.deviceAction}>
                 <SignalBars level={4} color={EcoColors.primary} />
                 <MaterialIcons name="chevron-right" size={24} color={EcoColors.outline} />
              </View>
            </TouchableOpacity>

            {/* Device 2 */}
            <TouchableOpacity style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceIconContainer}>
                  <MaterialIcons name="eco" size={24} color={EcoColors.outline} />
                </View>
                <View>
                  <ThemedText style={styles.deviceName}>Invernadero_S2</ThemedText>
                  <ThemedText style={styles.deviceStatus}>Estado: Disponible</ThemedText>
                </View>
              </View>
              <View style={styles.deviceAction}>
                 <SignalBars level={2} color={EcoColors.primary} />
                 <MaterialIcons name="chevron-right" size={24} color={EcoColors.outline} />
              </View>
            </TouchableOpacity>

            {/* Device 3 */}
            <View style={[styles.deviceCard, { opacity: 0.6 }]}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceIconContainer}>
                  <MaterialIcons name="router" size={24} color={EcoColors.outline} />
                </View>
                <View>
                  <ThemedText style={styles.deviceName}>Central_Hub_99</ThemedText>
                  <ThemedText style={styles.deviceStatus}>Señal débil</ThemedText>
                </View>
              </View>
              <View style={styles.deviceAction}>
                 <SignalBars level={1} color={EcoColors.error} />
                 <MaterialIcons name="lock" size={20} color={EcoColors.outline} />
              </View>
            </View>
          </View>
        </View>

        {/* Connectivity Guide */}
        <View style={styles.guideCard}>
          <LinearGradient
            colors={[EcoColors.tertiaryFixed, '#beebe7']}
            style={styles.guideGradient}
          >
            <View style={styles.guideContent}>
              <ThemedText style={styles.guideTitle}>¿Problemas al conectar?</ThemedText>
              <ThemedText style={styles.guideDesc}>
                Asegúrate de que el sensor Bluetooth LE esté a menos de 2 metros del dispositivo móvil.
              </ThemedText>
              <View style={styles.guideButtons}>
                <TouchableOpacity style={styles.guideMainBtn}>
                  <ThemedText style={styles.guideMainBtnText}>Ver tutorial</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.guideSecondaryBtn}>
                  <MaterialIcons name="description" size={16} color={EcoColors.onTertiaryFixed} />
                  <ThemedText style={styles.guideSecondaryBtnText}>Manual de Usuario</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            <MaterialIcons 
              name="help" 
              size={120} 
              color="rgba(0, 32, 30, 0.05)" 
              style={styles.guideBackgroundIcon} 
            />
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const SignalBars = ({ level, color }: { level: number; color: string }) => (
  <View style={styles.signalContainer}>
    {[1, 2, 3, 4].map(i => (
      <View 
        key={i} 
        style={[
          styles.signalBar, 
          { height: i * 4, backgroundColor: i <= level ? color : EcoColors.outlineVariant }
        ]} 
      />
    ))}
  </View>
);

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    color: EcoColors.primary,
    letterSpacing: -0.5,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  visualizerSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  pulseContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 32,
  },
  pulseCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(32, 98, 35, 0.15)',
  },
  scannerDisk: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171d14',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 10,
  },
  scannerGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scannerStatus: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: EcoColors.primary,
  },
  scannerInstructions: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: EcoColors.outline,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  devicesSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: '#171d14',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: EcoColors.primaryFixed,
    borderRadius: 99,
  },
  countText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: EcoColors.primary,
  },
  deviceList: {
    gap: 16,
  },
  deviceCard: {
    backgroundColor: EcoColors.surfaceContainerLow,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceCardActive: {
    borderLeftWidth: 4,
    borderLeftColor: EcoColors.primary,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#171d14',
  },
  deviceStatus: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: EcoColors.outline,
  },
  deviceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 20,
  },
  signalBar: {
    width: 4,
    borderRadius: 2,
  },
  guideCard: {
    marginTop: 40,
    borderRadius: 32,
    overflow: 'hidden',
  },
  guideGradient: {
    padding: 24,
    position: 'relative',
  },
  guideContent: {
    zIndex: 10,
  },
  guideTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: EcoColors.onTertiaryFixed,
    marginBottom: 8,
  },
  guideDesc: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: EcoColors.onTertiaryFixedVariant,
    lineHeight: 20,
    marginBottom: 20,
  },
  guideButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  guideMainBtn: {
    backgroundColor: EcoColors.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  guideMainBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guideSecondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(50, 92, 90, 0.1)',
  },
  guideSecondaryBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: EcoColors.onTertiaryFixed,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guideBackgroundIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{ rotate: '15deg' }],
  },
});
