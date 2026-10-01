import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { Icon, Tick01Icon } from '@/lib/icons';
import { radii, fontFamilies } from '@/lib/tokens';
export type CategoryDotSize = 'sm' | 'md' | 'lg';

export interface CategoryDotProps {
  color: string;
  label?: string;
  size?: CategoryDotSize;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function CategoryDot({
  color,
  label,
  size = 'md',
  selected = false,
  style,
}: CategoryDotProps) {
  const dimension = sizeMap[size];
  const firstLetter = label ? label.trim().charAt(0).toUpperCase() : '';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: color,
          width: dimension.boxSize,
          height: dimension.boxSize,
          borderRadius: dimension.borderRadius,
        },
        style,
      ]}
    >
      {selected ? (
        <Icon icon={Tick01Icon} size={dimension.iconSize} color="#ffffff" />
      ) : size !== 'sm' && firstLetter ? (
        <Text style={[styles.letter, { fontSize: dimension.fontSize }]}>
          {firstLetter}
        </Text>
      ) : null}
    </View>
  );
}

const sizeMap = {
  sm: {
    boxSize: 14,
    borderRadius: radii.xs,
    fontSize: 8,
    iconSize: 10,
  },
  md: {
    boxSize: 30,
    borderRadius: radii.md,
    fontSize: 13,
    iconSize: 16,
  },
  lg: {
    boxSize: 36,
    borderRadius: radii.md,
    fontSize: 15,
    iconSize: 20,
  },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  letter: {
    color: '#ffffff',
    fontFamily: fontFamilies.bold,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
  },
});
