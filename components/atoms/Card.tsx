import React, { useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { radii, spacing } from '@/lib/tokens';
export type CardVariant = 'default' | 'metric';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export default function Card({
  children,
  style,
  variant = 'default',
  onPress,
  accessibilityLabel,
}: CardProps) {
  const { colors, shadows } = useTheme();
  const isMetric = variant === 'metric';

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.line,
          borderCurve: 'continuous',
          ...shadows.card,
        },
      }),
    [colors, shadows],
  );

  const containerStyles = [
    themedStyles.base,
    isMetric ? styles.metric : styles.default,
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          ...containerStyles,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  default: {
    borderRadius: radii['2xl'],
    padding: spacing['8'],
  },
  metric: {
    borderRadius: radii.xl,
    padding: spacing['7'],
  },
  pressed: {
    opacity: 0.9,
  },
});
