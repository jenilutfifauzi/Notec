import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { LegendList } from '@legendapp/list/react-native';
import { Icon, ArrowDown02Icon, ArrowUp02Icon, ChevronDownIcon, ReceiptTextIcon } from '@/lib/icons';
import { db } from '../../db/client';
import { transactions, Category } from '../../db/schema';
import {
  getFilteredTransactions,
  softDeleteTransaction,
  restoreTransaction,
  TransactionWithCategory,
} from '../../db/queries/transactions';
import MonthPicker from '@/components/molecules/MonthPicker';
import TransactionItem from '@/components/molecules/TransactionItem';
import DateFilterModal, { type DatePresetKey, type DateFilterSelection } from '@/components/organisms/DateFilterModal';
import CategoryPickerModal from '@/components/organisms/CategoryPickerModal';
import ConfirmDialog from '@/components/organisms/ConfirmDialog';
import { formatSectionDate, formatDateShort, formatRupiah } from '../../lib/format';
import { useTheme } from '@/lib/theme';
import {
  radii,
  spacing,
  typography,
  ScreenHeader,
  TextInput,
  Chip,
  SectionHeader,
  EmptyState,
  Toast,
  Card,
} from '@/components/ui';
type ListItem =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'item'; key: string; tx: TransactionWithCategory };

