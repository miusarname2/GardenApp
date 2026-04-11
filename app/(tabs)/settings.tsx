import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { EcoColors } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="headlineMedium" style={styles.title}>Settings</ThemedText>
        <ThemedText style={{ color: EcoColors.outline, marginTop: 12 }}>
          Configuración del ecosistema...
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EcoColors.background,
  },
  content: {
    padding: 24,
    paddingTop: 32,
  },
  title: {
    fontWeight: '800',
    color: EcoColors.primary,
  }
});
