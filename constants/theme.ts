/**
 * Eco-Tech Digital Garden Design System
 * Colors, fonts, and themes based on the "Living Interface" philosophy.
 */

import { Platform, TextStyle } from 'react-native';

// Eco-Tech Color Palette
export const EcoColors = {
  // Primary Colors
  primary: '#206223',
  primaryContainer: '#3a7b3a',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#cbffc2',

  // Secondary Colors
  secondary: '#286b33',
  secondaryContainer: '#abf4ac',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#2e7238',

  // Tertiary Colors
  tertiary: '#325c5a',
  tertiaryContainer: '#4b7572',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#ccfaf6',
  tertiaryFixed: '#beebe7',
  tertiaryFixedDim: '#a2cfcb',
  onTertiaryFixed: '#00201e',
  onTertiaryFixedVariant: '#224e4b',

  // Surfaces
  surface: '#f5fced',
  surfaceDim: '#d5dcce',
  surfaceBright: '#f5fced',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff6e7',
  surfaceContainer: '#e9f0e1',
  surfaceContainerHigh: '#e3ebdc',
  surfaceContainerHighest: '#dee5d6',

  // On Surfaces
  onSurface: '#171d14',
  onSurfaceVariant: '#40493d',
  surfaceTint: '#2a6b2c',

  // Outline & Variants
  outline: '#707a6c',
  outlineVariant: '#bfcaba',

  // Inverse
  inverseSurface: '#2c3228',
  inverseOnSurface: '#ecf3e4',
  inversePrimary: '#91d78a',

  // Error (fallback)
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Background
  background: '#f5fced',
  onBackground: '#171d14',
};

// Font Families based on loaded Google Fonts
export const Fonts = {
  headline: 'Manrope_600SemiBold',
  body: 'Inter_400Regular',
  label: 'Manrope_600SemiBold',
  mono: 'monospace',
  rounded: 'Manrope_600SemiBold',
};

// Theme for app
export const Colors = {
  light: {
    ...EcoColors,
    tint: EcoColors.primary,
    icon: EcoColors.outline,
    tabIconDefault: EcoColors.outline,
    tabIconSelected: EcoColors.primary,
  },
  dark: {
    ...EcoColors, // For MVP, use same colors; can extend later
    tint: EcoColors.primary,
    icon: EcoColors.outline,
    tabIconDefault: EcoColors.outline,
    tabIconSelected: EcoColors.primary,
  },
};

// Typography Sizes (approximate rem to px, adjust as needed)
export const Typography: Record<string, TextStyle> = {
  displayLarge: { fontSize: 56, fontFamily: Fonts?.headline, fontWeight: '800' },
  displayMedium: { fontSize: 45, fontFamily: Fonts?.headline, fontWeight: '700' },
  displaySmall: { fontSize: 36, fontFamily: Fonts?.headline, fontWeight: '600' },

  headlineLarge: { fontSize: 32, fontFamily: Fonts?.headline, fontWeight: '600' },
  headlineMedium: { fontSize: 28, fontFamily: Fonts?.headline, fontWeight: '600' },
  headlineSmall: { fontSize: 24, fontFamily: Fonts?.headline, fontWeight: '600' },

  titleLarge: { fontSize: 22, fontFamily: Fonts?.body, fontWeight: '500' },
  titleMedium: { fontSize: 16, fontFamily: Fonts?.body, fontWeight: '500' },
  titleSmall: { fontSize: 14, fontFamily: Fonts?.body, fontWeight: '500' },

  bodyLarge: { fontSize: 16, fontFamily: Fonts?.body, fontWeight: '400' },
  bodyMedium: { fontSize: 14, fontFamily: Fonts?.body, fontWeight: '400' },
  bodySmall: { fontSize: 12, fontFamily: Fonts?.body, fontWeight: '400' },

  labelLarge: { fontSize: 14, fontFamily: Fonts?.label, fontWeight: '500', textTransform: 'uppercase' },
  labelMedium: { fontSize: 12, fontFamily: Fonts?.label, fontWeight: '500', textTransform: 'uppercase' },
  labelSmall: { fontSize: 11, fontFamily: Fonts?.label, fontWeight: '500', textTransform: 'uppercase' },
};
