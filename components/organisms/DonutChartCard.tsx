import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { PieChart } from 'react-native-gifted-charts';
import { CategoryExpense } from '@/db/queries/transactions';
import { useTheme } from '@/lib/theme';
import { fontFamilies } from '@/lib/tokens';
import Card from '@/components/atoms/Card';
import EmptyState from '@/components/molecules/EmptyState';

export interface DonutChartCardProps {
  data: CategoryExpense[];
  monthExpenseTotal: number;
  onSelectCategory?: (categoryIds: number[]) => void;
}

const DARK_PALETTE = ['#c7f23a', '#aaaaaa', '#777777', '#3f3f3f'];
const LIGHT_PALETTE = ['#5B9A3C', '#7da1f0', '#a8bfe8', '#cbd5e1'];

function formatCenterLabel(amount: number): { line1: string; line2: string } {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(2).replace('.', ',');
    return { line1: `Rp${val}`, line2: 'juta' };
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toFixed(1).replace('.', ',');
    return { line1: `Rp${val}`, line2: 'ribu' };
  }
  return { line1: `Rp${abs}`, line2: '' };
}

export default function DonutChartCard({
  data,
  monthExpenseTotal,
  onSelectCategory,
}: DonutChartCardProps) {
  const { mode, colors } = useTheme();
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

  const palette = mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;

  topCategories.forEach((cat, index) => {
    const percentage =
      monthExpenseTotal > 0 ? Math.round((cat.total / monthExpenseTotal) * 100) : 0;
    displaySlices.push({
      categoryIds: [cat.categoryId],
      name: cat.categoryName,
      color: palette[index % palette.length],
      total: cat.total,
      percentage,
    });
  });

  if (otherCategories.length > 0) {
    const otherTotal = otherCategories.reduce((acc, curr) => acc + curr.total, 0);
    const otherPercentage =
      monthExpenseTotal > 0 ? Math.round((otherTotal / monthExpenseTotal) * 100) : 0;
    displaySlices.push({
      categoryIds: otherCategories.map((c) => c.categoryId),
      name: 'Lainnya',
      color: mode === 'dark' ? '#3f3f3f' : colors.muted,
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

  const centerText = formatCenterLabel(monthExpenseTotal);

  return (
    <View style={styles.container}>
      {/* Section Header Outside Card */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>
          Pengeluaran per kategori
        </Text>
        <Pressable
          onPress={() => router.push('/categories')}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Lihat kategori"
        >
          <Text style={[styles.actionBtnText, { color: colors.ink }]}>Lihat kategori</Text>
        </Pressable>
      </View>

      {/* Card */}
      <Card
        noShadow
        style={[
          styles.card,
          { borderColor: mode === 'dark' ? colors.line : '#ededed' },
        ]}
      >
        {!hasExpenses ? (
          <EmptyState message="Belum ada pengeluaran" minHeight={100} />
        ) : (
          <View style={styles.contentRow}>
            {/* Donut Chart (99px outer, 58px inner) */}
            <View style={styles.donutWrapper}>
              <PieChart
                data={pieData}
                donut
                radius={49.5}
                innerRadius={29}
                innerCircleColor={colors.white}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={[styles.centerTextLine1, { color: colors.ink }]}>
                      {centerText.line1}
                    </Text>
                    {centerText.line2 ? (
                      <Text style={[styles.centerTextLine2, { color: colors.muted }]}>
                        {centerText.line2}
                      </Text>
                    ) : null}
                  </View>
                )}
              />
            </View>

            {/* Legend / Category List */}
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
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                    <Text
                      style={[styles.legendName, { color: colors.ink }]}
                      numberOfLines={1}
                    >
                      {slice.name}
                    </Text>
                  </View>
                  <Text style={[styles.legendPercent, { color: colors.ink }]}>
                    {slice.percentage}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  actionBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    lineHeight: 15,
  },
  card: {
    borderRadius: 14,
    paddingTop: 18,
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#ededed',
    boxShadow: 'none',
    elevation: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  donutWrapper: {
    width: 99,
    height: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextLine1: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 14,
  },
  centerTextLine2: {
    fontFamily: fontFamilies.medium,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  legendContainer: {
    flex: 1,
    gap: 7,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 15,
  },
  legendPercent: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    lineHeight: 15,
  },
});
