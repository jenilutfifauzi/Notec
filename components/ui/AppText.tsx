import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@/lib/tokens';

export type TypographyVariant = keyof typeof typography;

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  tabularNums?: boolean;
}

export function AppText({
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
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
