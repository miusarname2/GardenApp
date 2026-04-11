import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { EcoColors } from '@/constants/theme';

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChangeText,
  label,
  error,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          inputStyle,
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={EcoColors.onSurfaceVariant}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: EcoColors.onSurface,
    marginBottom: 8,
  },
  input: {
    backgroundColor: EcoColors.surfaceContainerLowest,
    borderRadius: 12, // md roundedness ~0.75rem
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: EcoColors.onSurface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: EcoColors.primary + '40', // 40% opacity
    shadowColor: EcoColors.surfaceTint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  error: {
    fontSize: 12,
    color: EcoColors.error,
    marginTop: 4,
  },
});