import { Image } from 'expo-image';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EcoColors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const handleStart = () => {
    // Navigate to onboarding
    router.push('/bluetooth-onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-HQcovzSZ0JCVgEewlzCaQRSSbd7AbEI2718CDkNpRL1-fE1vzDQ5YO_D19TavfBshORogGvNRs-meVwodt_EDOlAFjPLyJHba18G7yTiFyNHTsB8ywpfbQm-vFCqJcEUC3kO1qbS29z38jqjvm8uKL3I9K6elX2V7iX30mRFqqGbGEniYXcwg4LUMc6f45ENFJNvNogta-Nhwn0F9l-UDtoSBn06PUdv6mJO6e9sfyIg6Qsr8XRDwTnpA0LY_vjZHfETDkUcnaYb' }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.overlayContent}>
              <View style={styles.overlayIcon}>
                <MaterialIcons name="eco" size={32} color={EcoColors.primary} />
              </View>
              <ThemedText type="bodySmall" style={styles.overlaySubtitle}>
                Optimización Biométrica
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.overlayDescription}>
                Sincroniza tus plantas con tecnología de precisión.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="labelMedium" style={styles.subtitle}>
              Bienvenido al Futuro
            </ThemedText>
            <ThemedText type="displaySmall" style={styles.title}>
              Tu Huerto, Digitalizado
            </ThemedText>
          </View>

          <ThemedText type="bodyLarge" style={styles.description}>
            Transforma tu espacio verde con una interfaz inteligente que respira contigo. Monitorea el pulso vital de tus plantas y deja que la tecnología cuide de la naturaleza.
          </ThemedText>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title="Comenzar"
              onPress={handleStart}
              variant="primary"
              size="large"
            />
          </View>
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
    flexGrow: 1,
  },
  heroContainer: {
    height: 400,
    position: 'relative',
    marginBottom: 32,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  overlayContent: {
    backgroundColor: EcoColors.surface + '80', // 80% opacity
    padding: 24,
    margin: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  overlayIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: EcoColors.primaryContainer + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  overlaySubtitle: {
    color: EcoColors.onSurface,
    fontWeight: 'bold',
  },
  overlayDescription: {
    color: EcoColors.onSurfaceVariant,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    color: EcoColors.outline,
    marginBottom: 8,
  },
  title: {
    color: EcoColors.primary,
    textAlign: 'center',
    fontWeight: '800',
    lineHeight: 48,
  },
  description: {
    textAlign: 'center',
    color: EcoColors.onSurfaceVariant,
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    marginBottom: 48,
  },
});
