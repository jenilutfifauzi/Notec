import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, spacing, typography } from '@/lib/tokens';

export interface EmptyStateProps {
  message: string;
  action?: { label: string; onPress: () => void };
  minHeight?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  message,
  action,
  minHeight = 120,
  icon,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, { minHeight }, style]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.message}>{message}</Text>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['6'],
  },
  iconWrap: {
    marginBottom: spacing['3'],
  },
  message: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionButton: {
    marginTop: spacing['4'],
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['6'],
    backgroundColor: colors.primaryPale,
    borderRadius: radii['4xl'],
    borderCurve: 'continuous',
  },
  actionText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
});
