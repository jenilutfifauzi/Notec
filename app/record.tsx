import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput as RNTextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Category } from '../db/schema';
import {
  insertTransaction,
  updateTransaction,
  getTransactionById,
} from '../db/queries/transactions';
import CategoryPickerModal from '@/components/organisms/CategoryPickerModal';
import { MAX_AMOUNT, MAX_NOTE_LENGTH } from '../lib/constants';
import {
  rupiahFormatter,
  formatDate,
  getTodayDateString,
} from '../lib/format';
import {
  colors,
  radii,
  spacing,
  typography,
  fontFamilies,
  ScreenHeader,
  SegmentedControl,
  SelectField,
  TextInput,
  Button,
  CategoryDot,
} from '@/components/ui';

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={isEditing ? 'Perbarui transaksi' : 'Catat transaksi'}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Income / Expense Segmented Control */}
        <SegmentedControl
          segments={[
            { value: 'expense', label: '↗ Keluar' },
            { value: 'income', label: '↙ Masuk' },
          ]}
          selected={type}
          onChange={handleTypeChange}
          colorMap={{ expense: colors.primary, income: colors.green }}
          style={styles.segmented}
        />

        {/* Nominal Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Nominal</Text>
          <View style={styles.moneyInputWrap}>
            <Text style={styles.moneyPrefix}>Rp</Text>
            <RNTextInput
              style={styles.moneyInput}
              value={amountStr}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              inputMode="numeric"
              accessibilityLabel="Nominal dalam rupiah"
              autoFocus={!isEditing}
            />
          </View>
        </View>

        {/* Category Field */}
        <View style={styles.field}>
          <SelectField
            label="Kategori"
            value={selectedCategory?.name}
            placeholder="Pilih kategori"
            onPress={() => setPickerModalVisible(true)}
            leftIcon={
              selectedCategory ? (
                <CategoryDot
                  color={selectedCategory.color || colors.primary}
                  size="sm"
                />
              ) : null
            }
          />
        </View>

        {/* Date Field */}
        <View style={styles.field}>
          <SelectField
            label="Tanggal"
            value={formatDate(dateStr)}
            onPress={() => setShowDatePicker(true)}
            leftIcon={
              <Ionicons name="calendar-outline" size={18} color={colors.muted} />
            }
          />
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
              <Button
                title="Selesai"
                onPress={() => setShowDatePicker(false)}
                size="sm"
                style={styles.doneDateBtn}
              />
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
          <TextInput
            label="Catatan (opsional)"
            value={note}
            onChangeText={setNote}
            placeholder="Contoh: Kopi sore, Gaji bulanan"
            maxLength={MAX_NOTE_LENGTH}
            charCount={{ current: note.length, max: MAX_NOTE_LENGTH }}
          />
        </View>

        {/* Error Text Banner */}
        {errorText ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorText}</Text>
          </View>
        ) : null}

        {/* Save Button */}
        <Button
          title={isEditing ? 'Perbarui transaksi' : 'Simpan transaksi'}
          onPress={handleSave}
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          style={styles.saveBtn}
        />
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
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing['8'],
    paddingBottom: spacing['20'],
  },
  segmented: {
    marginBottom: spacing['12'],
  },
  field: {
    marginBottom: spacing['8'],
  },
  label: {
    ...typography.captionBold,
    color: colors.ink,
    marginBottom: spacing['3'],
  },
  moneyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    paddingBottom: spacing['4'],
    gap: spacing['4'],
  },
  moneyPrefix: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
    color: colors.muted,
  },
  moneyInput: {
    ...typography.displayLarge,
    flex: 1,
    color: colors.ink,
    letterSpacing: -0.5,
    padding: 0,
  },
  iosDatePickerContainer: {
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    padding: spacing['5'],
    marginTop: -spacing['4'],
    marginBottom: spacing['8'],
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  doneDateBtn: {
    marginTop: spacing['3'],
  },
  errorBanner: {
    marginBottom: spacing['8'],
    backgroundColor: colors.errorBg,
    padding: spacing['5'],
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorBannerText: {
    ...typography.caption,
    color: colors.red,
  },
  saveBtn: {
    marginTop: spacing['4'],
  },
});
