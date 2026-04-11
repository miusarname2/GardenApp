import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { EcoColors } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  noBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  backgroundColor = EcoColors.surfaceContainerLow,
  noBorder = true, // As per design, no 1px borders
}) => {
  return (
    <View style={[styles.card, { backgroundColor }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24, // xl roundedness
    padding: 24,
    shadowColor: EcoColors.onSurface,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4, // For Android
  },
});