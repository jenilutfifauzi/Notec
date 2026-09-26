import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, spacing, typography } from '@/lib/tokens';

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
  const isBanner = errorMode === 'banner';

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {children}

      {error && isBanner ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        {error && !isBanner ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View />
        )}
        {charCount ? (
          <Text style={styles.charCounter}>
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
    color: colors.ink,
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
    color: colors.red,
  },
  charCounter: {
    ...typography.overline,
    color: colors.muted,
    marginLeft: 'auto',
  },
  errorBanner: {
    marginTop: spacing['3'],
    backgroundColor: colors.errorBg,
    padding: spacing['4'],
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorBannerText: {
    ...typography.caption,
    color: colors.red,
  },
});
