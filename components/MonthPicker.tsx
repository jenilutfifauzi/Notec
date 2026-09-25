import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../lib/constants';
import { monthYearFormatter } from '../lib/format';

interface MonthPickerProps {
  year: number;
  month: number; // 1 to 12
  onChange: (year: number, month: number) => void;
  variant?: 'hero' | 'light';
  onPressTitle?: () => void;
  customLabel?: string;
  hasCustomFilter?: boolean;
  onClearCustomFilter?: () => void;
}
export function MonthPicker({
  year,
  month,
  onChange,
  variant = 'hero',
  onPressTitle,
  customLabel,
  hasCustomFilter,
  onClearCustomFilter,
}: MonthPickerProps) {
  const isHero = variant === 'hero';

  const date = new Date(year, month - 1, 1);
  const formatted = monthYearFormatter.format(date);

  const handlePrev = () => {
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  return (
    <View style={[styles.container, isHero ? styles.heroContainer : styles.lightContainer]}>
      <Pressable
        onPress={handlePrev}
        style={styles.arrowButton}
        hitSlop={8}
        accessibilityLabel="Bulan sebelumnya"
        accessibilityRole="button"
      >
        <Ionicons
          name="chevron-back"
          size={18}
          color={isHero ? COLORS.white : '#758cb6'}
        />
      </Pressable>

      {onPressTitle ? (
        <Pressable
          onPress={onPressTitle}
          style={[
            styles.titleButton,
            hasCustomFilter ? styles.titleButtonActive : null,
          ]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Ubah periode tanggal"
        >
          <Text
            style={[
              styles.monthText,
              isHero ? styles.heroText : styles.lightText,
              hasCustomFilter ? styles.customFilterText : null,
            ]}
          >
            {customLabel || formatted}
          </Text>
          <Ionicons
            name="chevron-down"
            size={13}
            color={hasCustomFilter ? COLORS.primary : isHero ? COLORS.white : '#758cb6'}
          />
        </Pressable>
      ) : (
        <Text style={[styles.monthText, isHero ? styles.heroText : styles.lightText]}>
          {customLabel || formatted}
        </Text>
      )}

      {hasCustomFilter && onClearCustomFilter ? (
        <Pressable
          onPress={onClearCustomFilter}
          style={styles.clearBtn}
          hitSlop={8}
          accessibilityLabel="Hapus filter tanggal"
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={16} color={COLORS.muted} />
        </Pressable>
      ) : null}

      <Pressable
        onPress={handleNext}
        style={styles.arrowButton}
        hitSlop={8}
        accessibilityLabel="Bulan berikutnya"
        accessibilityRole="button"
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isHero ? COLORS.white : '#758cb6'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#bdd0ff',
    borderRadius: 24,
    borderCurve: 'continuous',
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 8,
  },
  lightContainer: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 12,
  },
  arrowButton: {
    padding: 6,
    borderRadius: 8,
  },
  titleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  titleButtonActive: {
    backgroundColor: COLORS.pale,
  },
  customFilterText: {
    color: COLORS.primary,
  },
  clearBtn: {
    padding: 4,
  },
  monthText: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  heroText: {
    color: COLORS.white,
    fontSize: 12,
  },
  lightText: {
    color: COLORS.ink,
    fontSize: 14,
  },
});
