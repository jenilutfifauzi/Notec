import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, typography, fontFamilies } from '@/lib/tokens';

export type TypographyVariant = keyof typeof typography;

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  tabularNums?: boolean;
}

export default function AppText({
  variant = 'body',
  color = colors.ink,
  tabularNums = false,
  style,
  ...props
}: AppTextProps) {
  const typeStyle = typography[variant];

  return (
    <RNText
      style={[
        styles.base,
        typeStyle,
        { color },
        tabularNums && styles.tabular,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamilies.regular,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
