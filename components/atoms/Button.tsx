import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { radii, fontFamilies } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({
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
  const { colors, shadows } = useTheme();
  const isDisabled = disabled || loading;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withTiming(motionTokens.scale.press, {
      duration: motionTokens.presets.press.pressInDuration,
      easing: motionTokens.easing.smoothOut,
      reduceMotion: ReduceMotion.System,
    });
    opacity.value = withTiming(0.92, {
      duration: motionTokens.presets.press.pressInDuration,
      easing: motionTokens.easing.smoothOut,
      reduceMotion: ReduceMotion.System,
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: motionTokens.presets.press.pressOutDuration,
      easing: motionTokens.easing.smoothOut,
      reduceMotion: ReduceMotion.System,
    });
    opacity.value = withTiming(1, {
      duration: motionTokens.presets.press.pressOutDuration,
      easing: motionTokens.easing.smoothOut,
      reduceMotion: ReduceMotion.System,
    });
  };

  const animatedPressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        primary: {
          backgroundColor: colors.buttonPrimaryBg,
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
        primaryText: {
          color: colors.buttonPrimaryText,
        },
        outlineText: {
          color: colors.primary,
        },
        destructiveText: {
          color: colors.white,
        },
        dashedText: {
          color: colors.primary,
        },
        ghostText: {
          color: colors.primary,
        },
      }),
    [colors],
  );

  const variantStyleMap = {
    primary: themedStyles.primary,
    outline: themedStyles.outline,
    destructive: themedStyles.destructive,
    dashed: themedStyles.dashed,
    ghost: themedStyles.ghost,
  };

  const variantTextStyleMap = {
    primary: themedStyles.primaryText,
    outline: themedStyles.outlineText,
    destructive: themedStyles.destructiveText,
    dashed: themedStyles.dashedText,
    ghost: themedStyles.ghostText,
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        variantStyleMap[variant],
        sizeStyles[size].container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        variant === 'primary' && !isDisabled && shadows.button,
        animatedPressStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary'
              ? colors.buttonPrimaryText
              : variant === 'destructive'
              ? colors.white
              : colors.primary
          }
        />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text
            style={[
              styles.baseText,
              sizeStyles[size].text,
              variantTextStyleMap[variant],
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const sizeStyles = {
  sm: StyleSheet.create({
    container: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: radii.md,
      gap: 6,
    },
    text: {
      fontSize: 12,
      lineHeight: 16,
    },
  }),
  md: StyleSheet.create({
    container: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: radii.xl,
      gap: 8,
    },
    text: {
      fontSize: 13,
      lineHeight: 18,
    },
  }),
  lg: StyleSheet.create({
    container: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: radii['2xl'],
      gap: 8,
    },
    text: {
      fontSize: 14,
      lineHeight: 20,
    },
  }),
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontFamily: fontFamilies.semiBold,
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  iconWrap: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
