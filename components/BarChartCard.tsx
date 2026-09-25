import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { ExpenseTrendMonth } from '../db/queries/transactions';
import { formatCompactRupiah, formatRupiah } from '../lib/format';
import {
  colors,
  radii,
  spacing,
  typography,
  Card,
  Chip,
  EmptyState,
} from '@/components/ui';

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
      frontColor: isSelected ? colors.primary : colors.primaryBarInactive,
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
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tren pengeluaran</Text>
          <Text style={styles.subtitle}>6 bulan terakhir</Text>
        </View>
        {selectedData ? (
          <Chip
            variant="badge"
            label={`${selectedData.label}: ${formatRupiah(selectedData.total)}`}
          />
        ) : null}
      </View>

      {/* Content */}
      {allZero ? (
        <EmptyState message="Belum ada pengeluaran" minHeight={120} />
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
            xAxisColor={colors.line}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            hideYAxisText
            rulesType="dashed"
            rulesColor={colors.surfaceControl}
            height={130}
          />
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
  chartWrapper: {
    alignItems: 'center',
    marginLeft: -10,
  },
  axisText: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
  },
  barTopLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
});
