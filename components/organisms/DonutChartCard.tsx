import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { PieChart } from 'react-native-gifted-charts';
import { CategoryExpense } from '@/db/queries/transactions';
import { formatCompactRupiah } from '@/lib/format';
import { colors, spacing, typography } from '@/lib/tokens';
import Card from '@/components/atoms/Card';
import EmptyState from '@/components/molecules/EmptyState';

export interface DonutChartCardProps {
  data: CategoryExpense[];
  monthExpenseTotal: number;
  onSelectCategory?: (categoryIds: number[]) => void;
}

export default function DonutChartCard({
  data,
  monthExpenseTotal,
  onSelectCategory,
}: DonutChartCardProps) {
  const hasExpenses = monthExpenseTotal > 0 && data.length > 0;

  // Process data: Top 3 + "Kategori lain"
  const topCount = 3;
  const topCategories = data.slice(0, topCount);
  const otherCategories = data.slice(topCount);

  const displaySlices: {
    categoryIds: number[];
    name: string;
    color: string;
    total: number;
    percentage: number;
  }[] = [];

  for (const cat of topCategories) {
    const percentage = monthExpenseTotal > 0 ? Math.round((cat.total / monthExpenseTotal) * 100) : 0;
    displaySlices.push({
      categoryIds: [cat.categoryId],
      name: cat.categoryName,
      color: cat.color || colors.primary,
      total: cat.total,
      percentage,
    });
  }

  if (otherCategories.length > 0) {
    const otherTotal = otherCategories.reduce((acc, curr) => acc + curr.total, 0);
    const otherPercentage = monthExpenseTotal > 0 ? Math.round((otherTotal / monthExpenseTotal) * 100) : 0;
    displaySlices.push({
      categoryIds: otherCategories.map((c) => c.categoryId),
      name: 'Kategori lain',
      color: colors.muted,
      total: otherTotal,
      percentage: otherPercentage,
    });
  }

  const pieData = displaySlices.map((slice) => ({
    value: slice.total,
    color: slice.color,
    onPress: () => {
      if (onSelectCategory) onSelectCategory(slice.categoryIds);
    },
  }));

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pengeluaran per kategori</Text>
          <Text style={styles.subtitle}>Bulan ini</Text>
        </View>
        <Pressable
          onPress={() => router.push('/categories')}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.manageLinkText}>Kelola kategori ›</Text>
        </Pressable>
      </View>

      {/* Content */}
      {!hasExpenses ? (
        <EmptyState message="Belum ada pengeluaran" minHeight={120} />
      ) : (
        <View style={styles.contentRow}>
          {/* Donut Chart */}
          <View style={styles.donutWrapper}>
            <PieChart
              data={pieData}
              donut
              radius={55}
              innerRadius={36}
              innerCircleColor={colors.white}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={styles.centerTotalText}>
                    {formatCompactRupiah(monthExpenseTotal)}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            {displaySlices.map((slice) => (
              <Pressable
                key={slice.name}
                style={styles.legendRow}
                onPress={() => {
                  if (onSelectCategory) onSelectCategory(slice.categoryIds);
                }}
                accessibilityRole="button"
              >
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <Text style={styles.legendName} numberOfLines={1}>
                  {slice.name}
                </Text>
                <Text style={styles.legendPercent}>{slice.percentage}%</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing['8'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['8'],
  },
  manageLinkText: {
    ...typography.captionBold,
    fontSize: 11,
    color: colors.primary,
  },
  title: {
    ...typography.titleSmall,
    color: colors.ink,
  },
  subtitle: {
    ...typography.overline,
    color: colors.muted,
    marginTop: 2,
    textTransform: 'none',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing['2'],
  },
  donutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTotalText: {
    ...typography.overline,
    color: colors.ink,
    textAlign: 'center',
  },
  legendContainer: {
    flex: 1,
    marginLeft: spacing['8'],
    gap: spacing['4'],
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing['4'],
  },
  legendName: {
    flex: 1,
    ...typography.caption,
    color: colors.ink,
  },
  legendPercent: {
    ...typography.captionBold,
    color: colors.muted,
    marginLeft: spacing['3'],
  },
});
