import React from 'react';
import {
  View,
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
  FadeIn,
  ReduceMotion,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';

export interface EmptyStateProps {
  message: string;
  action?: { label: string; onPress: () => void };
  minHeight?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function EmptyStateActionButton({
  action,
  backgroundColor,
  textColor,
}: {
  action: { label: string; onPress: () => void };
  backgroundColor: string;
  textColor: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={action.onPress}
      onPressIn={() => {
        scale.value = withTiming(motionTokens.scale.pressSmall, {
          duration: 100,
          easing: motionTokens.easing.smoothOut,
          reduceMotion: ReduceMotion.System,
        });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: 200,
          easing: motionTokens.easing.smoothOut,
          reduceMotion: ReduceMotion.System,
        });
      }}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      style={[
        styles.actionButton,
        { backgroundColor },
        animatedStyle,
      ]}
    >
      <Text style={[styles.actionText, { color: textColor }]}>{action.label}</Text>
    </AnimatedPressable>
  );
}

export default function EmptyState({
  message,
  action,
  minHeight = 120,
  icon,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(motionTokens.duration.fast)}
      style={[styles.container, { minHeight }, style]}
    >
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      {action ? (
        <EmptyStateActionButton
          action={action}
          backgroundColor={colors.primaryPale}
          textColor={colors.primary}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['6'],
  },
  iconWrap: {
    marginBottom: spacing['3'],
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionButton: {
    marginTop: spacing['4'],
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['6'],
    borderRadius: radii['4xl'],
    borderCurve: 'continuous',
  },
  actionText: {
    ...typography.captionBold,
  },
});
