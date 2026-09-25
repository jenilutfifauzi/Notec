import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/lib/tokens';

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

export function SelectField({
  label,
  value,
  placeholder,
  onPress,
  leftIcon,
  rightIcon,
  error,
  style,
}: SelectFieldProps) {
  const hasValue = Boolean(value);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${value || placeholder}` : value || placeholder}
        style={({ pressed }) => [
          styles.container,
          error ? styles.containerError : null,
          pressed && styles.pressed,
          style,
        ]}
      >
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIconWrap}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.text,
              hasValue ? styles.valueText : styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {hasValue ? value : placeholder}
          </Text>
        </View>

        {rightIcon ? (
          <View style={styles.rightIconWrap}>{rightIcon}</View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
        )}
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    ...typography.captionBold,
    color: colors.ink,
    marginBottom: spacing['3'],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    paddingHorizontal: spacing['7'],
    paddingVertical: spacing['6'],
    minHeight: 48,
  },
  containerError: {
    borderColor: colors.red,
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
    color: colors.ink,
    fontWeight: '500',
  },
  placeholderText: {
    color: colors.placeholder,
  },
  rightIconWrap: {
    marginLeft: spacing['2'],
  },
  errorText: {
    ...typography.caption,
    color: colors.red,
    marginTop: spacing['2'],
  },
  pressed: {
    opacity: 0.85,
  },
});
