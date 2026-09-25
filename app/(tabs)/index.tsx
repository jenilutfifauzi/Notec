import React, { useState, useEffect, useCallback, useTransition } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
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
import { MonthPicker } from '../../components/MonthPicker';
import { BarChartCard } from '../../components/BarChartCard';
import { DonutChartCard } from '../../components/DonutChartCard';
import { TransactionItem } from '../../components/TransactionItem';
import { COLORS } from '../../lib/constants';
import { formatRupiah } from '../../lib/format';

export default function BerandaScreen() {
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
    const padMonth = String(month).padStart(2, '0');
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
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Blue Hero Header */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          {/* Greeting & Settings */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>Halo! 👋</Text>
              <Text style={styles.heroSub}>Ringkasan keuanganmu</Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              style={styles.iconButton}
              accessibilityLabel="Pengaturan"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={18} color={COLORS.white} />
            </Pressable>
          </View>

          {/* Balance */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Selisih bulan ini</Text>
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
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Metric Cards (Overlapping Hero) */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>↙ Masuk</Text>
            <Text style={[styles.metricValue, styles.inValue]}>
              {formatRupiah(summary.income)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>↗ Keluar</Text>
            <Text style={[styles.metricValue, styles.outValue]}>
              {formatRupiah(summary.expense)}
            </Text>
          </View>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsRow}>
          <Pressable
            style={styles.primaryActionBtn}
            onPress={() => router.push('/record')}
            accessibilityRole="button"
          >
            <Ionicons name="add-circle" size={18} color={COLORS.white} />
            <Text style={styles.primaryActionBtnText}>Catat Transaksi</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryActionBtn}
            onPress={() => router.push('/categories')}
            accessibilityRole="button"
          >
            <Ionicons name="pricetags-outline" size={17} color={COLORS.primary} />
            <Text style={styles.secondaryActionBtnText}>Kelola Kategori</Text>
          </Pressable>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Terbaru</Text>
                <Pressable
                  onPress={() => router.push('/history')}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text style={styles.seeAllText}>Lihat semua</Text>
                </Pressable>
              </View>

              <View style={styles.recentCard}>
                {recentList.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      Belum ada catatan. Tambah transaksi pertama.
                    </Text>
                    <Pressable
                      style={styles.emptyActionBtn}
                      onPress={() => router.push('/record')}
                      accessibilityRole="button"
                    >
                      <Ionicons name="add" size={16} color={COLORS.primary} />
                      <Text style={styles.emptyActionBtnText}>Catat Transaksi Sekarang</Text>
                    </Pressable>
                  </View>
                ) : (
                  recentList.map((tx) => (
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
                  ))
                )}
              </View>
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
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  hero: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  safeHeader: {
    paddingTop: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 12,
    color: '#d4e1ff',
    marginTop: 4,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#88a9ec',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSection: {
    marginTop: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#d7e3ff',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.8,
    marginVertical: 6,
  },
  content: {
    paddingHorizontal: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: -26,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    boxShadow: '0 6px 16px rgba(31, 63, 119, 0.06)',
    elevation: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.4,
  },
  inValue: {
    color: COLORS.green,
  },
  outValue: {
    color: COLORS.red,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  recentSection: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  recentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
    boxShadow: '0 6px 16px rgba(31, 63, 119, 0.05)',
    elevation: 2,
  },
  emptyContainer: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 12,
    gap: 6,
    boxShadow: '0 4px 12px rgba(36, 81, 191, 0.25)',
    elevation: 3,
  },
  primaryActionBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d2def4',
    gap: 6,
  },
  secondaryActionBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pale,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderCurve: 'continuous',
    marginTop: 12,
    gap: 4,
  },
  emptyActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
