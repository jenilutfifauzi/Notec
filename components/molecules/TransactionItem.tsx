import React, { memo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { formatRupiah, formatDate } from '@/lib/format';
import { colors, radii, spacing, typography } from '@/lib/tokens';
import AppText from '@/components/atoms/AppText';

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
      accessibilityLabel={`${title}, ${formattedAmount}, ${subtitle}`}
    >
      {/* Category Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: categoryColor || colors.primary },
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
      <AppText
        variant="bodyBold"
        tabularNums
        color={isExpense ? colors.red : colors.green}
        style={styles.amount}
      >
        {formattedAmount}
      </AppText>
    </Pressable>
  );
});

export default TransactionItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['6'],
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing['6'],
    marginRight: spacing['4'],
  },
  title: {
    ...typography.bodyBold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  amount: {
    letterSpacing: -0.3,
  },
});
