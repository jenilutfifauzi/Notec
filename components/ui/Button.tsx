import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
  Platform,
} from 'react-native';
import { colors, radii, shadows, fontFamilies } from '@/lib/tokens';

export type ButtonVariant = 'primary' | 'outline' | 'destructive' | 'dashed' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  accessibilityLabel,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        sizeStyles[size].container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        variant === 'primary' && !isDisabled && shadows.button,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? colors.white : colors.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text
            style={[
              styles.baseText,
              sizeStyles[size].text,
              variantTextStyles[variant],
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const sizeStyles = {
  sm: StyleSheet.create({
    container: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: radii.md,
    },
    text: {
      fontSize: 12,
    },
  }),
  md: StyleSheet.create({
    container: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: radii.lg,
    },
    text: {
      fontSize: 13,
    },
  }),
  lg: StyleSheet.create({
    container: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: radii.lg,
    },
    text: {
      fontSize: 15,
    },
  }),
};

const variantTextStyles = StyleSheet.create({
  primary: {
    color: colors.white,
  },
  outline: {
    color: colors.primary,
  },
  destructive: {
    color: colors.white,
  },
  dashed: {
    color: colors.primary,
  },
  ghost: {
    color: colors.primary,
  },
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontFamily: fontFamilies.bold,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderSecondary,
  },
  destructive: {
    backgroundColor: colors.red,
  },
  dashed: {
    backgroundColor: colors.surfaceDashed,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
