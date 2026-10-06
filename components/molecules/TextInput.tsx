import React, { useEffect, useRef } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutUp,
  ReduceMotion,
} from 'react-native-reanimated';
import { Icon, Search01Icon, CancelCircleIcon } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';

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

  // transitions.dev 12-error-state-shake
  const shakeX = useSharedValue(0);
  const prevErrorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      shakeX.value = withSequence(
        withTiming(motionTokens.presets.shake.distance, {
          duration: motionTokens.presets.shake.durA,
          easing: motionTokens.presets.shake.easing,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(-motionTokens.presets.shake.distance, {
          duration: motionTokens.presets.shake.durA,
          easing: motionTokens.presets.shake.easing,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(motionTokens.presets.shake.overshoot, {
          duration: motionTokens.presets.shake.durB,
          easing: motionTokens.presets.shake.easing,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(0, {
          duration: motionTokens.presets.shake.durB,
          easing: motionTokens.presets.shake.easing,
          reduceMotion: ReduceMotion.System,
        })
      );
    }
    prevErrorRef.current = error;
  }, [error, shakeX]);

  const animatedShakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeX.value }],
    };
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.ink }, error ? { color: colors.red } : null]}>
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputContainer,
          isSearch
            ? [styles.searchContainer, { backgroundColor: colors.searchBg, borderColor: colors.searchBorder }]
            : [styles.defaultContainer, { backgroundColor: colors.surfaceInput, borderColor: colors.borderInput }],
          error ? { borderColor: colors.red } : null,
          animatedShakeStyle,
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
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
            <Pressable
              onPress={onClear}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Hapus teks"
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Icon icon={CancelCircleIcon} size={18} color={colors.muted} />
            </Pressable>
          </Animated.View>
        ) : null}

        {rightIcon ? <View style={styles.rightIconWrap}>{rightIcon}</View> : null}
      </Animated.View>

      <View style={styles.footerRow}>
        {error ? (
          <Animated.Text
            entering={FadeInDown.duration(200)}
            exiting={FadeOutUp.duration(150)}
            style={[styles.errorText, { color: colors.red }]}
          >
            {error}
          </Animated.Text>
        ) : (
          <View />
        )}
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
    borderRadius: radii.md,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  defaultContainer: {
    minHeight: 44,
    paddingHorizontal: spacing['7'],
  },
  searchContainer: {
    height: 40,
    paddingHorizontal: spacing['6'],
  },
  searchIcon: {
    marginRight: spacing['3'],
  },
  leftIconWrap: {
    marginRight: spacing['3'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrap: {
    marginLeft: spacing['3'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing['4'],
  },
  searchInput: {
    ...typography.caption,
    paddingVertical: 0,
  },
  iconButton: {
    padding: spacing['2'],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.full,
  },
  iconButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.9 }],
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
