import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';

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
  const { mode, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceControl }, style]}>
      {segments.map((item) => {
        const isActive = item.value === selected;
        const activeColor = colorMap?.[item.value] || colors.primary;

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[
              styles.segment,
              isActive && [
                styles.segmentActive,
                {
                  backgroundColor: colors.segmentActiveBg,
                  boxShadow: mode === 'dark' ? 'none' : '0 1px 3px rgba(220, 227, 239, 0.9)',
                  elevation: mode === 'dark' ? 0 : 2,
                },
              ],
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
    flexDirection: 'row',
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
  segmentActive: {},
  segmentText: {
    ...typography.label,
  },
});
