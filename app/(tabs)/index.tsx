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
import MonthPicker from '@/components/molecules/MonthPicker';
import TransactionItem from '@/components/molecules/TransactionItem';
import BarChartCard from '@/components/organisms/BarChartCard';
import DonutChartCard from '@/components/organisms/DonutChartCard';
import { formatRupiah } from '../../lib/format';
import {
  colors,
  radii,
  spacing,
  typography,
  Card,
  AppText,
  Button,
  SectionHeader,
  EmptyState,
} from '@/components/ui';

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
              <Ionicons name="settings-outline" size={18} color={colors.white} />
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
          <Card variant="metric" style={styles.metricCard}>
            <Text style={styles.metricLabel}>↙ Masuk</Text>
            <AppText variant="title" color={colors.green} tabularNums style={styles.metricValue}>
              {formatRupiah(summary.income)}
            </AppText>
          </Card>
          <Card variant="metric" style={styles.metricCard}>
            <Text style={styles.metricLabel}>↗ Keluar</Text>
            <AppText variant="title" color={colors.red} tabularNums style={styles.metricValue}>
              {formatRupiah(summary.expense)}
            </AppText>
          </Card>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsRow}>
          <Button
            title="Catat Transaksi"
            onPress={() => router.push('/record')}
            variant="primary"
            icon={<Ionicons name="add-circle" size={18} color={colors.white} />}
            style={styles.actionBtnFlex}
          />

          <Button
            title="Kelola Kategori"
            onPress={() => router.push('/categories')}
            variant="outline"
            icon={<Ionicons name="pricetags-outline" size={17} color={colors.primary} />}
            style={styles.actionBtnFlex}
          />
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
              <SectionHeader
                title="Terbaru"
                rightAction={{ label: 'Lihat semua', onPress: () => router.push('/history') }}
                variant="subtitle"
              />

              <Card style={styles.recentCard}>
                {recentList.length === 0 ? (
                  <EmptyState
                    message="Belum ada catatan. Tambah transaksi pertama."
                    action={{
                      label: 'Catat Transaksi Sekarang',
                      onPress: () => router.push('/record'),
                    }}
                  />
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
              </Card>
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
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: spacing['24'],
  },
  hero: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderCurve: 'continuous',
    paddingHorizontal: spacing['10'],
    paddingBottom: 44,
  },
  safeHeader: {
    paddingTop: spacing['4'],
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['9'],
  },
  heroGreeting: {
    ...typography.title,
    fontSize: 20,
    color: colors.white,
  },
  heroSub: {
    ...typography.caption,
    color: colors.heroSubtitle,
    marginTop: spacing['2'],
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.heroIconBorder,
    backgroundColor: colors.heroIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSection: {
    marginTop: spacing['2'],
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.heroBalanceLabel,
    fontWeight: '500',
  },
  balanceAmount: {
    ...typography.displayLarge,
    color: colors.white,
    marginVertical: spacing['3'],
  },
  content: {
    paddingHorizontal: spacing['8'],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing['6'],
    marginTop: -26,
  },
  metricCard: {
    flex: 1,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  metricValue: {
    marginTop: spacing['3'],
  },
  loadingContainer: {
    padding: spacing['20'],
    alignItems: 'center',
  },
  recentSection: {
    marginTop: spacing['11'],
  },
  recentCard: {
    paddingHorizontal: spacing['7'],
    paddingVertical: 0,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing['5'],
    marginTop: spacing['7'],
  },
  actionBtnFlex: {
    flex: 1,
  },
});
