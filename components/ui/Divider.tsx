import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing } from '@/lib/tokens';

export interface DividerProps {
  spacing?: keyof typeof spacing;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Divider({
  spacing: marginSpacing,
  color = colors.line,
  style,
}: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: color },
        marginSpacing ? { marginVertical: spacing[marginSpacing] } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
