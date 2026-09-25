import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { ExpenseTrendMonth } from '../db/queries/transactions';
import { COLORS } from '../lib/constants';
import { formatCompactRupiah, formatRupiah } from '../lib/format';

interface BarChartCardProps {
  data: ExpenseTrendMonth[];
  selectedYear: number;
  selectedMonth: number;
  onPressMonth?: (year: number, month: number) => void;
}

export function BarChartCard({
  data,
  selectedYear,
  selectedMonth,
  onPressMonth,
}: BarChartCardProps) {
  const allZero = data.every((d) => d.total === 0);

  const selectedData = data.find(
    (d) => d.year === selectedYear && d.month === selectedMonth
  ) || data[data.length - 1];

  const maxVal = Math.max(...data.map((d) => d.total), 1000);

  const chartData = data.map((d) => {
    const isSelected = d.year === selectedYear && d.month === selectedMonth;
    return {
      value: d.total,
      label: d.label,
      frontColor: isSelected ? COLORS.primary : COLORS.barInactive,
      topRadius: 6,
      topLabelComponent: () =>
        d.total > 0 && isSelected ? (
          <Text style={styles.barTopLabel}>{formatCompactRupiah(d.total)}</Text>
        ) : null,
      onPress: () => {
        if (onPressMonth) onPressMonth(d.year, d.month);
      },
    };
  });

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tren pengeluaran</Text>
          <Text style={styles.subtitle}>6 bulan terakhir</Text>
        </View>
        {selectedData ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {selectedData.label}: {formatRupiah(selectedData.total)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      {allZero ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada pengeluaran</Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <BarChart
            data={chartData}
            barWidth={26}
            spacing={18}
            roundedTop
            roundedBottom={false}
            noOfSections={3}
            maxValue={maxVal * 1.15}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={COLORS.line}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            hideYAxisText
            rulesType="dashed"
            rulesColor="#f0f3f9"
            height={130}
          />
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
  badge: {
    backgroundColor: COLORS.pale,
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
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
  chartWrapper: {
    alignItems: 'center',
    marginLeft: -10,
  },
  axisText: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },
  barTopLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
});
