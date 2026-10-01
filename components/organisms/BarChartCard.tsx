import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { ExpenseTrendMonth } from '@/db/queries/transactions';
import { formatCompactRupiah } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { fontFamilies, spacing } from '@/lib/tokens';
import Card from '@/components/atoms/Card';

export interface BarChartCardProps {
  data: ExpenseTrendMonth[];
  selectedYear: number;
  selectedMonth: number;
  onPressMonth?: (year: number, month: number) => void;
}

export default function BarChartCard({
  data,
  selectedYear,
  selectedMonth,
  onPressMonth,
}: BarChartCardProps) {
  const { mode, colors } = useTheme();

  const selectedData =
    data.find((d) => d.year === selectedYear && d.month === selectedMonth) ||
    data[data.length - 1];

  const maxVal = Math.max(...data.map((d) => d.total), 1000);

  return (
    <View style={styles.container}>
      {/* Section Header Outside Card */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Tren pengeluaran</Text>
        <View style={styles.badgeBtn}>
          <Text style={[styles.badgeBtnText, { color: colors.ink }]}>6 bulan</Text>
        </View>
      </View>

      {/* Card */}
      <Card style={styles.card}>
        {/* Top row in card: Per bulan & Badge */}
        <View style={styles.cardTopRow}>
          <Text style={[styles.perBulanText, { color: colors.ink }]}>Per bulan</Text>
          {selectedData ? (
            <View
              style={[
                styles.monthPill,
                { backgroundColor: mode === 'dark' ? '#303030' : colors.surfaceControl },
              ]}
            >
              <Text style={[styles.monthPillText, { color: colors.ink }]}>
                {`${selectedData.label} · ${formatCompactRupiah(selectedData.total)}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Bars Container */}
        <View style={[styles.chartRow, { borderBottomColor: colors.line }]}>
          {data.map((d) => {
            const isSelected = d.year === selectedYear && d.month === selectedMonth;
            const barHeight =
              d.total > 0
                ? Math.max(Math.round((d.total / maxVal) * 80), 8)
                : 4;

            const barColor = isSelected
              ? colors.primary
              : mode === 'dark'
                ? '#f1f1f1'
                : colors.primaryBarInactive;

            return (
              <Pressable
                key={`${d.year}-${d.month}`}
                onPress={() => onPressMonth?.(d.year, d.month)}
                style={styles.barCol}
                accessibilityRole="button"
                accessibilityLabel={`${d.label}: ${formatCompactRupiah(d.total)}`}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.monthLabel,
                    {
                      color: isSelected ? colors.ink : colors.muted,
                      fontFamily: isSelected ? fontFamilies.bold : fontFamilies.medium,
                    },
                  ]}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
  badgeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeBtnText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    lineHeight: 15,
  },
  card: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 16,
  },
  cardTopRow: {
    height: 38.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  perBulanText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 16,
  },
  monthPill: {
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthPillText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    paddingBottom: 6,
    paddingHorizontal: 4,
    height: 111,
  },
  barCol: {
    width: 32,
    height: 111,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  bar: {
    width: 18,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  monthLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});
