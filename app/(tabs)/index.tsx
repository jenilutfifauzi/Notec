import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
  ReduceMotion,
} from 'react-native-reanimated';
import { Svg, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { motionTokens } from '@/lib/motion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Icon, Search01Icon, Sun01Icon, Moon02Icon } from '@/lib/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { db } from '../../db/client';
import { transactions } from '../../db/schema';
import {
  getMonthSummary,
  getSixMonthExpenseTrend,
  getExpenseByCategory,
  getRecentTransactions,
  MonthSummary,
  ExpenseTrendMonth,
  CategoryExpense,
  TransactionWithCategory,
} from '../../db/queries/transactions';
import DateFilterModal from '@/components/organisms/DateFilterModal';
import TransactionItem from '@/components/molecules/TransactionItem';
import BarChartCard from '@/components/organisms/BarChartCard';
import DonutChartCard from '@/components/organisms/DonutChartCard';
import { formatRupiah } from '../../lib/format';
import {
  radii,
  spacing,
  fontFamilies,
  Card,
  AppText,
  EmptyState,
} from '@/components/ui';
import { heroCardGradient } from '@/lib/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MONTH_NAMES = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
];

function ThemeToggleButton({
  mode,
  toggleTheme,
  onLongPress,
}: {
  mode: string;
  toggleTheme: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePress = () => {
    rotation.value = withTiming(rotation.value + 180, {
      duration: motionTokens.presets.iconSwap.duration,
      easing: motionTokens.presets.iconSwap.easing,
      reduceMotion: ReduceMotion.System,
    });
    toggleTheme();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.value = withTiming(0.92, {
          duration: 100,
          easing: motionTokens.easing.inOut,
          reduceMotion: ReduceMotion.System,
        });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: 200,
          easing: motionTokens.easing.inOut,
          reduceMotion: ReduceMotion.System,
        });
      }}
      style={[styles.themeButton, animatedStyle]}
      accessibilityLabel={mode === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
      accessibilityRole="button"
    >
      <Icon
        icon={mode === 'dark' ? Sun01Icon : Moon02Icon}
        size={15}
        color="#d9f77b"
      />
    </AnimatedPressable>
  );
}

