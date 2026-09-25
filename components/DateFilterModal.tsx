import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../lib/constants';
import { formatDateShort } from '../lib/format';

export type DatePresetKey = 'today' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';

export interface DateFilterSelection {
  year: number;
  month: number;
  dateFrom: string | null;
  dateTo: string | null;
  presetKey?: DatePresetKey;
}

export interface DateFilterModalProps {
  visible: boolean;
  onClose: () => void;
  year: number;
  month: number;
  dateFrom: string | null;
  dateTo: string | null;
  presetKey?: DatePresetKey;
  onApply: (selection: DateFilterSelection) => void;
  onReset: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr',
  'Mei', 'Jun', 'Jul', 'Agu',
  'Sep', 'Okt', 'Nov', 'Des',
];

const PRESETS: Array<{ key: DatePresetKey; label: string }> = [
  { key: 'today', label: 'Hari Ini' },
  { key: '7days', label: '7 Hari Terakhir' },
  { key: '30days', label: '30 Hari Terakhir' },
  { key: 'thisMonth', label: 'Bulan Ini' },
  { key: 'lastMonth', label: 'Bulan Lalu' },
];

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateString(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function DateFilterModal({
  visible,
  onClose,
  year,
  month,
  dateFrom,
  dateTo,
  presetKey,
  onApply,
  onReset,
}: DateFilterModalProps) {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Local draft state
  const [draftYear, setDraftYear] = useState<number>(year);
  const [draftMonth, setDraftMonth] = useState<number>(month);
  const [draftFrom, setDraftFrom] = useState<string | null>(dateFrom);
  const [draftTo, setDraftTo] = useState<string | null>(dateTo);
  const [draftPreset, setDraftPreset] = useState<DatePresetKey | undefined>(presetKey);

  // Picker modal / sheet for iOS and Android
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);

  // Synchronize state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setDraftYear(year);
      setDraftMonth(month);
      setDraftFrom(dateFrom);
      setDraftTo(dateTo);
      setDraftPreset(presetKey);
      setPickerTarget(null);
    }
  }, [visible, year, month, dateFrom, dateTo, presetKey]);

  // Handle Preset selection
  const handleSelectPreset = useCallback((key: DatePresetKey) => {
    setDraftPreset(key);
    const today = new Date();
    const todayStr = toDateString(today);

    switch (key) {
      case 'today':
        setDraftFrom(todayStr);
        setDraftTo(todayStr);
        setDraftYear(today.getFullYear());
        setDraftMonth(today.getMonth() + 1);
        break;

      case '7days': {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        setDraftFrom(toDateString(start));
        setDraftTo(todayStr);
        setDraftYear(today.getFullYear());
        setDraftMonth(today.getMonth() + 1);
        break;
      }

      case '30days': {
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        setDraftFrom(toDateString(start));
        setDraftTo(todayStr);
        setDraftYear(today.getFullYear());
        setDraftMonth(today.getMonth() + 1);
        break;
      }

      case 'thisMonth':
        setDraftFrom(null);
        setDraftTo(null);
        setDraftYear(currentYear);
        setDraftMonth(currentMonth);
        break;

      case 'lastMonth': {
        setDraftFrom(null);
        setDraftTo(null);
        if (currentMonth === 1) {
          setDraftYear(currentYear - 1);
          setDraftMonth(12);
        } else {
          setDraftYear(currentYear);
          setDraftMonth(currentMonth - 1);
        }
        break;
      }
    }
  }, [currentYear, currentMonth]);

  // Handle Month Grid selection
  const handleSelectMonth = useCallback((mIndex: number) => {
    const selectedM = mIndex + 1;
    setDraftMonth(selectedM);
    setDraftFrom(null);
    setDraftTo(null);

    if (draftYear === currentYear && selectedM === currentMonth) {
      setDraftPreset('thisMonth');
    } else {
      setDraftPreset(undefined);
    }
  }, [draftYear, currentYear, currentMonth]);

  // Handle Year Change
  const handlePrevYear = () => {
    setDraftYear((prev) => prev - 1);
    setDraftPreset(undefined);
  };

  const handleNextYear = () => {
    setDraftYear((prev) => prev + 1);
    setDraftPreset(undefined);
  };

  // DateTimePicker change handler
  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPickerTarget(null);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }

    const dateStr = toDateString(selected);
    setDraftPreset('custom');

    if (pickerTarget === 'from') {
      setDraftFrom(dateStr);
      // Auto-adjust 'to' date if 'to' is earlier than 'from'
      if (draftTo && draftTo < dateStr) {
        setDraftTo(dateStr);
      }
      if (Platform.OS === 'android') {
        // Automatically prompt for End Date on Android for seamless 2-step flow
        setTimeout(() => setPickerTarget('to'), 150);
      }
    } else if (pickerTarget === 'to') {
      setDraftTo(dateStr);
      // Auto-adjust 'from' date if 'from' is later than 'to'
      if (draftFrom && draftFrom > dateStr) {
        setDraftFrom(dateStr);
      }
    }
  };

  // Apply Action
  const handleApply = () => {
    onApply({
      year: draftYear,
      month: draftMonth,
      dateFrom: draftFrom,
      dateTo: draftTo,
      presetKey: draftPreset,
    });
    onClose();
  };

  // Reset Action
  const handleReset = () => {
    onReset();
    onClose();
  };

  const activePickerDate = useMemo(() => {
    if (pickerTarget === 'from') {
      return draftFrom ? parseDateString(draftFrom) : new Date();
    }
    if (pickerTarget === 'to') {
      return draftTo ? parseDateString(draftTo) : draftFrom ? parseDateString(draftFrom) : new Date();
    }
    return new Date();
  }, [pickerTarget, draftFrom, draftTo]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        
        <View style={styles.sheetContainer}>
          {/* Top Drag Indicator */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Pilih Periode Riwayat</Text>
              <Text style={styles.subtitle}>Filter transaksi berdasarkan tanggal atau bulan</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Tutup"
            >
              <Ionicons name="close" size={20} color={COLORS.muted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* SECTION 1: Quick Presets */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PILIHAN CEPAT</Text>
              <View style={styles.presetsRow}>
                {PRESETS.map((p) => {
                  const isSelected = draftPreset === p.key;
                  return (
                    <Pressable
                      key={p.key}
                      style={[styles.presetChip, isSelected ? styles.presetChipActive : null]}
                      onPress={() => handleSelectPreset(p.key)}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isSelected ? styles.presetChipTextActive : null,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* SECTION 2: Month & Year Selector */}
            <View style={styles.section}>
              <View style={styles.monthHeaderRow}>
                <Text style={styles.sectionLabel}>PILIH BULAN</Text>
                
                {/* Year Navigation */}
                <View style={styles.yearPickerWrap}>
                  <Pressable
                    onPress={handlePrevYear}
                    style={styles.yearArrowBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Tahun sebelumnya"
                  >
                    <Ionicons name="chevron-back" size={16} color={COLORS.ink} />
                  </Pressable>
                  <Text style={styles.yearText}>{draftYear}</Text>
                  <Pressable
                    onPress={handleNextYear}
                    style={styles.yearArrowBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Tahun berikutnya"
                  >
                    <Ionicons name="chevron-forward" size={16} color={COLORS.ink} />
                  </Pressable>
                </View>
              </View>

              {/* 12-Month Grid (4 columns x 3 rows) */}
              <View style={styles.monthGrid}>
                {MONTH_NAMES.map((name, idx) => {
                  const selected = draftFrom === null && draftTo === null && draftMonth === idx + 1;
                  const isCurrent = draftYear === currentYear && idx + 1 === currentMonth;

                  return (
                    <Pressable
                      key={name}
                      style={[
                        styles.monthCell,
                        selected ? styles.monthCellActive : null,
                        !selected && isCurrent ? styles.monthCellCurrent : null,
                      ]}
                      onPress={() => handleSelectMonth(idx)}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.monthCellText,
                          selected ? styles.monthCellTextActive : null,
                          !selected && isCurrent ? styles.monthCellTextCurrent : null,
                        ]}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* SECTION 3: Custom Date Range */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ATAU RENTANG TANGGAL KUSTOM</Text>
              
              <View style={styles.customRangeRow}>
                {/* From Date Box */}
                <Pressable
                  style={[
                    styles.dateBox,
                    draftPreset === 'custom' && draftFrom ? styles.dateBoxActive : null,
                  ]}
                  onPress={() => setPickerTarget('from')}
                  accessibilityRole="button"
                >
                  <Text style={styles.dateBoxLabel}>Dari Tanggal</Text>
                  <View style={styles.dateBoxValueRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={draftFrom ? COLORS.primary : COLORS.muted}
                    />
                    <Text
                      style={[
                        styles.dateBoxValue,
                        draftFrom ? styles.dateBoxValueActive : null,
                      ]}
                    >
                      {draftFrom ? formatDateShort(draftFrom) : 'Pilih...'}
                    </Text>
                  </View>
                </Pressable>

                <Ionicons name="arrow-forward" size={16} color={COLORS.muted} />

                {/* To Date Box */}
                <Pressable
                  style={[
                    styles.dateBox,
                    draftPreset === 'custom' && draftTo ? styles.dateBoxActive : null,
                  ]}
                  onPress={() => setPickerTarget('to')}
                  accessibilityRole="button"
                >
                  <Text style={styles.dateBoxLabel}>Sampai Tanggal</Text>
                  <View style={styles.dateBoxValueRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={draftTo ? COLORS.primary : COLORS.muted}
                    />
                    <Text
                      style={[
                        styles.dateBoxValue,
                        draftTo ? styles.dateBoxValueActive : null,
                      ]}
                    >
                      {draftTo ? formatDateShort(draftTo) : 'Pilih...'}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* iOS Inline DateTimePicker Container */}
              {Platform.OS === 'ios' && pickerTarget ? (
                <View style={styles.iosPickerCard}>
                  <View style={styles.iosPickerHeader}>
                    <Text style={styles.iosPickerTitle}>
                      {pickerTarget === 'from' ? 'Pilih Dari Tanggal' : 'Pilih Sampai Tanggal'}
                    </Text>
                    <Pressable
                      onPress={() => setPickerTarget(null)}
                      style={styles.iosPickerDoneBtn}
                      hitSlop={8}
                    >
                      <Text style={styles.iosPickerDoneText}>Selesai</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={activePickerDate}
                    mode="date"
                    display="spinner"
                    onChange={handlePickerChange}
                    maximumDate={pickerTarget === 'from' && draftTo ? parseDateString(draftTo) : undefined}
                    minimumDate={pickerTarget === 'to' && draftFrom ? parseDateString(draftFrom) : undefined}
                  />
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Android DateTimePicker */}
          {Platform.OS === 'android' && pickerTarget ? (
            <DateTimePicker
              value={activePickerDate}
              mode="date"
              display="default"
              onChange={handlePickerChange}
              maximumDate={pickerTarget === 'from' && draftTo ? parseDateString(draftTo) : undefined}
              minimumDate={pickerTarget === 'to' && draftFrom ? parseDateString(draftFrom) : undefined}
            />
          ) : null}

          {/* Footer Action Buttons */}
          <View style={styles.footer}>
            <Pressable
              style={styles.resetBtn}
              onPress={handleReset}
              accessibilityRole="button"
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </Pressable>

            <Pressable
              style={styles.applyBtn}
              onPress={handleApply}
              accessibilityRole="button"
            >
              <Text style={styles.applyBtnText}>Terapkan Filter</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d7dfec',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f1f4fa',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.muted,
    letterSpacing: 0.6,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  presetChipActive: {
    backgroundColor: COLORS.pale,
    borderColor: COLORS.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  presetChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearPickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f4fa',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 6,
  },
  yearArrowBtn: {
    padding: 4,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    minWidth: 42,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: '#fafbfd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  monthCellCurrent: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  monthCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  monthCellTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  monthCellTextCurrent: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  customRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#f8fafd',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.pale,
  },
  dateBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateBoxValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBoxValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    fontVariant: ['tabular-nums'],
  },
  dateBoxValueActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  iosPickerCard: {
    marginTop: 10,
    backgroundColor: '#f4f7fc',
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  iosPickerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  iosPickerDoneBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  iosPickerDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  resetBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.muted,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 13,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(36, 81, 191, 0.25)',
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
