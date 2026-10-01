import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/lib/tokens';

export interface DividerProps {
  spacing?: keyof typeof spacing;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Divider({
  spacing: marginSpacing,
  color,
  style,
}: DividerProps) {
  const { colors } = useTheme();
  const dividerColor = color || colors.line;
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: dividerColor },
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
