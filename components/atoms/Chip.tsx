import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Icon, Cancel01Icon } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';
export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  variant?: 'filter' | 'badge';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Chip({
  label,
  active = false,
  onPress,
  icon,
  rightIcon,
  onClear,
  variant = 'filter',
  style,
  textStyle,
}: ChipProps) {
  const { colors } = useTheme();
  const isBadge = variant === 'badge';

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        filterInactive: {
          backgroundColor: colors.chipInactiveBg,
          borderColor: colors.chipInactiveBorder,
        },
        filterActive: {
          backgroundColor: colors.chipActiveBg,
          borderColor: colors.chipActiveBg,
        },
        badgeContainer: {
          backgroundColor: colors.primaryPale,
        },
        filterTextInactive: {
          color: colors.chipInactiveText,
        },
        filterTextActive: {
          color: colors.chipActiveText,
        },
        badgeText: {
          color: colors.primary,
        },
      }),
    [colors],
  );

  const containerContent = (
    <>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text
        style={[
          styles.baseText,
          isBadge
            ? [styles.badgeText, themedStyles.badgeText]
            : active
            ? themedStyles.filterTextActive
            : themedStyles.filterTextInactive,
          textStyle,
        ]}
      >
        {label}
      </Text>
      {rightIcon && !onClear ? <View style={styles.rightIconWrap}>{rightIcon}</View> : null}
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
          <Icon
            icon={Cancel01Icon}
            size={14}
            color={active ? colors.chipActiveText : colors.muted}
          />
        </Pressable>
      ) : null}
    </>
  );

  const containerStyle = [
    styles.base,
    isBadge
      ? [styles.badgeContainer, themedStyles.badgeContainer]
      : active
      ? [styles.filterActive, themedStyles.filterActive]
      : [styles.filterInactive, themedStyles.filterInactive],
  ];

  if (isBadge || !onPress) {
    return (
      <View style={[containerStyle, style]}>
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
        containerStyle,
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
    borderWidth: 1,
    borderRadius: radii['4xl'],
    paddingVertical: 7,
    paddingHorizontal: spacing['7'],
  },
  filterActive: {
    borderWidth: 1,
    borderRadius: radii['4xl'],
    paddingVertical: 7,
    paddingHorizontal: spacing['7'],
  },
  badgeContainer: {
    borderRadius: radii.md,
    paddingVertical: spacing['1'],
    paddingHorizontal: spacing['4'],
  },
  baseText: {
    ...typography.captionBold,
  },
  badgeText: {
    fontSize: 11,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    marginLeft: 2,
  },
  rightIconWrap: {
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
