import React from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/lib/tokens';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  charCount?: { current: number; max: number };
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  variant?: 'default' | 'search';
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextInput({
  label,
  error,
  charCount,
  leftIcon,
  rightIcon,
  onClear,
  variant = 'default',
  containerStyle,
  style,
  value,
  ...props
}: TextInputProps) {
  const isSearch = variant === 'search';
  const showClear = Boolean(onClear && value && value.length > 0);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, error ? styles.labelError : null]}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isSearch ? styles.searchContainer : styles.defaultContainer,
          error ? styles.containerError : null,
        ]}
      >
        {isSearch && !leftIcon ? (
          <Ionicons
            name="search"
            size={18}
            color={colors.muted}
            style={styles.searchIcon}
          />
        ) : null}

        {leftIcon ? <View style={styles.leftIconWrap}>{leftIcon}</View> : null}

        <RNTextInput
          value={value}
          placeholderTextColor={colors.placeholder}
          style={[styles.input, isSearch && styles.searchInput, style]}
          {...props}
        />

        {showClear ? (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Hapus teks"
            style={styles.iconButton}
          >
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}

        {rightIcon ? <View style={styles.rightIconWrap}>{rightIcon}</View> : null}
      </View>

      <View style={styles.footerRow}>
        {error ? <Text style={styles.errorText}>{error}</Text> : <View />}
        {charCount ? (
          <Text style={styles.charCounter}>
            {charCount.current}/{charCount.max}
          </Text>
        ) : null}
      </View>
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
  labelError: {
    color: colors.red,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  defaultContainer: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surfaceInput,
    paddingHorizontal: spacing['7'],
    minHeight: 48,
  },
  searchContainer: {
    backgroundColor: colors.surfaceControl,
    paddingHorizontal: spacing['6'],
    minHeight: 44,
  },
  containerError: {
    borderColor: colors.red,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
    paddingVertical: spacing['6'],
  },
  searchInput: {
    paddingVertical: spacing['5'],
  },
  leftIconWrap: {
    marginRight: spacing['4'],
  },
  searchIcon: {
    marginRight: spacing['4'],
  },
  rightIconWrap: {
    marginLeft: spacing['4'],
  },
  iconButton: {
    padding: spacing['2'],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing['2'],
    minHeight: 16,
  },
  errorText: {
    ...typography.caption,
    color: colors.red,
  },
  charCounter: {
    ...typography.overline,
    color: colors.muted,
    marginLeft: 'auto',
  },
});
