import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Icon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CancelCircleIcon } from '@/lib/icons';
import { monthYearFormatter } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { radii, typography, fontFamilies } from '@/lib/tokens';

export interface MonthPickerProps {
  year: number;
  month: number; // 1 to 12
  onChange: (year: number, month: number) => void;
  variant?: 'hero' | 'light';
  onPressTitle?: () => void;
  customLabel?: string;
  hasCustomFilter?: boolean;
  onClearCustomFilter?: () => void;
}

export default function MonthPicker({
  year,
  month,
  onChange,
  variant = 'hero',
  onPressTitle,
  customLabel,
  hasCustomFilter,
  onClearCustomFilter,
}: MonthPickerProps) {
  const { colors } = useTheme();
  const isHero = variant === 'hero';

  const date = new Date(year, month - 1, 1);
  const formatted = monthYearFormatter.format(date);
  const displayText = (customLabel || formatted).replace(/\s*⌄$/, '');
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
      {!isHero ? (
        <Pressable
          onPress={handlePrev}
          style={styles.arrowButton}
          hitSlop={8}
          accessibilityLabel="Bulan sebelumnya"
          accessibilityRole="button"
        >
          <Icon
            icon={ChevronLeftIcon}
            size={18}
            color={colors.iconMuted}
          />
        </Pressable>
      ) : null}

      {onPressTitle ? (
        <Pressable
          onPress={onPressTitle}
          style={[
            styles.titleButton,
            hasCustomFilter ? [styles.titleButtonActive, { backgroundColor: colors.primaryPale }] : null,
          ]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Ubah periode tanggal"
        >
          <Text
            style={[
              styles.monthText,
              isHero ? styles.heroText : [styles.lightText, { color: colors.ink }],
              hasCustomFilter ? { color: colors.primary } : null,
            ]}
          >
            {displayText}
          </Text>
          {!isHero ? (
            <Icon
              icon={ChevronDownIcon}
              size={13}
              color={hasCustomFilter ? colors.primary : colors.iconMuted}
            />
          ) : null}
        </Pressable>
      ) : (
        <View style={isHero ? styles.heroContentRow : null}>
          <Text
            style={[
              styles.monthText,
              isHero ? styles.heroText : [styles.lightText, { color: colors.ink }],
            ]}
          >
            {displayText}
          </Text>
          {isHero ? (
            <Icon icon={ChevronDownIcon} size={12} color="#063b1b" strokeWidth={1.75} />
          ) : null}
        </View>
      )}

      {hasCustomFilter && onClearCustomFilter ? (
        <Pressable
          onPress={onClearCustomFilter}
          style={styles.clearBtn}
          hitSlop={8}
          accessibilityLabel="Hapus filter tanggal"
          accessibilityRole="button"
        >
          <Icon icon={CancelCircleIcon} size={16} color={colors.muted} />
        </Pressable>
      ) : null}

      {!isHero ? (
        <Pressable
          onPress={handleNext}
          style={styles.arrowButton}
          hitSlop={8}
          accessibilityLabel="Bulan berikutnya"
          accessibilityRole="button"
        >
          <Icon
            icon={ChevronRightIcon}
            size={18}
            color={colors.iconMuted}
          />
        </Pressable>
      ) : null}
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
    backgroundColor: '#e7f2b0',
    borderWidth: 1,
    borderColor: '#063b1b55',
    borderRadius: 10,
    borderCurve: 'continuous',
    height: 34,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lightContainer: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 12,
  },
  arrowButton: {
    padding: 6,
    borderRadius: radii.sm,
  },
  titleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii['2xl'],
  },
  titleButtonActive: {},
  customFilterText: {},
  clearBtn: {
    padding: 4,
  },
  monthText: {
    ...typography.captionBold,
    textTransform: 'capitalize',
  },
  heroText: {
    color: '#063b1b',
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    letterSpacing: 0,
  },
  lightText: {
    ...typography.titleSmall,
  },
});
