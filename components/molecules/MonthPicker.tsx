import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInRight,
  FadeInLeft,
  FadeIn,
  ReduceMotion,
} from 'react-native-reanimated';
import { Icon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CancelCircleIcon } from '@/lib/icons';
import { monthYearFormatter } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { radii, typography, fontFamilies } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';

export interface MonthPickerProps {
  year: number;
  month: number; // 1 to 12
  onChange: (year: number, month: number) => void;
  variant?: 'hero' | 'light';
  onPressTitle?: () => void;
  customLabel?: string;
  hasCustomFilter?: boolean;
  onClearCustomFilter?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MonthPicker({
  year,
  month,
  onChange,
  variant = 'hero',
  onPressTitle,
  customLabel,
  hasCustomFilter,
  onClearCustomFilter,
}: MonthPickerProps) {
  const { colors } = useTheme();
  const isHero = variant === 'hero';

  const date = new Date(year, month - 1, 1);
  const formatted = monthYearFormatter.format(date);
  const displayText = (customLabel || formatted).replace(/\s*⌄$/, '');

  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward' | null>(null);
  const prevDateKeyRef = useRef(`${year}-${month}`);

  useEffect(() => {
    const currentKey = `${year}-${month}`;
    if (prevDateKeyRef.current !== currentKey) {
      prevDateKeyRef.current = currentKey;
    }
  }, [year, month]);

  const handlePrev = () => {
    setSlideDirection('backward');
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  const handleNext = () => {
    setSlideDirection('forward');
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  const prevScale = useSharedValue(1);
  const nextScale = useSharedValue(1);

  const prevAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: prevScale.value }],
  }));

  const nextAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextScale.value }],
  }));

  return (
    <View style={[styles.container, isHero ? styles.heroContainer : styles.lightContainer]}>
      {!isHero ? (
        <AnimatedPressable
          onPress={handlePrev}
          onPressIn={() => {
            prevScale.value = withTiming(0.88, {
              duration: 100,
              easing: motionTokens.easing.smoothOut,
              reduceMotion: ReduceMotion.System,
            });
          }}
          onPressOut={() => {
            prevScale.value = withTiming(1, {
              duration: 200,
              easing: motionTokens.easing.smoothOut,
              reduceMotion: ReduceMotion.System,
            });
          }}
          style={[styles.arrowButton, prevAnimatedStyle]}
          hitSlop={8}
          accessibilityLabel="Bulan sebelumnya"
          accessibilityRole="button"
        >
          <Icon
            icon={ChevronLeftIcon}
            size={18}
            color={colors.iconMuted}
          />
        </AnimatedPressable>
      ) : null}

      {onPressTitle ? (
        <Pressable
          onPress={onPressTitle}
          style={({ pressed }) => [
            styles.titleButton,
            hasCustomFilter ? [styles.titleButtonActive, { backgroundColor: colors.primaryPale }] : null,
            pressed && styles.titleButtonPressed,
          ]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Ubah periode tanggal"
        >
          {/* transitions.dev text states swap with page slide distance */}
          <Animated.Text
            key={displayText}
            entering={
              slideDirection === 'backward'
                ? FadeInLeft.duration(motionTokens.presets.textSwap.duration)
                : slideDirection === 'forward'
                ? FadeInRight.duration(motionTokens.presets.textSwap.duration)
                : FadeIn.duration(motionTokens.presets.textSwap.duration)
            }
            style={[
              styles.monthText,
              isHero ? styles.heroText : [styles.lightText, { color: colors.ink }],
              hasCustomFilter ? { color: colors.primary } : null,
            ]}
          >
            {displayText}
          </Animated.Text>
          {!isHero ? (
            <Icon
              icon={ChevronDownIcon}
              size={13}
              color={hasCustomFilter ? colors.primary : colors.iconMuted}
            />
          ) : null}
        </Pressable>
      ) : (
        <View style={isHero ? styles.heroContentRow : null}>
          <Animated.Text
            entering={
              slideDirection === 'backward'
                ? FadeInLeft.duration(motionTokens.presets.textSwap.duration)
                : slideDirection === 'forward'
                ? FadeInRight.duration(motionTokens.presets.textSwap.duration)
                : FadeIn.duration(motionTokens.presets.textSwap.duration)
            }
            style={[
              styles.monthText,
              isHero ? styles.heroText : [styles.lightText, { color: colors.ink }],
            ]}
          >
            {displayText}
          </Animated.Text>
          {isHero ? (
            <Icon icon={ChevronDownIcon} size={12} color="#063b1b" strokeWidth={1.75} />
          ) : null}
        </View>
      )}

      {hasCustomFilter && onClearCustomFilter ? (
        <Pressable
          onPress={onClearCustomFilter}
          style={({ pressed }) => [styles.clearBtn, pressed && styles.clearBtnPressed]}
          hitSlop={8}
          accessibilityLabel="Hapus filter tanggal"
          accessibilityRole="button"
        >
          <Icon icon={CancelCircleIcon} size={16} color={colors.muted} />
        </Pressable>
      ) : null}

      {!isHero ? (
        <AnimatedPressable
          onPress={handleNext}
          onPressIn={() => {
            nextScale.value = withTiming(0.88, {
              duration: 100,
              easing: motionTokens.easing.smoothOut,
              reduceMotion: ReduceMotion.System,
            });
          }}
          onPressOut={() => {
            nextScale.value = withTiming(1, {
              duration: 200,
              easing: motionTokens.easing.smoothOut,
              reduceMotion: ReduceMotion.System,
            });
          }}
          style={[styles.arrowButton, nextAnimatedStyle]}
          hitSlop={8}
          accessibilityLabel="Bulan berikutnya"
          accessibilityRole="button"
        >
          <Icon
            icon={ChevronRightIcon}
            size={18}
            color={colors.iconMuted}
          />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    alignSelf: 'center',
    backgroundColor: '#95ce3f',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    marginTop: 6,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lightContainer: {
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  arrowButton: {
    padding: 6,
    borderRadius: radii.sm,
  },
  titleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  titleButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  titleButtonActive: {},
  clearBtn: {
    padding: 4,
  },
  clearBtnPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.9 }],
  },
  monthText: {
    textAlign: 'center',
  },
  heroText: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: '#063b1b',
  },
  lightText: {
    ...typography.titleSmall,
  },
});
