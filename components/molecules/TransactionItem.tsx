import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { formatRupiah, formatDateShort, getTodayDateString } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { fontFamilies } from '@/lib/tokens';
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
  const subtitle = `${categoryName} · ${dateDisplay}`;
  const formattedAmount = `${isExpense ? '−' : '+'}${formatRupiah(amountIdr)}`;
  const iconDef = getCategoryIcon(categoryName);

  const handlePress = () => {
    if (onPress) onPress(id);
  };

  const handleLongPress = () => {
    if (onLongPress) onLongPress(id);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formattedAmount}, ${subtitle}`}
    >
      {/* Category Icon / Emoji */}
      {/* Category Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: categoryColor
              ? `${categoryColor}22`
              : mode === 'dark'
              ? '#2a2a2a'
              : colors.surfaceControl,
          },
        ]}
      >
        <Icon
          icon={iconDef}
          size={18}
          color={categoryColor || (mode === 'dark' ? colors.white : colors.ink)}
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
    </Pressable>
  );
});

export default TransactionItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    width: '100%',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 18,
    lineHeight: 22,
  },
  textContainer: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 15,
  },
  amount: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
});
