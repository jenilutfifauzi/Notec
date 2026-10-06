import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';

export interface FormFieldProps {
  label?: string;
  error?: string;
  errorMode?: 'text' | 'banner';
  charCount?: { current: number; max: number };
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function FormField({
  label,
  error,
  errorMode = 'text',
  charCount,
  children,
  style,
}: FormFieldProps) {
  const { colors } = useTheme();
  const isBanner = errorMode === 'banner';

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={[styles.label, { color: colors.ink }]}>{label}</Text> : null}

      {children}

      {error && isBanner ? (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(150)}
          style={[styles.errorBanner, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}
        >
          <Text style={[styles.errorBannerText, { color: colors.red }]}>{error}</Text>
        </Animated.View>
      ) : null}
      <View style={styles.footerRow}>
        {error && !isBanner ? (
          <Animated.Text
            entering={FadeInDown.duration(200)}
            exiting={FadeOutUp.duration(150)}
            style={[styles.errorText, { color: colors.red }]}
          >
            {error}
          </Animated.Text>
        ) : (
          <View />
        )}
        {charCount ? (
          <Text style={[styles.charCounter, { color: colors.muted }]}>
            {charCount.current}/{charCount.max}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing['4'],
  },
  label: {
    ...typography.captionBold,
    marginBottom: spacing['3'],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing['2'],
    minHeight: 16,
  },
  errorText: {
    ...typography.caption,
  },
  charCounter: {
    ...typography.overline,
    marginLeft: 'auto',
  },
  errorBanner: {
    marginTop: spacing['3'],
    padding: spacing['4'],
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  errorBannerText: {
    ...typography.caption,
  },
});
