import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
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
import MonthPicker from '@/components/molecules/MonthPicker';
import TransactionItem from '@/components/molecules/TransactionItem';
import BarChartCard from '@/components/organisms/BarChartCard';
import DonutChartCard from '@/components/organisms/DonutChartCard';
import { formatRupiah } from '../../lib/format';
import {
  radii,
  spacing,
  typography,
  fontFamilies,
  Card,
  AppText,
  SectionHeader,
  EmptyState,
} from '@/components/ui';
export default function BerandaScreen() {
  const { mode, colors, toggleTheme } = useTheme();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  const [summary, setSummary] = useState<MonthSummary>({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [trend, setTrend] = useState<ExpenseTrendMonth[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [recentList, setRecentList] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header with Stacked Card Layers */}
      <View style={styles.heroWrapper}>
        {/* Hero Stacked Card Layers (Layered behind Hero) */}
        <View
          style={[
            styles.heroStack3,
            {
              backgroundColor: mode === 'dark' ? '#193526' : colors.heroStack3,
              borderColor: mode === 'dark' ? '#28442e' : 'transparent',
            },
          ]}
        />
        <View
          style={[
            styles.heroStack2,
            {
              backgroundColor: mode === 'dark' ? '#24452d' : colors.heroStack2,
              borderColor: mode === 'dark' ? '#35532c' : 'transparent',
            },
          ]}
        />
        <View
          style={[
            styles.heroStack1,
            {
              backgroundColor: mode === 'dark' ? '#396328' : colors.heroStack1,
              borderColor: mode === 'dark' ? '#4a6e30' : 'transparent',
            },
          ]}
        />

        {/* Green Nature Hero Header (Front) */}
        <LinearGradient colors={['#d5f56a', '#8fc83a']} style={styles.hero}>
          <SafeAreaView edges={['top']} style={styles.safeHeader}>
            {/* Greeting & Actions */}
            {/* Top Bar: Search Pill (Dynamic Island) & Theme Toggle */}
            <View style={styles.heroTop}>
              <Pressable
                onPress={() => router.push('/history')}
                style={styles.searchPill}
                accessibilityRole="button"
                accessibilityLabel="Cari catatan atau kategori"
              >
                <Icon icon={Search01Icon} size={14} color="#c7f23a" />
                <Text style={styles.searchPillText}>Cari...</Text>
              </Pressable>
              <Pressable
                onPress={toggleTheme}
                onLongPress={() => router.push('/settings')}
                style={styles.themeButton}
                accessibilityLabel={mode === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                accessibilityRole="button"
              >
                <Icon
                  icon={mode === 'dark' ? Sun01Icon : Moon02Icon}
                  size={16}
                  color="#d9f77b"
                />
              </Pressable>
            </View>

            {/* Greeting: Dashboard */}
            <View style={styles.heroTitleGroup}>
              <Text style={styles.heroGreeting}>Dashboard</Text>
              <Text style={styles.heroSub}>Ringkasan keuanganmu</Text>
            </View>

            {/* Balance */}
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Saldo bulan ini</Text>
              <Text style={styles.balanceAmount}>{formatRupiah(summary.balance)}</Text>

              {/* Month Picker in Hero */}
              <MonthPicker
                year={selectedYear}
                month={selectedMonth}
                onChange={handleMonthChange}
                variant="hero"
              />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Metric Cards (Overlapping Hero) */}
        <View style={styles.metricsRow}>
          <Card variant="metric" style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>↙ Masuk</Text>
            <AppText variant="title" color={colors.ink} tabularNums style={styles.metricValue}>
              {formatRupiah(summary.income)}
            </AppText>
          </Card>
          <Card variant="metric" style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>↗ Keluar</Text>
            <AppText variant="title" color={colors.ink} tabularNums style={styles.metricValue}>
              {formatRupiah(summary.expense)}
            </AppText>
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
                  {recentList.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      id={tx.id}
                      note={tx.note}
                      categoryName={tx.categoryName}
                      categoryColor={tx.categoryColor}
                      type={tx.type}
                      amountIdr={tx.amount_idr}
                      transactionDate={tx.transaction_date}
                      onPress={(id) => router.push(`/record?id=${id}`)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </View>
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
  heroWrapper: {
    position: 'relative',
    marginBottom: 20,
    overflow: 'visible',
  },
  hero: {
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    paddingBottom: 22,
    zIndex: 4,
  },
  safeHeader: {
    paddingTop: spacing['3'],
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#063b1b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9f77b66',
    paddingHorizontal: 12,
    height: 34,
    gap: 6,
  },
  searchPillText: {
    color: '#d9f77b',
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    letterSpacing: 0,
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
  heroTitleGroup: {
    gap: 4,
    marginBottom: 14,
  },
  heroGreeting: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    letterSpacing: -0.3,
    color: '#063b1b',
    lineHeight: 26,
  },
  heroSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: '#063b1b',
    lineHeight: 16,
  },
  balanceSection: {
    gap: 5,
  },
  balanceLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: '#063b1b',
    lineHeight: 16,
  },
  balanceAmount: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 34,
    letterSpacing: -0.4,
    color: '#063b1b',
    lineHeight: 40,
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  heroStack1: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: -6,
    height: 48,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderTopWidth: 0,
    zIndex: 3,
  },
  heroStack2: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: -12,
    height: 48,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderTopWidth: 0,
    zIndex: 2,
  },
  heroStack3: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: -20,
    height: 48,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderTopWidth: 0,
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 18,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 15,
    gap: 7,
  },
  metricLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 15,
  },
  metricValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    letterSpacing: -0.2,
    lineHeight: 21,
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
