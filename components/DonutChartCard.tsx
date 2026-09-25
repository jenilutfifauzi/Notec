import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { PieChart } from 'react-native-gifted-charts';
import { CategoryExpense } from '../db/queries/transactions';
import { COLORS } from '../lib/constants';
import { formatCompactRupiah } from '../lib/format';

interface DonutChartCardProps {
  data: CategoryExpense[];
  monthExpenseTotal: number;
  onSelectCategory?: (categoryIds: number[]) => void;
}

export function DonutChartCard({
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
      color: cat.color || COLORS.primary,
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
      color: '#8190a8',
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
    <View style={styles.card}>
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada pengeluaran</Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {/* Donut Chart */}
          <View style={styles.donutWrapper}>
            <PieChart
              data={pieData}
              donut
              radius={55}
              innerRadius={36}
              innerCircleColor={COLORS.white}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    boxShadow: '0 6px 16px rgba(31, 63, 119, 0.05)',
    elevation: 2,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  manageLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  emptyContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
  },
  legendContainer: {
    flex: 1,
    marginLeft: 16,
    gap: 8,
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
    marginRight: 8,
  },
  legendName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    marginLeft: 6,
  },
});
