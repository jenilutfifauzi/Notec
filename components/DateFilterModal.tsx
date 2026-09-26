import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateShort } from '../lib/format';
import {
  colors,
  radii,
  spacing,
  typography,
  BottomSheetModal,
  Chip,
  Button,
} from '@/components/ui';

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

function parseDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [draftPreset, setDraftPreset] = useState<DatePresetKey | undefined>(presetKey);
  const [draftYear, setDraftYear] = useState<number>(year);
  const [draftMonth, setDraftMonth] = useState<number>(month);
  const [draftFrom, setDraftFrom] = useState<string | null>(dateFrom);
  const [draftTo, setDraftTo] = useState<string | null>(dateTo);
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    if (visible) {
      setDraftPreset(presetKey);
      setDraftYear(year);
      setDraftMonth(month);
      setDraftFrom(dateFrom);
      setDraftTo(dateTo);
      setPickerTarget(null);
    }
  }, [visible, year, month, dateFrom, dateTo, presetKey]);

  const handleSelectPreset = (key: DatePresetKey) => {
    setDraftPreset(key);
    setPickerTarget(null);

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
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        setDraftFrom(toDateString(d));
        setDraftTo(todayStr);
        setDraftYear(today.getFullYear());
        setDraftMonth(today.getMonth() + 1);
        break;
      }

      case '30days': {
        const d = new Date(today);
        d.setDate(d.getDate() - 29);
        setDraftFrom(toDateString(d));
        setDraftTo(todayStr);
        setDraftYear(today.getFullYear());
        setDraftMonth(today.getMonth() + 1);
        break;
      }

      case 'thisMonth': {
        const y = today.getFullYear();
        const m = today.getMonth() + 1;
        setDraftYear(y);
        setDraftMonth(m);
        setDraftFrom(null);
        setDraftTo(null);
        break;
      }

      case 'lastMonth': {
        let y = today.getFullYear();
        let m = today.getMonth();
        if (m === 0) {
          m = 12;
          y -= 1;
        }
        setDraftYear(y);
        setDraftMonth(m);
        setDraftFrom(null);
        setDraftTo(null);
        break;
      }
    }
  };

  const handleSelectMonth = (monthIndex: number) => {
    setDraftMonth(monthIndex + 1);
    setDraftFrom(null);
    setDraftTo(null);
    setDraftPreset(undefined);
    setPickerTarget(null);
  };

  const handlePrevYear = () => {
    setDraftYear((y) => y - 1);
    setDraftFrom(null);
    setDraftTo(null);
    setDraftPreset(undefined);
  };

  const handleNextYear = () => {
    setDraftYear((y) => y + 1);
    setDraftFrom(null);
    setDraftTo(null);
    setDraftPreset(undefined);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setPickerTarget(null);
    }
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    const dateStr = toDateString(selectedDate);
    setDraftPreset('custom');

    if (pickerTarget === 'from') {
      setDraftFrom(dateStr);
      if (draftTo && dateStr > draftTo) {
        setDraftTo(dateStr);
      }
    } else if (pickerTarget === 'to') {
      setDraftTo(dateStr);
      if (draftFrom && dateStr < draftFrom) {
        setDraftFrom(dateStr);
      }
    }
  };

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
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Pilih Periode Riwayat"
      subtitle="Filter transaksi berdasarkan tanggal atau bulan"
      footer={
        <View style={styles.footer}>
          <Button
            title="Reset"
            onPress={handleReset}
            variant="outline"
            style={styles.resetBtn}
          />
          <Button
            title="Terapkan Filter"
            onPress={handleApply}
            variant="primary"
            style={styles.applyBtn}
          />
        </View>
      }
    >
      {/* SECTION 1: Quick Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PILIHAN CEPAT</Text>
        <View style={styles.presetsRow}>
          {PRESETS.map((p) => {
            const isSelected = draftPreset === p.key;
            return (
              <Chip
                key={p.key}
                label={p.label}
                active={isSelected}
                onPress={() => handleSelectPreset(p.key)}
              />
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
              <Ionicons name="chevron-back" size={16} color={colors.ink} />
            </Pressable>
            <Text style={styles.yearText}>{draftYear}</Text>
            <Pressable
              onPress={handleNextYear}
              style={styles.yearArrowBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Tahun berikutnya"
            >
              <Ionicons name="chevron-forward" size={16} color={colors.ink} />
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
                color={draftFrom ? colors.primary : colors.muted}
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

          <Ionicons name="arrow-forward" size={16} color={colors.muted} />

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
                color={draftTo ? colors.primary : colors.muted}
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
              <Button
                title="Selesai"
                onPress={() => setPickerTarget(null)}
                variant="ghost"
                size="sm"
              />
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
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing['3'],
    marginBottom: spacing['8'],
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.muted,
    letterSpacing: 0.6,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['3'],
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearPickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceControl,
    borderRadius: radii.lg,
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
    ...typography.label,
    color: colors.ink,
    minWidth: 42,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['2'],
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthCellCurrent: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  monthCellText: {
    ...typography.bodySemibold,
    fontSize: 13,
    color: colors.ink,
  },
  monthCellTextActive: {
    ...typography.label,
    color: colors.white,
  },
  monthCellTextCurrent: {
    ...typography.label,
    color: colors.primary,
  },
  customRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
  },
  dateBox: {
    flex: 1,
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  dateBoxLabel: {
    ...typography.overline,
    color: colors.muted,
    marginBottom: 4,
  },
  dateBoxValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBoxValue: {
    ...typography.bodySemibold,
    fontSize: 13,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  dateBoxValueActive: {
    ...typography.label,
    color: colors.ink,
  },
  iosPickerCard: {
    marginTop: 10,
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.xl,
    borderCurve: 'continuous',
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  iosPickerTitle: {
    ...typography.label,
    color: colors.ink,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['4'],
    paddingTop: spacing['3'],
  },
  resetBtn: {
    paddingHorizontal: spacing['6'],
  },
  applyBtn: {
    flex: 1,
  },
});