export default function BerandaScreen() {
  const { mode, colors, toggleTheme } = useTheme();
  const isDark = mode === 'dark';
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  const [summary, setSummary] = useState<MonthSummary>({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [trend, setTrend] = useState<ExpenseTrendMonth[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [recentList, setRecentList] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Reanimated scale for month pill
  const monthPillScale = useSharedValue(1);
  const monthPillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: monthPillScale.value }],
  }));

  const handleMonthPillPressIn = () => {
    monthPillScale.value = withTiming(0.95, {
      duration: 100,
      easing: motionTokens.easing.smoothOut,
    });
  };

  const handleMonthPillPressOut = () => {
    monthPillScale.value = withTiming(1, {
      duration: 150,
      easing: motionTokens.easing.smoothOut,
    });
  };

  // Live query trigger: updates whenever any transaction changes in db
  const { data: liveTransactions } = useLiveQuery(
    db.select({ id: transactions.id, updatedAt: transactions.updated_at }).from(transactions)
  );

  const loadData = useCallback(async () => {
    try {
      const [sum, tr, catExp, recent] = await Promise.all([
        getMonthSummary(selectedYear, selectedMonth),
        getSixMonthExpenseTrend(selectedYear, selectedMonth),
        getExpenseByCategory(selectedYear, selectedMonth),
        getRecentTransactions(5),
      ]);
      setSummary(sum);
      setTrend(tr);
      setCategoryExpenses(catExp);
      setRecentList(recent);
    } catch (e) {
      console.error('Error loading Beranda data:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Re-fetch when month changes or live transactions change
  useEffect(() => {
    loadData();
  }, [loadData, liveTransactions]);

  const handleBarMonthPress = (year: number, month: number) => {
    router.push({
      pathname: '/history',
      params: {
        year: String(year),
        month: String(month),
        type: 'expense',
      },
    });
  };

  const handleCategoryPress = (categoryIds: number[]) => {
    router.push({
      pathname: '/history',
      params: {
        year: String(selectedYear),
        month: String(selectedMonth),
        type: 'expense',
        categoryIds: categoryIds.join(','),
      },
    });
  };

  const monthName = MONTH_NAMES[selectedMonth - 1] || 'BULAN';
  const monthBadgeText = selectedYear !== now.getFullYear() ? `${monthName} ${selectedYear}` : monthName;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Ambient Glow Hero Header (FRAME DASHBOARD NEW) */}
      <View
        style={[
          styles.heroSection,
          {
            backgroundColor: isDark ? '#030501' : colors.bg,
          },
        ]}
      >
        {isDark && (
          <Svg
            style={StyleSheet.absoluteFill}
            width="100%"
            height="100%"
            pointerEvents="none"
          >
            <Defs>
              <RadialGradient id="glowChampagne" cx="15%" cy="10%" r="60%">
                <Stop offset="0%" stopColor="#DFFF00" stopOpacity="0.22" />
                <Stop offset="100%" stopColor="#DFFF00" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="glowGold" cx="85%" cy="15%" r="55%">
                <Stop offset="0%" stopColor="#DFFF00" stopOpacity="0.19" />
                <Stop offset="100%" stopColor="#DFFF00" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="glowEmerald" cx="50%" cy="40%" r="65%">
                <Stop offset="0%" stopColor="#2FEA70" stopOpacity="0.16" />
                <Stop offset="100%" stopColor="#2FEA70" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowChampagne)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowGold)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowEmerald)" />
          </Svg>
        )}

        <SafeAreaView edges={['top']} style={styles.safeHero}>
          {/* Header Row: Title, Subtitle, Month Badge & Actions */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={[styles.dashboardTitle, { color: isDark ? '#F5F5F5' : '#183A27' }]}>
                Dashboard
              </Text>
            </View>

            <View style={styles.headerActions}>
              <AnimatedPressable
                onPress={() => router.push('/history')}
                style={[
                  styles.headerIconBtn,
                  {
                    backgroundColor: isDark ? '#21451f' : '#E7F0D9',
                    borderColor: isDark ? '#c7f23a66' : '#B7D493',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Cari catatan"
              >
                <Icon icon={Search01Icon} size={15} color={isDark ? '#d9f77b' : '#183A27'} />
              </AnimatedPressable>

              <ThemeToggleButton
                mode={mode}
                toggleTheme={toggleTheme}
                onLongPress={() => router.push('/settings')}
              />
            </View>
          </View>

          {/* Floating Hero Card & Saku Pengeluaran Berlapis */}
          <View style={styles.floatingCardContainer}>
            {/* Primary Balance Card */}
            <LinearGradient
              colors={heroCardGradient}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 1.0, y: 1.0 }}
              style={styles.heroBalanceCard}
            >
              <Text style={styles.heroBalanceLabel}>Saldo bulan ini</Text>
              <Animated.Text
                key={`bal-${summary.balance}`}
                entering={FadeInDown.duration(motionTokens.presets.digit.duration)}
                style={styles.heroBalanceAmount}
              >
                {formatRupiah(summary.balance)}
              </Animated.Text>
              {/* Handle Bar Horizontal */}
              <View style={styles.heroCardHandle} />
            </LinearGradient>

            {/* Connected Expense Pocket */}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/history',
                  params: {
                    year: String(selectedYear),
                    month: String(selectedMonth),
                    type: 'expense',
                  },
                })
              }
              style={({ pressed }) => [
                styles.heroExpensePocket,
                pressed && { opacity: 0.93 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Pengeluaran ${formatRupiah(summary.expense)}`}
            >
              <Text style={styles.expensePocketLabel}>Pengeluaran</Text>
              <Animated.Text
                key={`exp-${summary.expense}`}
                entering={FadeInDown.duration(motionTokens.duration.fast)}
                style={styles.expensePocketAmount}
              >
                {formatRupiah(summary.expense)}
              </Animated.Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Metric Cards (↙ Masuk & ↗ Keluar) */}
        <View style={styles.metricsRow}>
          <Card
            variant="metric"
            style={styles.metricCard}
            onPress={() =>
              router.push({
                pathname: '/history',
                params: {
                  year: String(selectedYear),
                  month: String(selectedMonth),
                  type: 'income',
                },
              })
            }
            accessibilityLabel={`Pemasukan ${formatRupiah(summary.income)}`}
          >
            <Text style={[styles.metricLabel, { color: colors.muted }]}>↙ Masuk</Text>
            <Animated.View
              key={`inc-${summary.income}`}
              entering={FadeInDown.duration(motionTokens.duration.fast)}
            >
              <AppText variant="title" color={colors.ink} tabularNums style={styles.metricValue}>
                {formatRupiah(summary.income)}
              </AppText>
            </Animated.View>
          </Card>

          <Card
            variant="metric"
            style={styles.metricCard}
            onPress={() =>
              router.push({
                pathname: '/history',
                params: {
                  year: String(selectedYear),
                  month: String(selectedMonth),
                  type: 'expense',
                },
              })
            }
            accessibilityLabel={`Pengeluaran ${formatRupiah(summary.expense)}`}
          >
            <Text style={[styles.metricLabel, { color: colors.muted }]}>↗ Keluar</Text>
            <Animated.View
              key={`exp-${summary.expense}`}
              entering={FadeInDown.duration(motionTokens.duration.fast)}
            >
              <AppText variant="title" color={colors.ink} tabularNums style={styles.metricValue}>
                {formatRupiah(summary.expense)}
              </AppText>
            </Animated.View>
          </Card>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* 6-Month Expense Trend Bar Chart */}
            <BarChartCard
              data={trend}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onPressMonth={handleBarMonthPress}
            />

            {/* Donut Chart: Expense by Category */}
            <DonutChartCard
              data={categoryExpenses}
              monthExpenseTotal={summary.expense}
              onSelectCategory={handleCategoryPress}
            />

            {/* Recent Transactions Section */}
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: colors.ink }]}>Terbaru</Text>
                <Pressable
                  onPress={() => router.push('/history')}
                  style={styles.recentActionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Lihat semua"
                >
                  <Text style={[styles.recentActionText, { color: colors.ink }]}>Lihat semua</Text>
                </Pressable>
              </View>

              {recentList.length === 0 ? (
                <Card style={styles.recentEmptyCard}>
                  <EmptyState
                    message="Belum ada catatan. Tambah transaksi pertama."
                    action={{
                      label: 'Catat Transaksi Sekarang',
                      onPress: () => router.push('/record'),
                    }}
                  />
                </Card>
              ) : (
                <View style={styles.recentList}>
                  {recentList.map((tx, index) => (
                    <Animated.View
                      key={tx.id}
                      entering={FadeInDown.delay(index * motionTokens.duration.stagger).duration(motionTokens.duration.fast)}
                    >
                      <TransactionItem
                        id={tx.id}
                        note={tx.note}
                        categoryName={tx.categoryName}
                        categoryColor={tx.categoryColor}
                        type={tx.type}
                        amountIdr={tx.amount_idr}
                        transactionDate={tx.transaction_date}
                        onPress={(id) => router.push(`/record?id=${id}`)}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Date Filter Modal for Month Selection */}
      <DateFilterModal
        visible={isMonthPickerVisible}
        onClose={() => setIsMonthPickerVisible(false)}
        year={selectedYear}
        month={selectedMonth}
        dateFrom={null}
        dateTo={null}
        onApply={(sel) => {
          setSelectedYear(sel.year);
          setSelectedMonth(sel.month);
          setIsMonthPickerVisible(false);
        }}
        onReset={() => {
          const d = new Date();
          setSelectedYear(d.getFullYear());
          setSelectedMonth(d.getMonth() + 1);
          setIsMonthPickerVisible(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['24'],
  },
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  safeHero: {
    paddingTop: spacing['3'],
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingTop: 4,
  },
  headerTitleGroup: {
    gap: 4,
  },
  dashboardTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  dashboardSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  monthBadgePill: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  monthBadgeText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#c7f23a66',
    backgroundColor: '#21451f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCardContainer: {
    backgroundColor: '#BAC842',
    borderRadius: 28,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginTop: 4,
  },
  heroBalanceCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderCurve: 'continuous',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 6,
  },
  heroBalanceLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    color: '#111111',
    lineHeight: 18,
  },
  heroBalanceAmount: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 34,
    letterSpacing: -0.8,
    color: '#111111',
    lineHeight: 40,
    marginTop: 14,
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  heroCardHandle: {
    width: 34,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#BAC842',
    alignSelf: 'center',
    marginBottom: 6,
  },
  heroExpensePocket: {
    backgroundColor: '#BAC842',
    paddingHorizontal: 24,
    paddingTop: 9,
    paddingBottom: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expensePocketLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
    color: '#111111',
    lineHeight: 18,
  },
  expensePocketAmount: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: '#111111',
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  content: {
    paddingHorizontal: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 15,
    gap: 7,
  },
  metricLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 10,
    lineHeight: 13,
  },
  metricValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 19,
    fontVariant: ['tabular-nums'],
  },
  loadingContainer: {
    padding: spacing['20'],
    alignItems: 'center',
  },
  recentSection: {
    marginTop: 22,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  recentTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  recentActionBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentActionText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    lineHeight: 15,
  },
  recentList: {
    gap: 4,
  },
  recentEmptyCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
