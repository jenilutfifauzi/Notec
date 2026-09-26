import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, spacing, typography } from '@/lib/tokens';

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

export default function SegmentedControl<T extends string>({
  segments,
  selected,
  onChange,
  colorMap,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.container, style]}>
      {segments.map((item) => {
        const isActive = item.value === selected;
        const activeColor = colorMap?.[item.value] || colors.primary;

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[styles.segment, isActive && styles.segmentActive]}
          >
            <Text
              style={[
                styles.segmentText,
                isActive ? { color: activeColor } : styles.segmentTextInactive,
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
    flexDirection: 'row',
    backgroundColor: colors.surfaceControl,
    padding: spacing['1'],
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderCurve: 'continuous',
  },
  segmentActive: {
    backgroundColor: colors.white,
    boxShadow: '0 1px 3px rgba(220, 227, 239, 0.9)',
    elevation: 2,
  },
  segmentText: {
    ...typography.label,
  },
  segmentTextInactive: {
    color: colors.muted,
  },
});
