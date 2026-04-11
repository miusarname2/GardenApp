import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, PermissionsAndroid, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing, withSequence } from 'react-native-reanimated';
import { BleManager, Device } from 'react-native-ble-plx';
import * as ExpoDevice from 'expo-device';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/Button';
import { EcoColors } from '@/constants/theme';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Se instancia fuera o a nivel global (lo ideal es un Singleton/Context)
const bleManager = new BleManager();

export default function BluetoothOnboardingScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Escaneo inicial automáticamente
    startScan();
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isScanGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        );
        const isConnectGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );
        const isFineLocationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return (
          isScanGranted === PermissionsAndroid.RESULTS.GRANTED &&
          isConnectGranted === PermissionsAndroid.RESULTS.GRANTED &&
          isFineLocationGranted === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }
    return true; // En iOS los permisos los pide automáticamente la librería nativa en info.plist
  };

  const startScan = async () => {
    const isGranted = await requestPermissions();
    if (!isGranted) {
      console.warn('Permisos no concedidos');
      return;
    }

    if (isScanning) return;

    setIsScanning(true);
    setDevices([]);
    setSelectedDeviceId(null);

    // Opcionalmente podemos filtrar por UUIDs, aquí pasamos `null` para detectar todo
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        if (error.message.includes('powered off')) {
          console.warn('Bluetooth está apagado. Por favor, enciéndelo e intenta de nuevo.');
        } else {
          console.warn('Error al escanear:', error);
        }
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices((prevDevices) => {
          if (!prevDevices.find(d => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    // Detener de forma automática luego de 15 segundos
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  };

  const handleConnect = async () => {
    if (!selectedDeviceId) return;
    
    bleManager.stopDeviceScan();
    setIsScanning(false);
    
    // Guardar que el onboarding fue completado
    await AsyncStorage.setItem('isOnboardingCompleted', 'true');
    
    // Aquí puedes añadir logic tipo `await bleManager.connectToDevice(selectedDeviceId)`
    // Para prototipo, saltamos al (tabs) directamente asumiendo conexión existosa
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
              ASEGÚRATE DE QUE TU SENSOR ESTÉ ENCENDIDO Y CERCA
            </ThemedText>
          </View>
        </View>

        {/* Devices List */}
        <View style={styles.devicesSection}>
          <View style={styles.devicesHeader}>
            <ThemedText type="labelSmall" style={styles.devicesTitle}>DISPOSITIVOS ENCONTRADOS</ThemedText>
            {isScanning && <View style={styles.pulseIndicator} />}
          </View>

          <View style={styles.deviceList}>
            {devices.map((device) => {
              const isSelected = selectedDeviceId === device.id;
              
              return (
                <TouchableOpacity 
                  key={device.id} 
                  activeOpacity={0.8}
                  onPress={() => setSelectedDeviceId(device.id)}
                  style={[styles.deviceItem, isSelected && styles.deviceItemSelected]}
                >
                  <View style={styles.deviceItemContent}>
                    <View style={[styles.deviceIcon, { backgroundColor: isSelected ? EcoColors.primaryContainer + '20' : EcoColors.surfaceContainerHighest + '50' }]}>
                      <MaterialIcons name={device.name?.toLowerCase().includes('sensor') ? 'grass' : 'sensors'} size={24} color={isSelected ? EcoColors.primary : EcoColors.outline} />
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText type="titleMedium" style={{ fontWeight: 'bold' }} numberOfLines={1}>{device.name}</ThemedText>
                      <ThemedText type="labelSmall" style={{ color: EcoColors.outline }}>Señal: {device.rssi ?? 'N/A'} dBm</ThemedText>
                    </View>
                  </View>
                  {isSelected ? (
                    <View style={styles.checkIcon}>
                      <MaterialIcons name="check" size={16} color={EcoColors.onPrimary} />
                    </View>
                  ) : (
                    <MaterialIcons name="chevron-right" size={24} color={EcoColors.outlineVariant} />
                  )}
                </TouchableOpacity>
              )
            })}

            {/* Ghost Loading Item */}
            {isScanning && (
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
            )}
            
            {!isScanning && devices.length === 0 && (
              <ThemedText type="bodyMedium" style={{ textAlign: 'center', opacity: 0.5, marginTop: 12 }}>No se encontraron dispositivos cercanos</ThemedText>
            )}
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
          disabled={!selectedDeviceId}
          style={{ marginBottom: 16, opacity: !selectedDeviceId ? 0.6 : 1 }}
        />
        <Button
          title="Buscar de nuevo"
          onPress={startScan}
          variant="tertiary"
          disabled={isScanning}
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
    flex: 1,
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