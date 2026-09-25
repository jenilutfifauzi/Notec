import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/lib/tokens';

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  onClear?: () => void;
  variant?: 'filter' | 'badge';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Chip({
  label,
  active = false,
  onPress,
  icon,
  onClear,
  variant = 'filter',
  style,
  textStyle,
}: ChipProps) {
  const isBadge = variant === 'badge';

  const containerContent = (
    <>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text
        style={[
          styles.baseText,
          isBadge ? styles.badgeText : active ? styles.filterTextActive : styles.filterTextInactive,
          textStyle,
        ]}
      >
        {label}
      </Text>
      {onClear ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onClear();
          }}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Hapus filter"
          style={styles.clearBtn}
        >
          <Ionicons
            name="close"
            size={14}
            color={active ? colors.white : colors.muted}
          />
        </Pressable>
      ) : null}
    </>
  );

  if (isBadge || !onPress) {
    return (
      <View
        style={[
          styles.base,
          isBadge ? styles.badgeContainer : active ? styles.filterActive : styles.filterInactive,
          style,
        ]}
      >
        {containerContent}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.base,
        active ? styles.filterActive : styles.filterInactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {containerContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
    gap: spacing['2'],
  },
  filterInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii['4xl'],
    paddingVertical: 7,
    paddingHorizontal: spacing['7'],
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii['4xl'],
    paddingVertical: 7,
    paddingHorizontal: spacing['7'],
  },
  badgeContainer: {
    backgroundColor: colors.primaryPale,
    borderRadius: radii.md,
    paddingVertical: spacing['1'],
    paddingHorizontal: spacing['4'],
  },
  baseText: {
    ...typography.captionBold,
  },
  filterTextInactive: {
    color: colors.muted,
  },
  filterTextActive: {
    color: colors.white,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    marginLeft: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
