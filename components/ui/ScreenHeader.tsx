import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/lib/tokens';

export type ScreenHeaderVariant = 'primary' | 'transparent';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: ScreenHeaderVariant;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({
  title,
  onBack,
  rightAction,
  variant = 'primary',
  style,
}: ScreenHeaderProps) {
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? colors.white : colors.ink;
  const iconColor = isPrimary ? colors.white : colors.ink;

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        isPrimary ? styles.primarySafe : styles.transparentSafe,
        style,
      ]}
    >
      <View style={styles.headerContent}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            style={styles.actionBtn}
          >
            <Ionicons name="arrow-back" size={22} color={iconColor} />
          </Pressable>
        ) : (
          <View style={styles.actionBtnPlaceholder} />
        )}

        <Text
          style={[styles.title, { color: textColor }]}
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
}

const styles = StyleSheet.create({
  primarySafe: {
    backgroundColor: colors.primary,
  },
  transparentSafe: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['8'],
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  title: {
    ...typography.title,
    flex: 1,
    textAlign: 'center',
  },
});
