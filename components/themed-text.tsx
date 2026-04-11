import { StyleSheet, Text, type TextProps } from 'react-native';

import { EcoColors, Fonts, Typography } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: keyof typeof Typography | 'link' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'bodyMedium',
  ...rest
}: ThemedTextProps) {
  const defaultColor = EcoColors.onSurface;
  
  let mappedType = type;
  if (type === 'default') mappedType = 'bodyMedium';
  if (type === 'defaultSemiBold') mappedType = 'bodyLarge'; // mapping to roughly similar
  if (type === 'title') mappedType = 'headlineLarge';
  if (type === 'subtitle') mappedType = 'titleLarge';

  return (
    <Text
      style={[
        { color: defaultColor, fontFamily: Fonts?.body },
        mappedType === 'link' ? styles.link : Typography[mappedType] ? Typography[mappedType] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  link: {
    ...(Typography.bodyMedium as any),
    color: EcoColors.primary,
    textDecorationLine: 'underline',
  },
});
