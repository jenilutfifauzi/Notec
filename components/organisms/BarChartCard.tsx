import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  ReduceMotion,
} from 'react-native-reanimated';
import { ExpenseTrendMonth } from '@/db/queries/transactions';
import { formatCompactRupiah } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { fontFamilies, spacing } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';
import Card from '@/components/atoms/Card';

export interface BarChartCardProps {
  data: ExpenseTrendMonth[];
  selectedYear: number;
  selectedMonth: number;
  onPressMonth?: (year: number, month: number) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedBar({
  targetHeight,
  isSelected,
  selectedColor,
  inactiveColor,
}: {
  targetHeight: number;
  isSelected: boolean;
  selectedColor: string;
  inactiveColor: string;
}) {
  const heightVal = useSharedValue(4);

  useEffect(() => {
    heightVal.value = withTiming(targetHeight, {
      duration: motionTokens.presets.cardResize.duration,
      easing: motionTokens.presets.cardResize.easing,
      reduceMotion: ReduceMotion.System,
    });
  }, [targetHeight, heightVal]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightVal.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: isSelected ? selectedColor : inactiveColor },
        animatedStyle,
      ]}
    />
  );
}

function BarColumn({
  d,
  isSelected,
  barHeight,
  barColor,
  inactiveColor,
  onPress,
  colors,
}: {
  d: ExpenseTrendMonth;
  isSelected: boolean;
  barHeight: number;
  barColor: string;
  inactiveColor: string;
  onPress?: () => void;
  colors: { ink: string; muted: string };
}) {
  const scale = useSharedValue(1);

  const animatedColStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.92, {
          duration: 100,
          easing: motionTokens.easing.smoothOut,
          reduceMotion: ReduceMotion.System,
        });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: 200,
          easing: motionTokens.easing.smoothOut,
          reduceMotion: ReduceMotion.System,
        });
      }}
      style={[styles.barCol, animatedColStyle]}
      accessibilityRole="button"
      accessibilityLabel={`${d.label}: ${formatCompactRupiah(d.total)}`}
    >
      <AnimatedBar
        targetHeight={barHeight}
        isSelected={isSelected}
        selectedColor={barColor}
        inactiveColor={inactiveColor}
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
    </AnimatedPressable>
  );
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
              <Animated.Text
                key={`${selectedData.year}-${selectedData.month}-${selectedData.total}`}
                entering={FadeIn.duration(200)}
                style={[styles.monthPillText, { color: colors.ink }]}
              >
                {`${selectedData.label} · ${formatCompactRupiah(selectedData.total)}`}
              </Animated.Text>
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

            const inactiveColor = mode === 'dark' ? '#f1f1f1' : colors.primaryBarInactive;

            return (
              <BarColumn
                key={`${d.year}-${d.month}`}
                d={d}
                isSelected={isSelected}
                barHeight={barHeight}
                barColor={colors.primary}
                inactiveColor={inactiveColor}
                onPress={onPressMonth ? () => onPressMonth(d.year, d.month) : undefined}
                colors={colors}
              />
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
    marginBottom: spacing['2'],
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    lineHeight: 20,
  },
  badgeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeBtnText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  card: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  perBulanText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  monthPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  monthPillText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 125,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: 28,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderCurve: 'continuous',
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});
