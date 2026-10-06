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
  Restaurant01Icon,
  ShoppingBag01Icon,
  Car01Icon,
  ReceiptTextIcon,
  BanknoteIcon,
  PiggyBankIcon,
  GiftIcon,
  Medicine02Icon,
  Book01Icon,
  Film01Icon,
  Wallet01Icon,
  Tag01Icon,
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

function getCategoryIcon(name: string, type: 'income' | 'expense'): IconSvgElement {
  const lower = (name || '').toLowerCase();
  if (
    lower.includes('kopi') ||
    lower.includes('kafe') ||
    lower.includes('cafe') ||
    lower.includes('coffee')
  ) {
    return Coffee02Icon;
  }
  if (
    lower.includes('makan') ||
    lower.includes('minum') ||
    lower.includes('resto') ||
    lower.includes('kuliner') ||
    lower.includes('food') ||
    lower.includes('warung') ||
    lower.includes('snack') ||
    lower.includes('sarapan') ||
    lower.includes('siang') ||
    lower.includes('malam')
  ) {
    return Restaurant01Icon;
  }
  if (
    lower.includes('belanja') ||
    lower.includes('shop') ||
    lower.includes('mall') ||
    lower.includes('pasar') ||
    lower.includes('supermarket') ||
    lower.includes('beli') ||
    lower.includes('store')
  ) {
    return ShoppingBag01Icon;
  }
  if (
    lower.includes('transport') ||
    lower.includes('bensin') ||
    lower.includes('kendaraan') ||
    lower.includes('ojek') ||
    lower.includes('grab') ||
    lower.includes('gojek') ||
    lower.includes('bbm') ||
    lower.includes('parkir') ||
    lower.includes('tol') ||
    lower.includes('mobil') ||
    lower.includes('motor')
  ) {
    return Car01Icon;
  }
  if (
    lower.includes('tagihan') ||
    lower.includes('listrik') ||
    lower.includes('air') ||
    lower.includes('pdam') ||
    lower.includes('pulsa') ||
    lower.includes('internet') ||
    lower.includes('wifi') ||
    lower.includes('pajak') ||
    lower.includes('sewa') ||
    lower.includes('bpjs') ||
    lower.includes('cicilan')
  ) {
    return ReceiptTextIcon;
  }
  if (
    lower.includes('gaji') ||
    lower.includes('upah') ||
    lower.includes('salary') ||
    lower.includes('income') ||
    lower.includes('honor') ||
    lower.includes('thr') ||
    lower.includes('payroll') ||
    lower.includes('proyek')
  ) {
    return BanknoteIcon;
  }
  if (
    lower.includes('investasi') ||
    lower.includes('saham') ||
    lower.includes('crypto') ||
    lower.includes('bunga') ||
    lower.includes('dividen') ||
    lower.includes('tabungan') ||
    lower.includes('nabung')
  ) {
    return PiggyBankIcon;
  }
  if (
    lower.includes('hadiah') ||
    lower.includes('bonus') ||
    lower.includes('kado') ||
    lower.includes('gift') ||
    lower.includes('donasi') ||
    lower.includes('sedekah') ||
    lower.includes('zakat') ||
    lower.includes('infaq')
  ) {
    return GiftIcon;
  }
  if (
    lower.includes('kesehatan') ||
    lower.includes('obat') ||
    lower.includes('dokter') ||
    lower.includes('rumah sakit') ||
    lower.includes('klinik') ||
    lower.includes('apotek') ||
    lower.includes('medis')
  ) {
    return Medicine02Icon;
  }
  if (
    lower.includes('pendidikan') ||
    lower.includes('sekolah') ||
    lower.includes('kuliah') ||
    lower.includes('kursus') ||
    lower.includes('buku') ||
    lower.includes('les') ||
    lower.includes('edukasi')
  ) {
    return Book01Icon;
  }
  if (
    lower.includes('hiburan') ||
    lower.includes('nonton') ||
    lower.includes('film') ||
    lower.includes('bioskop') ||
    lower.includes('game') ||
    lower.includes('liburan') ||
    lower.includes('wisata') ||
    lower.includes('hobi')
  ) {
    return Film01Icon;
  }
  return type === 'income' ? Wallet01Icon : Tag01Icon;
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
  const iconDef = getCategoryIcon(categoryName, type);

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
          size={18}
          color={categoryColor || (mode === 'dark' ? colors.primary : colors.ink)}
          strokeWidth={1.5}
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
    width: 36,
    height: 36,
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
