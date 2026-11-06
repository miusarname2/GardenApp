import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface DashboardMetricCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  value: string;
  detail?: string;
  color: string;
  backgroundColor: string;
  style?: ViewStyle;
}

export function DashboardMetricCard({
  icon,
  title,
  value,
  detail,
  color,
  backgroundColor,
  style,
}: DashboardMetricCardProps) {
  return (
    <View style={[styles.card, style, { backgroundColor }]}>
      <View>
        <MaterialIcons name={icon} size={24} color={color} style={styles.icon} />
        <ThemedText style={styles.subtitle}>{title}</ThemedText>
      </View>
      <View style={styles.bottom}>
        <ThemedText style={styles.value}>{value}</ThemedText>
        {detail && <ThemedText style={styles.detail}>{detail}</ThemedText>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 160,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  icon: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#707a6c',
  },
  bottom: {
    marginTop: 16,
  },
  value: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 29,
    color: '#171d14',
    letterSpacing: -1,
  },
  detail: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#707a6c',
    marginTop: 4,
  },
});
