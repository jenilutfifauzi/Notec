import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Icon, ChevronRightIcon } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography, fontFamilies } from '@/lib/tokens';
export interface SelectFieldProps {
  label?: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  style?: StyleProp<ViewStyle>;
}

export default function SelectField({
  label,
  value,
  placeholder,
  onPress,
  leftIcon,
  rightIcon,
  error,
  style,
}: SelectFieldProps) {
  const { colors } = useTheme();
  const hasValue = Boolean(value);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.ink }]}>{label}</Text> : null}

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${value || placeholder}` : value || placeholder}
        style={({ pressed }) => [
          styles.container,
          { backgroundColor: colors.white, borderColor: colors.border },
          error ? { borderColor: colors.red } : null,
          pressed && styles.pressed,
          style,
        ]}
      >
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIconWrap}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.text,
              hasValue ? [styles.valueText, { color: colors.ink }] : [styles.placeholderText, { color: colors.placeholder }],
            ]}
            numberOfLines={1}
          >
            {hasValue ? value : placeholder}
          </Text>
        </View>

        {rightIcon ? (
          <View style={styles.rightIconWrap}>{rightIcon}</View>
        ) : (
          <Icon icon={ChevronRightIcon} size={18} color={colors.primary} />
        )}
      </Pressable>
      {error ? <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    ...typography.captionBold,
    marginBottom: spacing['3'],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    paddingHorizontal: spacing['7'],
    paddingVertical: spacing['6'],
    minHeight: 48,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing['3'],
  },
  leftIconWrap: {
    marginRight: spacing['4'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.body,
    flex: 1,
  },
  valueText: {
    fontFamily: fontFamilies.medium,
  },
  placeholderText: {},
  rightIconWrap: {
    marginLeft: spacing['2'],
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing['2'],
  },
  pressed: {
    opacity: 0.85,
  },
});
