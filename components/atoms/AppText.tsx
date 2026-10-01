import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { typography, fontFamilies } from '@/lib/tokens';
export type TypographyVariant = keyof typeof typography;

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  tabularNums?: boolean;
}

export default function AppText({
  variant = 'body',
  color,
  tabularNums = false,
  style,
  ...props
}: AppTextProps) {
  const { colors } = useTheme();
  const textColor = color || colors.ink;
  const typeStyle = typography[variant];

  return (
    <RNText
      style={[
        styles.base,
        typeStyle,
        { color: textColor },
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
