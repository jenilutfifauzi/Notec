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
import { Icon, Search01Icon, CancelCircleIcon } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';

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

export default function TextInput({
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
  const { colors } = useTheme();
  const isSearch = variant === 'search';
  const showClear = Boolean(onClear && value && value.length > 0);
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.ink }, error ? { color: colors.red } : null]}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isSearch
            ? [styles.searchContainer, { backgroundColor: colors.searchBg, borderColor: colors.searchBorder }]
            : [styles.defaultContainer, { backgroundColor: colors.surfaceInput, borderColor: colors.borderInput }],
          error ? { borderColor: colors.red } : null,
        ]}
      >
        {isSearch && !leftIcon ? (
          <Icon
            icon={Search01Icon}
            size={18}
            color={colors.muted}
            style={styles.searchIcon}
          />
        ) : null}

        {leftIcon ? <View style={styles.leftIconWrap}>{leftIcon}</View> : null}

        <RNTextInput
          value={value}
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { color: colors.ink }, isSearch && styles.searchInput, style]}
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
            <Icon icon={CancelCircleIcon} size={18} color={colors.muted} />
          </Pressable>
        ) : null}

        {rightIcon ? <View style={styles.rightIconWrap}>{rightIcon}</View> : null}
      </View>

      <View style={styles.footerRow}>
        {error ? <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text> : <View />}
        {charCount ? (
          <Text style={[styles.charCounter, { color: colors.muted }]}>
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
    marginBottom: spacing['3'],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  defaultContainer: {
    borderWidth: 1,
    paddingHorizontal: spacing['7'],
    minHeight: 48,
  },
  searchContainer: {
    borderWidth: 1,
    paddingHorizontal: spacing['6'],
    minHeight: 44,
  },
  input: {
    flex: 1,
    ...typography.body,
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
  },
  charCounter: {
    ...typography.overline,
    marginLeft: 'auto',
  },
});
