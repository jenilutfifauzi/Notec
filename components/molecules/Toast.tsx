import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  ReduceMotion,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';

export interface ToastProps {
  visible: boolean;
  message: string;
  action?: { label: string; onPress: () => void };
  onDismiss?: () => void;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * transitions.dev 22-toast
 * Asymmetric open/close: rises into view over 350ms with scale 0.97 -> 1
 * and translateY 16 -> 0 with cubic-bezier(0.22, 1, 0.36, 1).
 * Exits snappy over 250ms back to scale 0.97 and translateY 16.
 */
export default function Toast({
  visible,
  message,
  action,
  onDismiss,
  duration = 4000,
  style,
}: ToastProps) {
  const { colors, shadows } = useTheme();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  const handleFinishExit = useCallback(() => {
    setMounted(false);
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Open transition: 350ms cubic-bezier(0.22, 1, 0.36, 1)
      progress.value = withTiming(1, {
        duration: motionTokens.presets.toast.openDuration,
        easing: motionTokens.presets.toast.easing,
        reduceMotion: ReduceMotion.System,
      });
    } else if (mounted) {
      // Close transition: 250ms cubic-bezier(0.22, 1, 0.36, 1)
      progress.value = withTiming(
        0,
        {
          duration: motionTokens.presets.toast.closeDuration,
          easing: motionTokens.presets.toast.easing,
          reduceMotion: ReduceMotion.System,
        },
        (finished) => {
          if (finished) {
            runOnJS(handleFinishExit)();
          }
        }
      );
    }
  }, [visible, mounted, progress, handleFinishExit]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!visible || !onDismiss || duration <= 0) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        {
          translateY: interpolate(
            progress.value,
            [0, 1],
            [motionTokens.presets.toast.distance, 0]
          ),
        },
        {
          scale: interpolate(
            progress.value,
            [0, 1],
            [motionTokens.presets.toast.scale, 1]
          ),
        },
      ],
    };
  });

  if (!mounted) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.toastBg, ...shadows.toast },
        animatedStyle,
        style,
      ]}
    >
      <Text style={[styles.message, { color: colors.white }]}>{message}</Text>
      {action ? (
        <Pressable
          onPress={action.onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={[styles.actionText, { color: colors.toastAction }]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    paddingVertical: spacing['6'],
    paddingHorizontal: spacing['8'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
  },
  message: {
    ...typography.captionBold,
    flex: 1,
    marginRight: spacing['4'],
  },
  actionButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: radii.xs,
  },
  actionButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  actionText: {
    ...typography.captionBold,
  },
});
