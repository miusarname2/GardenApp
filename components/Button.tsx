import React from 'react';
import { TouchableOpacity, Text, View, ViewStyle, TextStyle } from 'react-native';
import { EcoColors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle: ViewStyle = {
      borderRadius: 24, // xl roundedness ~1.5rem
      alignItems: 'center',
      justifyContent: 'center',
      ...getSizeStyle(),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          // Gradient will be applied
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: EcoColors.surfaceContainerHigh,
        };
      case 'tertiary':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseText: TextStyle = {
      fontWeight: 'bold',
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseText,
          color: EcoColors.onPrimary,
        };
      case 'secondary':
        return {
          ...baseText,
          color: EcoColors.onSecondaryContainer,
        };
      case 'tertiary':
        return {
          ...baseText,
          color: EcoColors.primary,
        };
      default:
        return baseText;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 24 };
      default: // medium
        return { paddingVertical: 12, paddingHorizontal: 20 };
    }
  };

  const buttonStyle = getButtonStyle();
  const textComputedStyle = getTextStyle();

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={style}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <LinearGradient
          colors={[EcoColors.primary, EcoColors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={buttonStyle}
        >
          <Text style={[textComputedStyle, textStyle]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={[textComputedStyle, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};