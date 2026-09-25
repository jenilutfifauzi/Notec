import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS } from '../lib/constants';
import { formatRupiah, formatDate } from '../lib/format';

interface TransactionItemProps {
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

export const TransactionItem = memo(function TransactionItem({
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
  const isExpense = type === 'expense';
  const title = note ? note : categoryName;
  const subtitle = `${categoryName} · ${formatDate(transactionDate)}`;
  const formattedAmount = `${isExpense ? '−' : '+'}${formatRupiah(amountIdr)}`;

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
    >
      {/* Category Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: categoryColor || COLORS.primary },
        ]}
      >
        <Text style={styles.iconText}>{isExpense ? '↗' : '↙'}</Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Amount */}
      <Text
        style={[
          styles.amount,
          isExpense ? styles.expenseAmount : styles.incomeAmount,
        ]}
      >
        {formattedAmount}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  expenseAmount: {
    color: COLORS.red,
  },
  incomeAmount: {
    color: COLORS.green,
  },
});
