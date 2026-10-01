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
import { spacing, typography } from '@/lib/tokens';

export type SectionHeaderVariant = 'overline' | 'subtitle';

export interface SectionHeaderProps {
  title: string;
  rightAction?: { label: string; onPress: () => void };
  variant?: SectionHeaderVariant;
  style?: StyleProp<ViewStyle>;
}

export default function SectionHeader({
  title,
  rightAction,
  variant = 'subtitle',
  style,
}: SectionHeaderProps) {
  const { colors } = useTheme();
  const isOverline = variant === 'overline';

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.baseTitle,
          isOverline ? [styles.overlineTitle, { color: colors.sectionHeader }] : [styles.subtitleTitle, { color: colors.ink }],
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
          <Text style={[styles.actionText, { color: colors.primary }]}>{rightAction.label}</Text>
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
    letterSpacing: 0.8,
  },
  subtitleTitle: {
    ...typography.titleSmall,
  },
  actionText: {
    ...typography.captionBold,
  },
});
