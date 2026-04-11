import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Linking,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { EcoColors } from "@/constants/theme";

const { width } = Dimensions.get("window");

const PulseCircle = ({ delay = 0 }: { delay?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withDelay(
        delay,
        withTiming(1.5, { duration: 3000, easing: Easing.out(Easing.quad) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withDelay(
        delay,
        withTiming(0, { duration: 3000, easing: Easing.out(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseCircle, animatedStyle]} />;
};

export default function SettingsScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Record<string, Device>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  const manager = useMemo(() => new BleManager(), []);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          result["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.BLUETOOTH_CONNECT"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles it via Info.plist / user prompt on first scan
  };

  const startScan = async () => {
    if (isScanning) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn("Bluetooth permissions denied");
      return;
    }

    setIsScanning(true);
    setDevices({}); // Clear previous list
    setCurrentPage(1); // Reset pagination

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn("Scan error:", error);
        setIsScanning(false);
        return;
      }

      if (device) {
        setDevices((prev) => ({
          ...prev,
          [device.id]: device,
        }));
      }
    });

    // Stop scan after 10 seconds
    if (scanTimeout.current) clearTimeout(scanTimeout.current);
    scanTimeout.current = setTimeout(() => {
      stopScan();
    }, 10000);
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
      manager.destroy();
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    };
  }, [manager]);

  const sortedDevices = Object.values(devices).sort(
    (a, b) => (b.rssi || -100) - (a.rssi || -100),
  );

  // Pagination logic
  const totalPages = Math.ceil(sortedDevices.length / PAGE_SIZE);
  const paginatedDevices = sortedDevices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const openTutorial = () => {
    Linking.openURL("https://youtu.be/dQw4w9WgXcQ?si=jxJGcK9vLzsNg7rW");
  };

  const openManual = () => {
    Linking.openURL(
      "https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf",
    );
  };

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <SafeAreaView edges={["top"]} style={styles.topBar}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <MaterialIcons
              name="local-florist"
              size={24}
              color={EcoColors.primary}
            />
            <ThemedText style={styles.headerTitle}>Conectar Huerto</ThemedText>
          </View>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() =>
              manager.state().then((s) => console.log("BLE State:", s))
            }
          >
            <MaterialIcons
              name="bluetooth-connected"
              size={24}
              color={EcoColors.primary}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connection Visualizer */}
        <View style={styles.visualizerSection}>
          <View style={styles.pulseContainer}>
            {isScanning && (
              <>
                <PulseCircle delay={0} />
                <PulseCircle delay={1000} />
              </>
            )}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.scannerDisk}
              onPress={isScanning ? stopScan : startScan}
            >
              <LinearGradient
                colors={
                  isScanning
                    ? ["#3a7b3a", EcoColors.primary]
                    : [EcoColors.primary, "#3a7b3a"]
                }
                style={styles.scannerGradient}
              >
                <MaterialIcons
                  name={isScanning ? "bluetooth-audio" : "bluetooth-searching"}
                  size={40}
                  color="white"
                />
              </LinearGradient>
              <ThemedText style={styles.scannerStatus}>
                {isScanning ? "Detener" : "Buscando..."}
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.scannerInstructions}>
            {isScanning
              ? "Escaneando dispositivos cercanos..."
              : "Asegúrate de que tu sensor esté encendido"}
          </ThemedText>
        </View>

        {/* Discovered Devices */}
        <View style={styles.devicesSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              Dispositivos Cerca
            </ThemedText>
            <View style={styles.countBadge}>
              <ThemedText style={styles.countText}>
                {sortedDevices.length} encontrados
              </ThemedText>
            </View>
          </View>

          <View style={styles.deviceList}>
            {sortedDevices.length === 0 && !isScanning && (
              <ThemedText style={styles.emptyText}>
                Presiona el círculo para buscar sensores.
              </ThemedText>
            )}

            {paginatedDevices.map((device, index) => (
              <TouchableOpacity
                key={device.id}
                style={[
                  styles.deviceCard,
                  index === 0 && currentPage === 1 && styles.deviceCardActive,
                ]}
              >
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceIconContainer}>
                    <MaterialIcons
                      name={device.name ? "sensors" : "bluetooth"}
                      size={24}
                      color={
                        device.name ? EcoColors.primary : EcoColors.outline
                      }
                    />
                  </View>
                  <View>
                    <ThemedText style={styles.deviceName}>
                      {device.name || "Sensor sin nombre"}
                    </ThemedText>
                    <ThemedText style={styles.deviceStatus}>
                      ID: {device.id}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.deviceAction}>
                  <SignalBars
                    level={Math.max(
                      1,
                      Math.min(
                        4,
                        Math.floor((100 + (device.rssi || -100)) / 15),
                      ),
                    )}
                    color={EcoColors.primary}
                  />
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color={EcoColors.outline}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((prev) => prev - 1)}
                style={[styles.pageBtn, currentPage === 1 && { opacity: 0.3 }]}
              >
                <MaterialIcons
                  name="navigate-before"
                  size={24}
                  color={EcoColors.primary}
                />
              </TouchableOpacity>
              <ThemedText style={styles.pageIndicator}>
                Página {currentPage} de {totalPages}
              </ThemedText>
              <TouchableOpacity
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage((prev) => prev + 1)}
                style={[
                  styles.pageBtn,
                  currentPage === totalPages && { opacity: 0.3 },
                ]}
              >
                <MaterialIcons
                  name="navigate-next"
                  size={24}
                  color={EcoColors.primary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Connectivity Guide */}
        <View style={styles.guideCard}>
          <LinearGradient
            colors={[EcoColors.tertiaryFixed, "#beebe7"]}
            style={styles.guideGradient}
          >
            <View style={styles.guideContent}>
              <ThemedText style={styles.guideTitle}>
                ¿Problemas al conectar?
              </ThemedText>
              <ThemedText style={styles.guideDesc}>
                Asegúrate de que el sensor Bluetooth LE esté a menos de 2 metros
                del dispositivo móvil.
              </ThemedText>
              <View style={styles.guideButtons}>
                <TouchableOpacity
                  style={styles.guideMainBtn}
                  onPress={openTutorial}
                >
                  <ThemedText style={styles.guideMainBtnText}>
                    Ver tutorial
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.guideSecondaryBtn}
                  onPress={openManual}
                >
                  <MaterialIcons
                    name="description"
                    size={16}
                    color={EcoColors.onTertiaryFixed}
                  />
                  <ThemedText style={styles.guideSecondaryBtnText}>
                    Manual de Usuario
                  </ThemedText>
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
    {[1, 2, 3, 4].map((i) => (
      <View
        key={i}
        style={[
          styles.signalBar,
          {
            height: i * 4,
            backgroundColor: i <= level ? color : EcoColors.outlineVariant,
          },
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
    backgroundColor: "#eff6e7",
    zIndex: 10,
  },
  headerContent: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 22,
    color: EcoColors.primary,
    letterSpacing: -0.5,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 150,
  },
  visualizerSection: {
    alignItems: "center",
    paddingVertical: 40,
  },
  pulseContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 32,
  },
  pulseCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(32, 98, 35, 0.15)",
  },
  scannerDisk: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#171d14",
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  scannerStatus: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: EcoColors.primary,
  },
  scannerInstructions: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: EcoColors.outline,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  devicesSection: {
    marginTop: 24,
    minHeight: 200,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 20,
    color: "#171d14",
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: EcoColors.primaryFixed,
    borderRadius: 99,
  },
  countText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: EcoColors.primary,
  },
  deviceList: {
    gap: 16,
  },
  emptyText: {
    textAlign: "center",
    color: EcoColors.outline,
    fontFamily: "Inter_500Medium",
    paddingVertical: 40,
  },
  deviceCard: {
    backgroundColor: EcoColors.surfaceContainerLow,
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#171d14",
  },
  deviceStatus: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: EcoColors.outline,
  },
  deviceAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  signalContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 20,
  },
  signalBar: {
    width: 4,
    borderRadius: 2,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 16,
  },
  pageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pageIndicator: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: EcoColors.primary,
  },
  guideCard: {
    marginTop: 40,
    borderRadius: 32,
    overflow: "hidden",
  },
  guideGradient: {
    padding: 24,
    position: "relative",
  },
  guideContent: {
    zIndex: 10,
  },
  guideTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: EcoColors.onTertiaryFixed,
    marginBottom: 8,
  },
  guideDesc: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: EcoColors.onTertiaryFixedVariant,
    lineHeight: 20,
    marginBottom: 20,
  },
  guideButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  guideMainBtn: {
    backgroundColor: EcoColors.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  guideMainBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  guideSecondaryBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(50, 92, 90, 0.1)",
  },
  guideSecondaryBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: EcoColors.onTertiaryFixed,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  guideBackgroundIcon: {
    position: "absolute",
    right: -10,
    bottom: -10,
    transform: [{ rotate: "15deg" }],
  },
});
