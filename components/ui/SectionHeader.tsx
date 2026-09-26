import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, spacing, typography } from '@/lib/tokens';

export type SectionHeaderVariant = 'overline' | 'subtitle';

export interface SectionHeaderProps {
  title: string;
  rightAction?: { label: string; onPress: () => void };
  variant?: SectionHeaderVariant;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  rightAction,
  variant = 'subtitle',
  style,
}: SectionHeaderProps) {
  const isOverline = variant === 'overline';

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.baseTitle,
          isOverline ? styles.overlineTitle : styles.subtitleTitle,
        ]}
      >
        {title}
      </Text>

      {rightAction ? (
        <Pressable
          onPress={rightAction.onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={rightAction.label}
        >
          <Text style={styles.actionText}>{rightAction.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3'],
  },
  baseTitle: {
    letterSpacing: -0.2,
  },
  overlineTitle: {
    ...typography.overline,
    color: colors.sectionHeader,
    letterSpacing: 0.8,
  },
  subtitleTitle: {
    ...typography.titleSmall,
    color: colors.ink,
  },
  actionText: {
    ...typography.captionBold,
    color: colors.primary,
  },
});
