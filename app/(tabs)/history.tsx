import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { LegendList } from '@legendapp/list/react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateFilterModal, DatePresetKey, DateFilterSelection } from '../../components/DateFilterModal';
import { db } from '../../db/client';
import { transactions, Category } from '../../db/schema';
import {
  getFilteredTransactions,
  softDeleteTransaction,
  restoreTransaction,
  TransactionWithCategory,
} from '../../db/queries/transactions';
import { getActiveCategories } from '../../db/queries/categories';
import { MonthPicker } from '../../components/MonthPicker';
import { TransactionItem } from '../../components/TransactionItem';
import { CategoryPickerModal } from '../../components/CategoryPickerModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { COLORS } from '../../lib/constants';
import { formatSectionDate, formatDateShort, formatRupiah } from '../../lib/format';

type ListItem =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'item'; key: string; tx: TransactionWithCategory };

export default function HistoryScreen() {
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
  const undoTimeoutRef = useRef<unknown>(null);

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

  // Load transactions based on filters
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFilteredTransactions({
        year: hasDateFilter ? undefined : selectedYear,
        month: hasDateFilter ? undefined : selectedMonth,
        type: selectedType,
        categoryId: selectedCategory?.id,
        categoryIds: categoryIdsFilter || undefined,
        search: debouncedSearch,
        dateFrom: dateFrom ?? undefined,
        dateTo: dateTo ?? undefined,
      });
      setTransactionsList(data);
    } catch (e) {
      console.error('Error loading Riwayat transactions:', e);
    } finally {
      setLoading(false);
    }
  }, [
    selectedYear,
    selectedMonth,
    selectedType,
    selectedCategory,
    categoryIdsFilter,
    debouncedSearch,
    hasDateFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, liveTransactions]);

  // Format flattened list items grouped by date
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
        key: `tx_${tx.id}`,
        tx,
      });
    }

    return items;
  }, [transactionsList]);

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const id = deleteTargetId;
      setShowConfirmDelete(false);
      setDeleteTargetId(null);
      await softDeleteTransaction(id);

      setLastDeletedId(id);
      setUndoToastVisible(true);

      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current as number);
      undoTimeoutRef.current = setTimeout(() => {
        setUndoToastVisible(false);
        setLastDeletedId(null);
      }, 5000);
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  // Handle undo delete
  const handleUndoDelete = async () => {
    if (!lastDeletedId) return;
    try {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current as number);
      await restoreTransaction(lastDeletedId);
      setUndoToastVisible(false);
      setLastDeletedId(null);
    } catch (err) {
      console.error('Error restoring transaction:', err);
    }
  };

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
    const curNow = new Date();
    setSelectedYear(curNow.getFullYear());
    setSelectedMonth(curNow.getMonth() + 1);
    setDateFrom(null);
    setDateTo(null);
    setDatePreset(undefined);
  };

  const handleApplyDateFilter = (selection: DateFilterSelection) => {
    setSelectedYear(selection.year);
    setSelectedMonth(selection.month);
    setDateFrom(selection.dateFrom);
    setDateTo(selection.dateTo);
    setDatePreset(selection.presetKey);
  };

  const customPeriodLabel = useMemo(() => {
    if (!hasDateFilter) return undefined;
    if (datePreset === 'today') {
      return `Hari Ini · ${dateFrom ? formatDateShort(dateFrom) : ''}`;
    }
    if (datePreset === '7days') {
      return '7 Hari Terakhir';
    }
    if (datePreset === '30days') {
      return '30 Hari Terakhir';
    }
    return `${dateFrom ? formatDateShort(dateFrom) : '...'} – ${dateTo ? formatDateShort(dateTo) : '...'}`;
  }, [hasDateFilter, datePreset, dateFrom, dateTo]);

  const customPeriodLabelShort = useMemo(() => {
    if (!hasDateFilter) return 'Periode';
    if (datePreset === 'today') return 'Hari Ini';
    if (datePreset === '7days') return '7 Hari';
    if (datePreset === '30days') return '30 Hari';
    return `${dateFrom ? formatDateShort(dateFrom) : '...'} – ${dateTo ? formatDateShort(dateTo) : '...'}`;
  }, [hasDateFilter, datePreset, dateFrom, dateTo]);

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
  const hasActiveFilters =
    selectedType !== 'all' ||
    selectedCategory !== null ||
    categoryIdsFilter !== null ||
    searchQuery !== '' ||
    hasDateFilter;

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'header') {
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{item.title}</Text>
          </View>
        );
      }

      const tx = item.tx;
      return (
        <View style={styles.transactionCard}>
          <TransactionItem
            id={tx.id}
            note={tx.note}
            categoryName={tx.categoryName}
            categoryColor={tx.categoryColor}
            type={tx.type}
            amountIdr={tx.amount_idr}
            transactionDate={tx.transaction_date}
            onPress={(id) => router.push(`/record?id=${id}`)}
            onLongPress={(id) => {
              setDeleteTargetId(id);
              setShowConfirmDelete(true);
            }}
          />
        </View>
      );
    },
    []
  );

  return (
    <View style={styles.container}>
      {/* Top Blue Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerTitle}>Riwayat</Text>
        </SafeAreaView>
      </View>

      {/* Top Controls Area */}
      <View style={styles.controlsArea}>
        {/* Month Navigator */}
        {/* Unified Month & Period Bar */}
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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari catatan atau kategori"
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Chips Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {/* Semua */}
          <Pressable
            style={[
              styles.chip,
              selectedType === 'all' && !selectedCategory && !categoryIdsFilter
                ? styles.chipSelected
                : null,
            ]}
            onPress={() => {
              setSelectedType('all');
              setSelectedCategory(null);
              setCategoryIdsFilter(null);
            }}
          >
            <Text
              style={[
                styles.chipText,
                selectedType === 'all' && !selectedCategory && !categoryIdsFilter
                  ? styles.chipTextSelected
                  : null,
              ]}
            >
              Semua
            </Text>
          </Pressable>

          {/* Keluar */}
          <Pressable
            style={[styles.chip, selectedType === 'expense' ? styles.chipSelected : null]}
            onPress={() => setSelectedType(selectedType === 'expense' ? 'all' : 'expense')}
          >
            <Text
              style={[
                styles.chipText,
                selectedType === 'expense' ? styles.chipTextSelected : null,
              ]}
            >
              Keluar
            </Text>
          </Pressable>

          {/* Masuk */}
          <Pressable
            style={[styles.chip, selectedType === 'income' ? styles.chipSelected : null]}
            onPress={() => setSelectedType(selectedType === 'income' ? 'all' : 'income')}
          >
            <Text
              style={[
                styles.chipText,
                selectedType === 'income' ? styles.chipTextSelected : null,
              ]}
            >
              Masuk
            </Text>
          </Pressable>

          {/* Kategori Filter */}
          <Pressable
            style={[
              styles.chip,
              selectedCategory || categoryIdsFilter ? styles.chipSelected : null,
            ]}
            onPress={() => {
              if (selectedCategory || categoryIdsFilter) {
                setSelectedCategory(null);
                setCategoryIdsFilter(null);
              } else {
                setCategoryPickerVisible(true);
              }
            }}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory || categoryIdsFilter ? styles.chipTextSelected : null,
              ]}
            >
              {selectedCategory
                ? `${selectedCategory.name} ✕`
                : categoryIdsFilter
                ? 'Kategori terpilih ✕'
                : 'Kategori ⌄'}
            </Text>
          </Pressable>

          {/* Periode / Tanggal Filter */}
          <Pressable
            style={[styles.chip, hasDateFilter ? styles.chipSelected : null]}
            onPress={() => {
              if (hasDateFilter) {
                setDateFrom(null);
                setDateTo(null);
                setDatePreset(undefined);
              } else {
                setDateModalVisible(true);
              }
            }}
          >
            <Text style={[styles.chipText, hasDateFilter ? styles.chipTextSelected : null]}>
              {hasDateFilter ? `${customPeriodLabelShort} ✕` : 'Periode ⌄'}
            </Text>
          </Pressable>
        </ScrollView>

      </View>

      {/* Contextual Transaction Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>
          {summaryTotals.count} transaksi
        </Text>
        <View style={styles.summaryTotals}>
          {summaryTotals.expense > 0 && selectedType !== 'income' ? (
            <View style={styles.summaryBadgeExpense}>
              <Ionicons name="arrow-down-circle" size={13} color={COLORS.red} />
              <Text style={styles.summaryExpenseText}>
                {formatRupiah(summaryTotals.expense)}
              </Text>
            </View>
          ) : null}
          {summaryTotals.income > 0 && selectedType !== 'expense' ? (
            <View style={styles.summaryBadgeIncome}>
              <Ionicons name="arrow-up-circle" size={13} color={COLORS.green} />
              <Text style={styles.summaryIncomeText}>
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
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : listData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada transaksi ditemukan.</Text>
            {hasActiveFilters ? (
              <Pressable style={styles.clearFilterBtn} onPress={handleClearFilters}>
                <Text style={styles.clearFilterText}>Hapus filter</Text>
              </Pressable>
            ) : null}
          </View>
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
      {undoToastVisible ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Transaksi dihapus</Text>
          <Pressable onPress={handleUndoDelete} style={styles.undoBtn}>
            <Text style={styles.undoText}>Urungkan</Text>
          </Pressable>
        </View>
      ) : null}

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
        title="Hapus transaksi ini?"
        message="Transaksi yang dihapus dapat diurungkan sesaat setelah dihapus."
        confirmText="Hapus"
        cancelText="Batal"
        destructive
        onConfirm={handleConfirmDelete}
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
        dateFrom={dateFrom}
        dateTo={dateTo}
        presetKey={datePreset}
        onApply={handleApplyDateFilter}
        onReset={handleResetDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    paddingVertical: 4,
  },
  controlsArea: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  monthPickerWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f4fa',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.ink,
    padding: 0,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 2,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d7e1f3',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6d7b92',
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8896aa',
    letterSpacing: 0.5,
  },
  transactionCard: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    marginVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.line,
    boxShadow: '0 2px 6px rgba(31, 63, 119, 0.03)',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 12,
  },
  clearFilterBtn: {
    backgroundColor: COLORS.pale,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#1a2a48',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 10px 25px rgba(26, 42, 72, 0.35)',
    elevation: 6,
  },
  toastText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  undoBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  undoText: {
    color: '#91acff',
    fontWeight: '700',
    fontSize: 13,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafd',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  summaryTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryBadgeExpense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryExpenseText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.red,
    fontVariant: ['tabular-nums'],
  },
  summaryBadgeIncome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryIncomeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
    fontVariant: ['tabular-nums'],
  },
});
