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
import { Icon, ArrowLeft01Icon } from '@/lib/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { spacing, typography } from '@/lib/tokens';

export type ScreenHeaderVariant = 'primary' | 'transparent';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: ScreenHeaderVariant;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenHeader({
  title,
  onBack,
  rightAction,
  variant = 'primary',
  style,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? '#063b1b' : colors.ink;
  const iconColor = isPrimary ? '#063b1b' : colors.ink;

  const content = (
    <SafeAreaView edges={['top']}>
      <View style={styles.headerContent}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            style={styles.actionBtn}
          >
            <Icon icon={ArrowLeft01Icon} size={22} color={iconColor} />
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

  if (isPrimary) {
    return (
      <LinearGradient colors={['#c7f23a', '#78b52c']} style={style}>
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.transparentSafe, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
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
