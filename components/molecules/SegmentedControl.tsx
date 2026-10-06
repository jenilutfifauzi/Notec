import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  ReduceMotion,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';

export interface SegmentItem<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  segments: SegmentItem<T>[];
  selected: T;
  onChange: (value: T) => void;
  colorMap?: Partial<Record<T, string>>;
  style?: StyleProp<ViewStyle>;
}

interface TabLayoutInfo {
  x: number;
  width: number;
  height: number;
}

export default function SegmentedControl<T extends string>({
  segments,
  selected,
  onChange,
  colorMap,
  style,
}: SegmentedControlProps<T>) {
  const { mode, colors } = useTheme();
  const [layouts, setLayouts] = useState<Record<number, TabLayoutInfo>>({});
  const isInitializedRef = useRef(false);

  const activeIndex = segments.findIndex((s) => s.value === selected);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillHeight = useSharedValue(0);
  const pillOpacity = useSharedValue(0);

  const handleTabLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, width, height } = e.nativeEvent.layout;
    setLayouts((prev) => ({
      ...prev,
      [index]: { x, width, height },
    }));
  }, []);

  // Update animated pill when layouts change or active selection changes
  useEffect(() => {
    const activeLayout = layouts[safeActiveIndex];
    if (!activeLayout || activeLayout.width === 0) return;

    if (!isInitializedRef.current) {
      // First paint: snap without transition (adhering to 16-tabs-sliding.md)
      pillX.value = activeLayout.x;
      pillWidth.value = activeLayout.width;
      pillHeight.value = activeLayout.height;
      pillOpacity.value = 1;
      isInitializedRef.current = true;
    } else {
      // Subsequent transitions: 250ms cubic-bezier(0.22, 1, 0.36, 1)
      pillX.value = withTiming(activeLayout.x, {
        duration: motionTokens.presets.tabs.duration,
        easing: motionTokens.presets.tabs.easing,
        reduceMotion: ReduceMotion.System,
      });
      pillWidth.value = withTiming(activeLayout.width, {
        duration: motionTokens.presets.tabs.duration,
        easing: motionTokens.presets.tabs.easing,
        reduceMotion: ReduceMotion.System,
      });
      pillHeight.value = withTiming(activeLayout.height, {
        duration: motionTokens.presets.tabs.duration,
        easing: motionTokens.presets.tabs.easing,
        reduceMotion: ReduceMotion.System,
      });
      pillOpacity.value = withTiming(1, {
        duration: motionTokens.duration.quick,
        easing: motionTokens.easing.smoothOut,
        reduceMotion: ReduceMotion.System,
      });
    }
  }, [safeActiveIndex, layouts, pillX, pillWidth, pillHeight, pillOpacity]);

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: pillX.value }],
      width: pillWidth.value,
      height: pillHeight.value,
      opacity: pillOpacity.value,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceControl }, style]}>
      {/* 16-tabs-sliding: Animated Sliding Pill */}
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor: colors.segmentActiveBg,
            boxShadow: mode === 'dark' ? 'none' : '0 1px 3px rgba(220, 227, 239, 0.9)',
            elevation: mode === 'dark' ? 0 : 2,
          },
          animatedPillStyle,
        ]}
      />

      {segments.map((item, index) => {
        const isActive = item.value === selected;
        const activeColor = colorMap?.[item.value] || colors.primary;

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            onLayout={(e) => handleTabLayout(index, e)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.segment,
              pressed && styles.segmentPressed,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                isActive ? { color: activeColor } : { color: colors.muted },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    padding: spacing['1'],
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  pill: {
    position: 'absolute',
    top: spacing['1'],
    borderRadius: 9,
    borderCurve: 'continuous',
    zIndex: 0,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderCurve: 'continuous',
    zIndex: 1,
  },
  segmentPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  segmentText: {
    ...typography.label,
  },
});
