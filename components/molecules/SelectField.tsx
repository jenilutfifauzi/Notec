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
  FadeInDown,
  FadeOutUp,
  ReduceMotion,
} from 'react-native-reanimated';
import { Icon, ChevronRightIcon } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography, fontFamilies } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SelectField({
  label,
  value,
  placeholder,
  onPress,
  leftIcon,
  rightIcon,
  error,
  style,
}: SelectFieldProps) {
  const { colors } = useTheme();
  const hasValue = Boolean(value);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.ink }]}>{label}</Text> : null}

      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.985, {
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
        accessibilityLabel={label ? `${label}: ${value || placeholder}` : value || placeholder}
        style={[
          styles.container,
          { backgroundColor: colors.white, borderColor: colors.border },
          error ? { borderColor: colors.red } : null,
          animatedStyle,
          style,
        ]}
      >
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIconWrap}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.text,
              hasValue ? [styles.valueText, { color: colors.ink }] : [styles.placeholderText, { color: colors.placeholder }],
            ]}
            numberOfLines={1}
          >
            {hasValue ? value : placeholder}
          </Text>
        </View>

        {rightIcon ? (
          <View style={styles.rightIconWrap}>{rightIcon}</View>
        ) : (
          <Icon icon={ChevronRightIcon} size={18} color={colors.primary} />
        )}
      </AnimatedPressable>

      {error ? (
        <Animated.Text
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(150)}
          style={[styles.errorText, { color: colors.red }]}
        >
          {error}
        </Animated.Text>
      ) : null}
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing['7'],
    borderWidth: 1,
    borderRadius: radii.md,
    borderCurve: 'continuous',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftIconWrap: {
    marginRight: spacing['3'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typography.body,
    flex: 1,
  },
  valueText: {
    fontFamily: fontFamilies.medium,
  },
  placeholderText: {},
  rightIconWrap: {
    marginLeft: spacing['2'],
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing['2'],
  },
});
