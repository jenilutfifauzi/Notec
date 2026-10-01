import React, { useEffect } from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';

export interface ToastProps {
  visible: boolean;
  message: string;
  action?: { label: string; onPress: () => void };
  onDismiss?: () => void;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Toast({
  visible,
  message,
  action,
  onDismiss,
  duration = 4000,
  style,
}: ToastProps) {
  const { colors, shadows } = useTheme();

  useEffect(() => {
    if (!visible || !onDismiss || duration <= 0) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(200)}
      style={[
        styles.container,
        { backgroundColor: colors.toastBg, ...shadows.toast },
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
  actionText: {
    ...typography.captionBold,
  },
});
