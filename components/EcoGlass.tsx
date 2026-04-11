import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { EcoColors } from '@/constants/theme';

interface EcoGlassProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  intensity?: number;
}

export const EcoGlass = ({ style, children, intensity = 20 }: EcoGlassProps) => {
  return (
    <BlurView intensity={intensity} tint="light" style={[styles.glass, style]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  glass: {
    backgroundColor: EcoColors.surface + 'CC', // 80% opacity fallback
    overflow: 'hidden',
    borderRadius: 24,
  },
});
