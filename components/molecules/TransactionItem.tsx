import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { formatRupiah, formatDateShort, getTodayDateString } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { fontFamilies } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';
import {
  Icon,
  Coffee02Icon,
  ShoppingBag01Icon,
  Car01Icon,
  Invoice01Icon,
  Coins01Icon,
  GiftIcon,
  Medicine02Icon,
  Film01Icon,
  Note01Icon,
} from '@/lib/icons';
import type { IconSvgElement } from '@hugeicons/react-native';

export interface TransactionItemProps {
  id: number;
  note: string | null;
  categoryName: string;
  categoryColor: string;
  type: 'income' | 'expense';
  amountIdr: number;
  transactionDate: string;
  onPress?: (id: number) => void;
  onLongPress?: (id: number) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getCategoryIcon(name: string): IconSvgElement {
  const lower = (name || '').toLowerCase();
  if (lower.includes('makan') || lower.includes('minum') || lower.includes('kopi') || lower.includes('kafe')) {
    return Coffee02Icon;
  }
  if (lower.includes('belanja')) return ShoppingBag01Icon;
  if (lower.includes('transport') || lower.includes('bensin') || lower.includes('kendaraan')) return Car01Icon;
  if (lower.includes('tagihan') || lower.includes('listrik') || lower.includes('air') || lower.includes('pulsa')) return Invoice01Icon;
  if (lower.includes('gaji') || lower.includes('upah') || lower.includes('investasi')) return Coins01Icon;
  if (lower.includes('hadiah') || lower.includes('bonus')) return GiftIcon;
  if (lower.includes('kesehatan') || lower.includes('obat') || lower.includes('dokter')) return Medicine02Icon;
  if (lower.includes('hiburan') || lower.includes('nonton') || lower.includes('game')) return Film01Icon;
  return Note01Icon;
}

const TransactionItem = memo(function TransactionItem({
  id,
  note,
  categoryName,
  categoryColor,
  type,
  amountIdr,
  transactionDate,
  onPress,
  onLongPress,
}: TransactionItemProps) {
  const { mode, colors } = useTheme();
  const isExpense = type === 'expense';
  const title = note ? note : categoryName;
  const isToday = transactionDate === getTodayDateString();
  const dateDisplay = isToday ? 'Hari ini' : formatDateShort(transactionDate);
  const subtitle = `${categoryName} • ${dateDisplay}`;
  const formattedAmount = `${isExpense ? '−' : '+'}${formatRupiah(amountIdr)}`;
  const iconDef = getCategoryIcon(categoryName);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.985, {
      duration: 100,
      easing: motionTokens.easing.smoothOut,
      reduceMotion: ReduceMotion.System,
    });
    opacity.value = withTiming(0.88, {
      duration: 100,
      easing: motionTokens.easing.smoothOut,
      reduceMotion: ReduceMotion.System,
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: 140,
      easing: motionTokens.easing.smoothOut,
      reduceMotion: ReduceMotion.System,
    });
    opacity.value = withTiming(1, {
      duration: 140,
      easing: motionTokens.easing.smoothOut,
      reduceMotion: ReduceMotion.System,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedPressable
      onPress={onPress ? () => onPress(id) : undefined}
      onLongPress={onLongPress ? () => onLongPress(id) : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formattedAmount}, ${subtitle}`}
    >
      {/* Category Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor:
              mode === 'dark'
                ? '#303030'
                : categoryColor
                ? `${categoryColor}22`
                : colors.surfaceControl,
          },
        ]}
      >
        <Icon
          icon={iconDef}
          size={16}
          color={categoryColor || (mode === 'dark' ? colors.primary : colors.ink)}
          strokeWidth={1.8}
        />
      </View>

      {/* Title & Subtitle */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Amount */}
      <Text style={[styles.amount, { color: colors.ink }]}>{formattedAmount}</Text>
    </AnimatedPressable>
  );
});

export default TransactionItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  amount: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
