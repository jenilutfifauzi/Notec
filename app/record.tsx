import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Category } from '../db/schema';
import {
  insertTransaction,
  updateTransaction,
  getTransactionById,
} from '../db/queries/transactions';
import { CategoryPickerModal } from '../components/CategoryPickerModal';
import { COLORS, MAX_AMOUNT, MAX_NOTE_LENGTH } from '../lib/constants';
import {
  rupiahFormatter,
  formatDate,
  getTodayDateString,
} from '../lib/format';

export default function RecordScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? Number(params.id) : null;
  const isEditing = Boolean(editId && !isNaN(editId));

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [rawAmount, setRawAmount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [dateStr, setDateStr] = useState<string>(getTodayDateString());
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Load transaction if in edit mode
  useEffect(() => {
    if (!editId) return;

    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const tx = await getTransactionById(editId);
        if (!isMounted) return;

        if (tx) {
          setType(tx.type);
          setRawAmount(tx.amount_idr);
          setAmountStr(rupiahFormatter.format(tx.amount_idr));
          setDateStr(tx.transaction_date);
          const [y, m, d] = tx.transaction_date.split('-').map(Number);
          setDateObj(new Date(y, m - 1, d));
          setNote(tx.note || '');
          setSelectedCategory({
            id: tx.category_id,
            name: tx.categoryName,
            type: tx.type,
            color: tx.categoryColor,
            archived_at: null,
            created_at: tx.created_at,
            updated_at: tx.updated_at,
          });
        }
      } catch (err) {
        console.error('Failed to load transaction for edit:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [editId]);

  // Handle amount change with formatting
  const handleAmountChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 13);
    if (!digitsOnly) {
      setAmountStr('');
      setRawAmount(0);
      return;
    }

    const num = parseInt(digitsOnly, 10);
    setRawAmount(num);
    setAmountStr(rupiahFormatter.format(num));
    if (errorText) setErrorText(null);
  };

  // Handle type change
  const handleTypeChange = (newType: 'income' | 'expense') => {
    if (newType !== type) {
      setType(newType);
      // Clear category if it doesn't match the new type
      if (selectedCategory && selectedCategory.type !== newType) {
        setSelectedCategory(null);
      }
    }
  };

  // Handle Date picker change
  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selected) {
      setDateObj(selected);
      const year = selected.getFullYear();
      const month = String(selected.getMonth() + 1).padStart(2, '0');
      const day = String(selected.getDate()).padStart(2, '0');
      setDateStr(`${year}-${month}-${day}`);
    }
  };

  // Save Transaction
  const handleSave = async () => {
    if (rawAmount <= 0) {
      setErrorText('Isi nominal lebih dari Rp0');
      return;
    }
    if (rawAmount > MAX_AMOUNT) {
      setErrorText('Nominal melebihi batas maksimal');
      return;
    }
    if (!selectedCategory) {
      setErrorText('Pilih kategori');
      return;
    }

    try {
      setSubmitting(true);
      setErrorText(null);

      if (isEditing && editId) {
        await updateTransaction(editId, {
          category_id: selectedCategory.id,
          type,
          amount_idr: rawAmount,
          transaction_date: dateStr,
          note: note.trim() || null,
        });
      } else {
        await insertTransaction({
          category_id: selectedCategory.id,
          type,
          amount_idr: rawAmount,
          transaction_date: dateStr,
          note: note.trim() || null,
        });
      }

      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan transaksi';
      setErrorText(msg);
      Alert.alert('Gagal', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Blue Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Kembali"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Ubah transaksi' : 'Catat transaksi'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Toggle Segment */}
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => handleTypeChange('expense')}
            style={[
              styles.segmentButton,
              type === 'expense' ? styles.segmentButtonActive : null,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'expense' ? styles.segmentTextActiveExpense : null,
              ]}
            >
              ↗ Keluar
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTypeChange('income')}
            style={[
              styles.segmentButton,
              type === 'income' ? styles.segmentButtonActive : null,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'income' ? styles.segmentTextActiveIncome : null,
              ]}
            >
              ↙ Masuk
            </Text>
          </Pressable>
        </View>

        {/* Nominal Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Nominal</Text>
          <View style={styles.moneyInputWrap}>
            <Text style={styles.moneyPrefix}>Rp</Text>
            <TextInput
              style={styles.moneyInput}
              value={amountStr}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              inputMode="numeric"
              accessibilityLabel="Nominal dalam rupiah"
              autoFocus={!isEditing}
            />
          </View>
        </View>

        {/* Category Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Kategori</Text>
          <Pressable
            style={styles.selectorButton}
            onPress={() => setPickerModalVisible(true)}
            accessibilityRole="button"
          >
            {selectedCategory ? (
              <View style={styles.selectedCatWrap}>
                <View
                  style={[
                    styles.catDotSmall,
                    { backgroundColor: selectedCategory.color || COLORS.primary },
                  ]}
                />
                <Text style={styles.selectedCatText}>{selectedCategory.name}</Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Pilih kategori</Text>
            )}
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Date Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Tanggal</Text>
          <Pressable
            style={styles.selectorButton}
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
          >
            <View style={styles.dateDisplayRow}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.muted} />
              <Text style={styles.selectorText}>{formatDate(dateStr)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Date Picker Component */}
        {showDatePicker ? (
          Platform.OS === 'ios' ? (
            <View style={styles.iosDatePickerContainer}>
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="spinner"
                onChange={onDateChange}
              />
              <Pressable
                style={styles.doneDateBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.doneDateBtnText}>Selesai</Text>
              </Pressable>
            </View>
          ) : (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )
        ) : null}

        {/* Note Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Catatan (opsional)</Text>
          <TextInput
            style={styles.textInput}
            value={note}
            onChangeText={setNote}
            placeholder="Contoh: Kopi sore, Gaji bulanan"
            placeholderTextColor="#9ca3af"
            maxLength={MAX_NOTE_LENGTH}
          />
          <Text style={styles.charCounter}>
            {note.length}/{MAX_NOTE_LENGTH}
          </Text>
        </View>

        {/* Error Text */}
        {errorText ? <Text style={styles.errorBanner}>{errorText}</Text> : null}

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, submitting ? styles.btnDisabled : null]}
          onPress={handleSave}
          disabled={submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Perbarui transaksi' : 'Simpan transaksi'}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={pickerModalVisible}
        type={type}
        selectedId={selectedCategory?.id}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          if (errorText) setErrorText(null);
        }}
        onClose={() => setPickerModalVisible(false)}
        onManageCategories={() => router.push('/categories')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f4fa',
    padding: 4,
    borderRadius: 12,
    borderCurve: 'continuous',
    gap: 6,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderCurve: 'continuous',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.white,
    boxShadow: '0 2px 7px rgba(220, 227, 239, 0.9)',
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#91a0b5',
  },
  segmentTextActiveExpense: {
    color: COLORS.primary,
  },
  segmentTextActiveIncome: {
    color: COLORS.green,
  },
  field: {
    marginBottom: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
  },
  moneyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#dbe4f2',
    paddingBottom: 8,
    gap: 8,
  },
  moneyPrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: '#7b8da9',
  },
  moneyInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.5,
    padding: 0,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafd',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectorPlaceholder: {
    fontSize: 14,
    color: COLORS.muted,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
  },
  selectedCatWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catDotSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  selectedCatText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
  },
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iosDatePickerContainer: {
    backgroundColor: '#f8fafd',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 10,
    marginTop: -10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  doneDateBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    borderCurve: 'continuous',
    marginTop: 6,
  },
  doneDateBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafd',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.ink,
  },
  charCounter: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  errorBanner: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(36, 81, 191, 0.3)',
    elevation: 3,
    marginTop: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
