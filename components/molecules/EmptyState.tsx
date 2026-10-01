import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';

export interface EmptyStateProps {
  message: string;
  action?: { label: string; onPress: () => void };
  minHeight?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({
  message,
  action,
  minHeight = 120,
  icon,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { minHeight }, style]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.primaryPale }, pressed && styles.pressed]}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>{action.label}</Text>
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
    textAlign: 'center',
    lineHeight: 18,
  },
  actionButton: {
    marginTop: spacing['4'],
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['6'],
    borderRadius: radii['4xl'],
    borderCurve: 'continuous',
  },
  actionText: {
    ...typography.captionBold,
  },
  pressed: {
    opacity: 0.8,
  },
});
