import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { EcoColors } from '@/constants/theme';
import { getPlantImageSource, PLANT_IMAGE_OPTIONS } from '@/constants/plant-images';
import { GardenPreferences, useWidgetPreferences } from '@/contexts/widget-preferences-context';

export default function PlantSettingsScreen() {
  const { preferences, isLoaded, loadError, savePreferences } = useWidgetPreferences();
  const [draft, setDraft] = useState<GardenPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isLoaded) setDraft(preferences);
  }, [isLoaded, preferences]);

  const save = async () => {
    const isPreset = PLANT_IMAGE_OPTIONS.some((option) => option.id === draft.plantImage);
    if (
      draft.plantImage.length > 0 &&
      !isPreset &&
      !/^(https?:\/\/|file:\/\/|content:\/\/|ph:\/\/|assets-library:\/\/)/i.test(draft.plantImage)
    ) {
      Alert.alert('Imagen no válida', 'Usa una URL http(s) o una URI de imagen local.');
      return;
    }

    setIsSaving(true);
    try {
      await savePreferences({
        ...preferences,
        plantName: draft.plantName,
        plantSpecies: draft.plantSpecies,
        plantImage: draft.plantImage || PLANT_IMAGE_OPTIONS[0].id,
      });
      router.back();
    } catch (error) {
      console.warn('[PlantSettings] Failed to save preferences:', error);
      Alert.alert('No se guardaron los cambios', 'Revisa el almacenamiento del dispositivo e inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText style={styles.loadingText}>Cargando preferencias…</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} accessibilityLabel="Cerrar">
          <MaterialIcons name="close" size={24} color={EcoColors.primary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Tu planta</ThemedText>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabledButton]}
          onPress={() => void save()}
          disabled={isSaving}
        >
          <ThemedText style={styles.saveButtonText}>{isSaving ? 'Guardando' : 'Guardar'}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loadError && <ThemedText style={styles.errorText}>{loadError}</ThemedText>}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tu planta</ThemedText>
          <ThemedText style={styles.helperText}>El nombre, especie y foto se comparten entre Dashboard e Historial.</ThemedText>
          <TextInput
            value={draft.plantName}
            onChangeText={(plantName) => setDraft((current) => ({ ...current, plantName }))}
            placeholder="Nombre de la planta"
            style={styles.input}
            maxLength={60}
          />
          <TextInput
            value={draft.plantSpecies}
            onChangeText={(plantSpecies) => setDraft((current) => ({ ...current, plantSpecies }))}
            placeholder="Especie"
            style={styles.input}
            maxLength={80}
          />

          <ThemedText style={styles.fieldLabel}>Fotos disponibles</ThemedText>
          <View style={styles.imageOptions}>
            {PLANT_IMAGE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.imageOption, draft.plantImage === option.id && styles.imageOptionSelected]}
                onPress={() => setDraft((current) => ({ ...current, plantImage: option.id }))}
                accessibilityRole="button"
                accessibilityLabel={`Usar foto: ${option.label}`}
              >
                <Image source={option.source} style={styles.optionImage} contentFit="cover" />
                <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          <ThemedText style={styles.fieldLabel}>Usar una imagen propia</ThemedText>
          <TextInput
            value={PLANT_IMAGE_OPTIONS.some((option) => option.id === draft.plantImage) ? '' : draft.plantImage}
            onChangeText={(plantImage) => setDraft((current) => ({ ...current, plantImage }))}
            placeholder="Pega la URL o URI de la imagen"
            autoCapitalize="none"
            keyboardType="url"
            style={styles.input}
          />
          <ThemedText style={styles.helperText}>Admite URL https:// o URI local file:// y se ajusta automáticamente al espacio de la planta.</ThemedText>
          {!PLANT_IMAGE_OPTIONS.some((option) => option.id === draft.plantImage) && draft.plantImage.length > 0 && (
            <Image source={getPlantImageSource(draft.plantImage)} style={styles.imagePreview} contentFit="cover" />
          )}
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
  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#dce6d5',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: EcoColors.primary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: EcoColors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  section: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#eff6e7',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#171d14',
    marginBottom: 4,
  },
  helperText: {
    color: '#707a6c',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#40493d',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    color: '#171d14',
    borderWidth: 1,
    borderColor: '#dce6d5',
  },
  imageOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageOption: {
    flex: 1,
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#ffffff',
  },
  imageOptionSelected: {
    borderColor: EcoColors.primary,
  },
  optionImage: {
    width: '100%',
    height: 90,
    borderRadius: 11,
  },
  optionLabel: {
    fontSize: 12,
    color: '#40493d',
    textAlign: 'center',
    marginVertical: 6,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 18,
    marginTop: 4,
  },
  loadingText: {
    margin: 24,
    color: EcoColors.primary,
  },
  errorText: {
    color: '#9b2c2c',
    backgroundColor: '#fff0f0',
    padding: 12,
    borderRadius: 12,
  },
});