export default function HistoryScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    year?: string;
    month?: string;
    type?: 'income' | 'expense' | 'all';
    categoryId?: string;
    categoryIds?: string;
  }>();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(
    params.year ? parseInt(params.year, 10) : now.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    params.month ? parseInt(params.month, 10) : now.getMonth() + 1
  );
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>(
    params.type || 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryIdsFilter, setCategoryIdsFilter] = useState<number[] | null>(
    params.categoryIds
      ? params.categoryIds.split(',').map(Number).filter((n) => !isNaN(n))
      : null
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePresetKey | undefined>(undefined);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const hasDateFilter = dateFrom !== null || dateTo !== null;
  const [transactionsList, setTransactionsList] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Category picker modal for filter chip
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  // Deletion & Undo state
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [lastDeletedId, setLastDeletedId] = useState<number | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  // Observe transactions changes reactively
  const { data: liveTransactions } = useLiveQuery(
    db.select({ id: transactions.id, updatedAt: transactions.updated_at }).from(transactions)
  );

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load transactions data
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);

      let effectiveDateFrom: string | undefined = undefined;
      let effectiveDateTo: string | undefined = undefined;

      if (hasDateFilter) {
        effectiveDateFrom = dateFrom || undefined;
        effectiveDateTo = dateTo || undefined;
      } else {
        const y = selectedYear;
        const m = String(selectedMonth).padStart(2, '0');
        effectiveDateFrom = `${y}-${m}-01`;
        const lastDay = new Date(y, selectedMonth, 0).getDate();
        effectiveDateTo = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
      }

      let categoryIds: number[] | undefined = undefined;
      if (selectedCategory) {
        categoryIds = [selectedCategory.id];
      } else if (categoryIdsFilter && categoryIdsFilter.length > 0) {
        categoryIds = categoryIdsFilter;
      }

      const res = await getFilteredTransactions({
        type: selectedType,
        dateFrom: effectiveDateFrom,
        dateTo: effectiveDateTo,
        categoryIds,
        search: debouncedSearch.trim() || undefined,
      });

      setTransactionsList(res);
    } catch (e) {
      console.error('Failed to load history transactions:', e);
    } finally {
      setLoading(false);
    }
  }, [
    selectedYear,
    selectedMonth,
    selectedType,
    selectedCategory,
    categoryIdsFilter,
    dateFrom,
    dateTo,
    hasDateFilter,
    debouncedSearch,
  ]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, liveTransactions]);

  // Delete transaction with undo capability
  const handleExecuteDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await softDeleteTransaction(deleteTargetId);
      setLastDeletedId(deleteTargetId);
      setShowConfirmDelete(false);
      setDeleteTargetId(null);
      setUndoToastVisible(true);

      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      undoTimeoutRef.current = setTimeout(() => {
        setUndoToastVisible(false);
        setLastDeletedId(null);
      }, 4000) as unknown as number;
    } catch (err) {
      console.error('Failed to soft delete transaction:', err);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedId) return;
    try {
      await restoreTransaction(lastDeletedId);
      setUndoToastVisible(false);
      setLastDeletedId(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    } catch (err) {
      console.error('Failed to restore transaction:', err);
    }
  };

  // Group transactions by date for section list
  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    let currentDate = '';

    for (const tx of transactionsList) {
      if (tx.transaction_date !== currentDate) {
        currentDate = tx.transaction_date;
        items.push({
          kind: 'header',
          key: `header_${currentDate}`,
          title: formatSectionDate(currentDate),
        });
      }
      items.push({
        kind: 'item',
        key: `item_${tx.id}`,
        tx,
      });
    }

    return items;
  }, [transactionsList]);

  // Calculate summary totals
  const summaryTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactionsList) {
      if (tx.type === 'income') {
        income += tx.amount_idr;
      } else {
        expense += tx.amount_idr;
      }
    }
    return { income, expense, count: transactionsList.length };
  }, [transactionsList]);

  // Dynamic short label for custom date filter chip
  const customPeriodLabelShort = useMemo(() => {
    if (datePreset === 'today') return 'Hari Ini';
    if (datePreset === '7days') return '7 Hari Terakhir';
    if (datePreset === '30days') return '30 Hari Terakhir';
    if (datePreset === 'thisMonth') return 'Bulan Ini';
    if (datePreset === 'lastMonth') return 'Bulan Lalu';
    if (dateFrom && dateTo) {
      return `${formatDateShort(dateFrom)} - ${formatDateShort(dateTo)}`;
    }
    if (dateFrom) return `Sejak ${formatDateShort(dateFrom)}`;
    if (dateTo) return `Hingga ${formatDateShort(dateTo)}`;
    return 'Kustom';
  }, [datePreset, dateFrom, dateTo]);

  // Full label for MonthPicker custom title
  const customPeriodLabel = useMemo(() => {
    if (!hasDateFilter) return undefined;
    return customPeriodLabelShort;
  }, [hasDateFilter, customPeriodLabelShort]);

  // Clear filters
  const handleClearFilters = () => {
    setSelectedType('all');
    setSelectedCategory(null);
    setCategoryIdsFilter(null);
    setSearchQuery('');
    setDateFrom(null);
    setDateTo(null);
    setDatePreset(undefined);
  };

  const handleResetDate = () => {
    setDateFrom(null);
    setDateTo(null);
    setDatePreset(undefined);
  };

  const hasActiveFilters =
    selectedType !== 'all' ||
    selectedCategory !== null ||
    (categoryIdsFilter !== null && categoryIdsFilter.length > 0) ||
    searchQuery.trim().length > 0 ||
    hasDateFilter;

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'header') {
        return (
          <SectionHeader
            title={item.title}
            variant="overline"
            style={[styles.sectionHeader, { alignItems: 'center' }]}
          />
        );
      }

      return (
        <Card style={styles.transactionCard}>
          <TransactionItem
            id={item.tx.id}
            categoryName={item.tx.categoryName}
            categoryColor={item.tx.categoryColor}
            amountIdr={item.tx.amount_idr}
            type={item.tx.type}
            note={item.tx.note}
            transactionDate={item.tx.transaction_date}
            onPress={(id) => router.push(`/record?id=${id}`)}
            onLongPress={(id) => {
              setDeleteTargetId(id);
              setShowConfirmDelete(true);
            }}
          />
        </Card>
      );
    },
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Gradient Header */}
      <ScreenHeader title="Riwayat" />

      {/* Top Controls Area */}
      <View style={[styles.controlsArea, { backgroundColor: colors.white, borderBottomColor: colors.line }]}>
        {/* Month Navigator */}
        <View style={styles.monthPickerWrap}>
          <MonthPicker
            year={selectedYear}
            month={selectedMonth}
            onChange={(y, m) => {
              setSelectedYear(y);
              setSelectedMonth(m);
              setDateFrom(null);
              setDateTo(null);
              setDatePreset(undefined);
            }}
            variant="light"
            onPressTitle={() => setDateModalVisible(true)}
            customLabel={customPeriodLabel}
            hasCustomFilter={hasDateFilter}
            onClearCustomFilter={handleResetDate}
          />
        </View>

        {/* Search Bar */}
        <TextInput
          variant="search"
          placeholder="Cari catatan atau kategori"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        {/* Filter Chips Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {/* Semua */}
          <Chip
            label="Semua"
            active={selectedType === 'all' && !selectedCategory && !categoryIdsFilter}
            onPress={() => {
              setSelectedType('all');
              setSelectedCategory(null);
              setCategoryIdsFilter(null);
            }}
          />

          {/* Keluar */}
          <Chip
            label="Keluar"
            active={selectedType === 'expense'}
            onPress={() => setSelectedType(selectedType === 'expense' ? 'all' : 'expense')}
          />

          {/* Masuk */}
          <Chip
            label="Masuk"
            active={selectedType === 'income'}
            onPress={() => setSelectedType(selectedType === 'income' ? 'all' : 'income')}
          />

          {/* Kategori Filter */}
          <Chip
            label={
              selectedCategory
                ? selectedCategory.name
                : categoryIdsFilter
                ? 'Kategori terpilih'
                : 'Kategori'
            }
            rightIcon={
              !selectedCategory && !categoryIdsFilter ? (
                <Icon icon={ChevronDownIcon} size={12} color={colors.muted} />
              ) : undefined
            }
            active={Boolean(selectedCategory || categoryIdsFilter)}
            onPress={() => {
              if (selectedCategory || categoryIdsFilter) {
                setSelectedCategory(null);
                setCategoryIdsFilter(null);
              } else {
                setCategoryPickerVisible(true);
              }
            }}
            onClear={
              selectedCategory || categoryIdsFilter
                ? () => {
                    setSelectedCategory(null);
                    setCategoryIdsFilter(null);
                  }
                : undefined
            }
          />

          {/* Periode / Tanggal Filter */}
          <Chip
            label={hasDateFilter ? customPeriodLabelShort : 'Periode'}
            rightIcon={
              !hasDateFilter ? (
                <Icon icon={ChevronDownIcon} size={12} color={colors.muted} />
              ) : undefined
            }
            active={hasDateFilter}
            onPress={() => {
              if (hasDateFilter) {
                setDateFrom(null);
                setDateTo(null);
                setDatePreset(undefined);
              } else {
                setDateModalVisible(true);
              }
            }}
            onClear={
              hasDateFilter
                ? () => {
                    setDateFrom(null);
                    setDateTo(null);
                    setDatePreset(undefined);
                  }
                : undefined
            }
          />
        </ScrollView>
      </View>

      {/* Contextual Transaction Summary */}
      <View style={[styles.summaryBar, { backgroundColor: colors.surfaceInput, borderBottomColor: colors.line }]}>
        <Text style={[styles.summaryCount, { color: colors.muted }]}>
          {summaryTotals.count} transaksi
        </Text>
        <View style={styles.summaryTotals}>
          {summaryTotals.expense > 0 && selectedType !== 'income' ? (
            <View style={styles.summaryBadgeExpense}>
              <Icon
                icon={ArrowDown02Icon}
                size={13}
                strokeWidth={2}
                color={colors.red}
                style={{ marginRight: 2 }}
              />
              <Text style={[styles.summaryExpenseText, { color: colors.red }]}>
                {formatRupiah(summaryTotals.expense)}
              </Text>
            </View>
          ) : null}
          {summaryTotals.income > 0 && selectedType !== 'expense' ? (
            <View style={styles.summaryBadgeIncome}>
              <Icon
                icon={ArrowUp02Icon}
                size={13}
                strokeWidth={2}
                color={colors.green}
                style={{ marginRight: 2 }}
              />
              <Text style={[styles.summaryIncomeText, { color: colors.green }]}>
                {formatRupiah(summaryTotals.income)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Main List */}
      <View style={styles.listWrapper}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : listData.length === 0 ? (
          <EmptyState
            icon={
              <Icon
                icon={ReceiptTextIcon}
                size={36}
                color={colors.iconMuted}
                strokeWidth={1.4}
              />
            }
            message="Tidak ada transaksi ditemukan."
            action={
              hasActiveFilters
                ? { label: 'Hapus filter', onPress: handleClearFilters }
                : undefined
            }
            style={styles.emptyContainer}
          />
        ) : (
          <LegendList
            data={listData}
            renderItem={renderItem}
            keyExtractor={(item: ListItem) => item.key}
            estimatedItemSize={60}
            recycleItems
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Undo Toast */}
      <Toast
        visible={undoToastVisible}
        message="Transaksi dihapus"
        action={{ label: 'Urungkan', onPress: handleUndoDelete }}
        onDismiss={() => setUndoToastVisible(false)}
      />

      {/* Category Picker Modal for filtering */}
      <CategoryPickerModal
        visible={categoryPickerVisible}
        type={selectedType === 'income' ? 'income' : 'expense'}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          setCategoryIdsFilter(null);
        }}
        onClose={() => setCategoryPickerVisible(false)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        visible={showConfirmDelete}
        title="Hapus transaksi?"
        message="Transaksi ini akan dihapus dari catatan. Anda dapat membatalkannya sesaat setelah menghapus."
        confirmText="Hapus"
        cancelText="Batal"
        destructive
        onConfirm={handleExecuteDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
          setDeleteTargetId(null);
        }}
      />

      {/* Date Filter Modal */}
      <DateFilterModal
        visible={dateModalVisible}
        onClose={() => setDateModalVisible(false)}
        year={selectedYear}
        month={selectedMonth}
        presetKey={datePreset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onApply={(filter: DateFilterSelection) => {
          setSelectedYear(filter.year);
          setSelectedMonth(filter.month);
          setDatePreset(filter.presetKey);
          setDateFrom(filter.dateFrom);
          setDateTo(filter.dateTo);
        }}
        onReset={handleResetDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsArea: {
    paddingHorizontal: spacing['8'],
    paddingTop: spacing['6'],
    paddingBottom: spacing['5'],
    borderBottomWidth: 1,
  },
  monthPickerWrap: {
    alignItems: 'center',
    marginBottom: spacing['5'],
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: spacing['4'],
    paddingTop: spacing['6'],
    paddingBottom: spacing['1'],
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing['8'],
    paddingBottom: spacing['20'],
  },
  sectionHeader: {
    marginTop: spacing['9'],
    marginBottom: spacing['2'],
    paddingHorizontal: 2,
  },
  transactionCard: {
    paddingHorizontal: spacing['7'],
    paddingVertical: 0,
    borderRadius: radii.lg,
    marginVertical: 3,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    padding: spacing['16'],
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['8'],
    paddingVertical: spacing['5'],
    borderBottomWidth: 1,
  },
  summaryCount: {
    ...typography.caption,
  },
  summaryTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['6'],
  },
  summaryBadgeExpense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  summaryExpenseText: {
    ...typography.captionBold,
    fontVariant: ['tabular-nums'],
  },
  summaryBadgeIncome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  summaryIncomeText: {
    ...typography.captionBold,
    fontVariant: ['tabular-nums'],
  },
});
