import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/Card';
import { GrowthTimeline, TimelineEvent } from '@/components/GrowthTimeline';
import { EcoColors } from '@/constants/theme';

const historyEvents: TimelineEvent[] = [
  {
    id: '1',
    date: 'Hoy, 08:30 AM',
    title: 'Nivel óptimo alcanzado',
    description: 'La Monstera ha estabilizado su humedad tras el último riego.',
    icon: 'water-drop',
  },
  {
    id: '2',
    date: 'Ayer, 18:00 PM',
    title: 'Alerta de luz baja',
    description: 'Se detectó menos luz de lo normal durante la tarde.',
    icon: 'wb-sunny',
  },
  {
    id: '3',
    date: 'Hace 3 días',
    title: 'Riego detectado',
    description: '+150ml de agua añadidos al sustrato. Humedad subió al 85%.',
    icon: 'opacity',
  },
  {
    id: '4',
    date: 'Hace 1 semana',
    title: 'Fertilizante aplicado',
    description: 'Nutrientes detectados. Nitrógeno en niveles adecuados.',
    icon: 'eco',
  },
];

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="headlineMedium" style={styles.title}>Historial y Comunidad</ThemedText>
          <ThemedText type="bodyMedium" style={styles.subtitle}>El diario de crecimiento de tu ecosistema</ThemedText>
        </View>

        {/* Growth Timeline Section */}
        <View style={styles.section}>
          <ThemedText type="titleLarge" style={styles.sectionTitle}>Timeline de la Monstera</ThemedText>
          <Card backgroundColor={EcoColors.surfaceContainerLowest} style={styles.timelineCard}>
            <GrowthTimeline events={historyEvents} />
          </Card>
        </View>

        {/* Community Section */}
        <View style={styles.section}>
          <View style={styles.communityHeader}>
            <ThemedText type="titleLarge" style={styles.sectionTitle}>Comunidad Pro</ThemedText>
            <MaterialIcons name="groups" size={28} color={EcoColors.secondary} />
          </View>

          <Card backgroundColor={EcoColors.surfaceContainerLow} style={styles.communityCard}>
             <View style={styles.communityItem}>
                <View style={styles.userAvatar}>
                  <MaterialIcons name="person" size={20} color={EcoColors.onSurface} />
                </View>
                <View style={styles.communityText}>
                  <ThemedText type="titleMedium" style={{ fontWeight: 'bold' }}>Jardín Vertical de Ana</ThemedText>
                  <ThemedText type="bodySmall" style={{ color: EcoColors.onSurfaceVariant }}>&quot;Logré reducir el consumo de agua un 20% usando los datos del sensor.&quot;</ThemedText>
                </View>
             </View>
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
    marginBottom: 32,
  },
  title: {
    color: EcoColors.primary,
    fontWeight: '800',
  },
  subtitle: {
    color: EcoColors.outline,
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: EcoColors.onSurface,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timelineCard: {
    padding: 24,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  communityCard: {
    padding: 20,
  },
  communityItem: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: EcoColors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityText: {
    flex: 1,
  },
});
