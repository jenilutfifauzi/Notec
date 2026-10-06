import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import {
  Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Calendar01Icon,
  ArrowRight02Icon,
} from '@/lib/icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { formatDateShort } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { radii, spacing, fontFamilies } from '@/lib/tokens';
import SegmentedControl from '@/components/molecules/SegmentedControl';
import Chip from '@/components/atoms/Chip';
import Button from '@/components/atoms/Button';
import BottomSheetModal from './BottomSheetModal';

export type DatePresetKey = 'today' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';
export type FilterMode = 'month' | 'range';

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

const FILTER_SEGMENTS = [
  { value: 'month' as const, label: 'Pilih Bulan' },
  { value: 'range' as const, label: 'Rentang Tanggal' },
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

export default function DateFilterModal({
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
  const { colors } = useTheme();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [filterMode, setFilterMode] = useState<FilterMode>(
    dateFrom || presetKey ? 'range' : 'month'
  );
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
      setFilterMode(dateFrom || presetKey ? 'range' : 'month');
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
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDraftFrom(toDateString(first));
        setDraftTo(toDateString(last));
        setDraftYear(today.getFullYear());
        setDraftMonth(today.getMonth() + 1);
        break;
      }

      case 'lastMonth': {
        const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const last = new Date(today.getFullYear(), today.getMonth(), 0);
        setDraftFrom(toDateString(first));
        setDraftTo(toDateString(last));
        setDraftYear(first.getFullYear());
        setDraftMonth(first.getMonth() + 1);
        break;
      }

      default:
        break;
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
  };

  const handleNextYear = () => {
    setDraftYear((y) => y + 1);
  };

  const handlePickerValueChange = (
    _event: DateTimePickerChangeEvent,
    selectedDate: Date
  ) => {
    if (Platform.OS === 'android') {
      setPickerTarget(null);
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

  const handlePickerDismiss = () => {
    if (Platform.OS === 'android') {
      setPickerTarget(null);
    }
  };

  const handleApply = () => {
    if (filterMode === 'month') {
      onApply({
        year: draftYear,
        month: draftMonth,
        dateFrom: null,
        dateTo: null,
        presetKey: undefined,
      });
    } else {
      onApply({
        year: draftYear,
        month: draftMonth,
        dateFrom: draftFrom,
        dateTo: draftTo,
        presetKey: draftPreset,
      });
    }
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const previewText = useMemo(() => {
    if (filterMode === 'month') {
      return `${MONTH_NAMES[draftMonth - 1]} ${draftYear}`;
    }
    if (draftPreset && draftPreset !== 'custom') {
      const p = PRESETS.find((item) => item.key === draftPreset);
      if (p) return p.label;
    }
    if (draftFrom && draftTo) {
      if (draftFrom === draftTo) return formatDateShort(draftFrom);
      return `${formatDateShort(draftFrom)} – ${formatDateShort(draftTo)}`;
    }
    if (draftFrom) return `Mulai ${formatDateShort(draftFrom)}`;
    if (draftTo) return `Sampai ${formatDateShort(draftTo)}`;
    return 'Belum dipilih';
  }, [filterMode, draftMonth, draftYear, draftPreset, draftFrom, draftTo]);

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
      title="Pilih Periode"
      subtitle="Pilih bulan atau atur rentang tanggal kustom"
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
      {/* Mode Switcher Tabs */}
      <SegmentedControl
        segments={FILTER_SEGMENTS}
        selected={filterMode}
        onChange={(mode) => {
          setFilterMode(mode);
          setPickerTarget(null);
        }}
        style={styles.segmentedControl}
      />

      {filterMode === 'month' ? (
        /* TAB 1: PILIH BULAN */
        <View style={styles.tabContent}>
          {/* Centered Year Selector Bar */}
          <View
            style={[
              styles.yearNavRow,
              { backgroundColor: colors.surfaceInput, borderColor: colors.line },
            ]}
          >
            <Pressable
              onPress={handlePrevYear}
              style={styles.yearArrowBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Tahun sebelumnya"
            >
              <Icon icon={ChevronLeftIcon} size={18} color={colors.ink} />
            </Pressable>

            <View style={styles.yearCenter}>
              <Text style={[styles.yearValue, { color: colors.ink }]}>{draftYear}</Text>
            </View>

            <Pressable
              onPress={handleNextYear}
              style={styles.yearArrowBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Tahun berikutnya"
            >
              <Icon icon={ChevronRightIcon} size={18} color={colors.ink} />
            </Pressable>
          </View>

          {/* 12-Month Grid (4 cols x 3 rows) */}
          <View style={styles.monthGrid}>
            {MONTH_NAMES.map((name, idx) => {
              const isSelected = draftMonth === idx + 1;
              const isCurrent = draftYear === currentYear && idx + 1 === currentMonth;

              return (
                <Pressable
                  key={name}
                  style={[
                    styles.monthCell,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceInput,
                      borderColor: isSelected
                        ? colors.primary
                        : isCurrent
                        ? colors.borderHighlight
                        : colors.line,
                    },
                  ]}
                  onPress={() => handleSelectMonth(idx)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.monthCellText,
                      {
                        color: isSelected ? '#063b1b' : colors.ink,
                        fontFamily: isSelected ? fontFamilies.bold : fontFamilies.medium,
                      },
                    ]}
                  >
                    {name}
                  </Text>
                  {isCurrent && !isSelected ? (
                    <View style={[styles.currentDot, { backgroundColor: colors.primary }]} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        /* TAB 2: RENTANG TANGGAL */
        <View style={styles.tabContent}>
          {/* Quick Presets */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>PILIHAN CEPAT</Text>
            <View style={styles.presetWrap}>
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

          {/* Custom Date Range Cards */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>RENTANG TANGGAL KUSTOM</Text>

            <View style={styles.customDateRow}>
              {/* From Date Box */}
              <Pressable
                style={[
                  styles.dateCard,
                  {
                    backgroundColor: colors.surfaceInput,
                    borderColor:
                      draftPreset === 'custom' && draftFrom ? colors.primary : colors.line,
                  },
                ]}
                onPress={() => setPickerTarget('from')}
                accessibilityRole="button"
              >
                <View style={styles.dateCardHeader}>
                  <Icon
                    icon={Calendar01Icon}
                    size={14}
                    color={draftFrom ? colors.primary : colors.muted}
                  />
                  <Text style={[styles.dateCardSub, { color: colors.muted }]}>Dari</Text>
                </View>
                <Text
                  style={[
                    styles.dateCardMain,
                    {
                      color: draftFrom ? colors.ink : colors.placeholder,
                      fontFamily: draftFrom ? fontFamilies.semiBold : fontFamilies.regular,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {draftFrom ? formatDateShort(draftFrom) : 'Pilih tanggal'}
                </Text>
              </Pressable>

              <View style={styles.dateDivider}>
                <Icon icon={ArrowRight02Icon} size={15} strokeWidth={1.6} color={colors.muted} />
              </View>

              {/* To Date Box */}
              <Pressable
                style={[
                  styles.dateCard,
                  {
                    backgroundColor: colors.surfaceInput,
                    borderColor:
                      draftPreset === 'custom' && draftTo ? colors.primary : colors.line,
                  },
                ]}
                onPress={() => setPickerTarget('to')}
                accessibilityRole="button"
              >
                <View style={styles.dateCardHeader}>
                  <Icon
                    icon={Calendar01Icon}
                    size={14}
                    color={draftTo ? colors.primary : colors.muted}
                  />
                  <Text style={[styles.dateCardSub, { color: colors.muted }]}>Sampai</Text>
                </View>
                <Text
                  style={[
                    styles.dateCardMain,
                    {
                      color: draftTo ? colors.ink : colors.placeholder,
                      fontFamily: draftTo ? fontFamilies.semiBold : fontFamilies.regular,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {draftTo ? formatDateShort(draftTo) : 'Pilih tanggal'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* iOS Inline DateTimePicker Container */}
          {Platform.OS === 'ios' && pickerTarget ? (
            <View
              style={[
                styles.iosPickerCard,
                { backgroundColor: colors.surfaceInput, borderColor: colors.line },
              ]}
            >
              <View style={styles.iosPickerHeader}>
                <Text style={[styles.iosPickerTitle, { color: colors.ink }]}>
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
                onValueChange={handlePickerValueChange}
                onDismiss={handlePickerDismiss}
                maximumDate={
                  pickerTarget === 'from' && draftTo ? parseDateString(draftTo) : undefined
                }
                minimumDate={
                  pickerTarget === 'to' && draftFrom ? parseDateString(draftFrom) : undefined
                }
              />
            </View>
          ) : null}
        </View>
      )}

      {/* Active Selection Preview Badge */}
      <View
        style={[
          styles.previewBar,
          { backgroundColor: colors.surfaceControl, borderColor: colors.line },
        ]}
      >
        <Icon icon={Calendar01Icon} size={15} color={colors.primary} />
        <Text style={[styles.previewLabel, { color: colors.muted }]}>Periode dipilih:</Text>
        <Text style={[styles.previewValue, { color: colors.ink }]}>{previewText}</Text>
      </View>

      {/* Android DateTimePicker Dialog */}
      {Platform.OS === 'android' && pickerTarget ? (
        <DateTimePicker
          value={activePickerDate}
          mode="date"
          display="default"
          onValueChange={handlePickerValueChange}
          onDismiss={handlePickerDismiss}
          maximumDate={
            pickerTarget === 'from' && draftTo ? parseDateString(draftTo) : undefined
          }
          minimumDate={
            pickerTarget === 'to' && draftFrom ? parseDateString(draftFrom) : undefined
          }
        />
      ) : null}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    marginBottom: spacing['5'],
  },
  tabContent: {
    marginBottom: spacing['4'],
  },
  yearNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing['4'],
  },
  yearArrowBtn: {
    padding: 6,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    lineHeight: 22,
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
    height: 46,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  monthCellText: {
    fontSize: 14,
    lineHeight: 18,
  },
  currentDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  section: {
    gap: spacing['3'],
    marginBottom: spacing['5'],
  },
  sectionLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateCard: {
    flex: 1,
    borderRadius: radii.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  dateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateCardSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  dateCardMain: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  dateDivider: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosPickerCard: {
    marginTop: 10,
    borderRadius: radii.xl,
    borderCurve: 'continuous',
    padding: 10,
    borderWidth: 1,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  iosPickerTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: spacing['4'],
  },
  previewLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  previewValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
    paddingTop: spacing['2'],
  },
  resetBtn: {
    paddingHorizontal: spacing['5'],
  },
  applyBtn: {
    flex: 1,
  },
});
