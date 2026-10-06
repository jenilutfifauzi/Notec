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
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, ArrowLeft01Icon } from '@/lib/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { spacing, fontFamilies, heroCardGradient } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';

export type ScreenHeaderVariant = 'primary' | 'transparent';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: ScreenHeaderVariant;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function HeaderActionButton({
  onPress,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.94, {
      duration: motionTokens.presets.press.pressInDuration,
      easing: motionTokens.easing.smoothOut,
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: motionTokens.presets.press.pressOutDuration,
      easing: motionTokens.easing.smoothOut,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.actionBtn, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function ScreenHeader({
  title,
  onBack,
  rightAction,
  variant = 'primary',
  style,
}: ScreenHeaderProps) {
  const { mode, colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isDark = mode === 'dark';

  const useDarkThemeHeader = isDark || !isPrimary;
  const textColor = useDarkThemeHeader ? colors.ink : '#063b1b';
  const iconColor = useDarkThemeHeader ? colors.ink : '#063b1b';

  const content = (
    <SafeAreaView edges={['top']}>
      <View style={styles.headerContent}>
        {onBack ? (
          <HeaderActionButton onPress={onBack} accessibilityLabel="Kembali">
            <Icon icon={ArrowLeft01Icon} size={22} color={iconColor} />
          </HeaderActionButton>
        ) : (
          <View style={styles.actionBtnPlaceholder} />
        )}

        <Text
          style={[
            styles.title,
            {
              color: textColor,
              fontFamily: fontFamilies.bold,
              fontSize: 18,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {rightAction ? (
          <View style={styles.actionBtn}>{rightAction}</View>
        ) : (
          <View style={styles.actionBtnPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );

  if (isPrimary && !isDark) {
    return (
      <LinearGradient
        colors={heroCardGradient}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 1.0, y: 1.0 }}
        style={style}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? colors.bg : 'transparent',
          borderBottomWidth: isDark ? 1 : 0,
          borderBottomColor: colors.line,
        },
        style,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['4'],
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
