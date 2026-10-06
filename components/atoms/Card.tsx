import React, { useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { radii, spacing } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';

export type CardVariant = 'default' | 'metric';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  noShadow?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Card({
  children,
  style,
  variant = 'default',
  noShadow = false,
  onPress,
  accessibilityLabel,
}: CardProps) {
  const { mode, colors, shadows } = useTheme();
  const isMetric = variant === 'metric';

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.985, {
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
        base: {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: noShadow
            ? (mode === 'dark' ? colors.line : '#ededed')
            : colors.line,
          borderCurve: 'continuous',
          ...(noShadow ? { boxShadow: 'none', elevation: 0 } : shadows.card),
        },
      }),
    [mode, colors, shadows, noShadow],
  );

  const containerStyles = [
    themedStyles.base,
    isMetric ? styles.metric : styles.default,
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          ...containerStyles,
          animatedPressStyle,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={containerStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  default: {
    borderRadius: radii['2xl'],
    padding: spacing['8'],
  },
  metric: {
    borderRadius: radii.xl,
    padding: spacing['7'],
  },
});
