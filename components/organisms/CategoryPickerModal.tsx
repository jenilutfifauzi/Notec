import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInRight,
  FadeInLeft,
  FadeOutLeft,
  FadeOutRight,
  ReduceMotion,
} from 'react-native-reanimated';
import { LegendList } from '@legendapp/list/react-native';
import { Icon, CheckmarkCircle01Icon, ChevronRightIcon, Add01Icon } from '@/lib/icons';
import { Category } from '@/db/schema';
import { getActiveCategories, insertCategory } from '@/db/queries/categories';
import { CATEGORY_PALETTE, MAX_CATEGORY_NAME_LENGTH } from '@/lib/constants';
import { useTheme, type ThemeColors } from '@/lib/theme';
import { radii, spacing, typography } from '@/lib/tokens';
import { motionTokens } from '@/lib/motion';
import CategoryDot from '@/components/atoms/CategoryDot';
import Button from '@/components/atoms/Button';
import TextInput from '@/components/molecules/TextInput';
import BottomSheetModal from './BottomSheetModal';

export interface CategoryPickerModalProps {
  visible: boolean;
  type: 'income' | 'expense';
  selectedId?: number | null;
  onSelect: (category: Category) => void;
  onClose: () => void;
  onManageCategories?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CategoryItemRow({
  item,
  isSelected,
  onPress,
  colors,
}: {
  item: Category;
  isSelected: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.98, {
          duration: 100,
          easing: motionTokens.easing.smoothOut,
          reduceMotion: ReduceMotion.System,
        });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: 200,
          easing: motionTokens.easing.smoothOut,
          reduceMotion: ReduceMotion.System,
        });
      }}
      style={[
        styles.categoryRow,
        { borderBottomColor: colors.line },
        isSelected ? [styles.selectedRow, { backgroundColor: colors.surfaceInput }] : null,
        animatedStyle,
      ]}
      accessibilityRole="button"
    >
      <CategoryDot color={item.color || colors.primary} label={item.name} size="md" />
      <Text
        style={[
          styles.categoryName,
          { color: isSelected ? colors.primary : colors.ink },
        ]}
      >
        {item.name}
      </Text>
      {isSelected ? (
        <Icon icon={CheckmarkCircle01Icon} size={20} color={colors.primary} style={styles.chevron} />
      ) : (
        <Icon icon={ChevronRightIcon} size={18} color={colors.chevron} style={styles.chevron} />
      )}
    </AnimatedPressable>
  );
}

export default function CategoryPickerModal({
  visible,
  type,
  selectedId,
  onSelect,
  onClose,
  onManageCategories,
}: CategoryPickerModalProps) {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(CATEGORY_PALETTE[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActiveCategories(type);
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (visible) {
      fetchCategories();
      setIsCreating(false);
      setNewCatName('');
      setErrorMessage(null);
    }
  }, [visible, fetchCategories]);

  const handleCreateCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setErrorMessage('Nama kategori tidak boleh kosong');
      return;
    }
    if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
      setErrorMessage(`Maksimal ${MAX_CATEGORY_NAME_LENGTH} karakter`);
      return;
    }

    try {
      setSubmitting(true);
      const newCat = await insertCategory(trimmed, type, selectedColor);

      onSelect(newCat);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Gagal membuat kategori';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    return (
      <CategoryItemRow
        item={item}
        isSelected={item.id === selectedId}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        colors={colors}
      />
    );
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={isCreating ? 'Kategori Baru' : 'Pilih Kategori'}
      scrollable={false}
    >
      {isCreating ? (
        /* transitions.dev 08-page-side-by-side: Create Mode */
        <Animated.View
          key="create"
          entering={FadeInRight.duration(motionTokens.duration.fast)}
          exiting={FadeOutLeft.duration(motionTokens.duration.quick)}
          style={styles.createContainer}
        >
          <TextInput
            label="Nama kategori"
            placeholder="Contoh: Kopi, Langganan"
            value={newCatName}
            onChangeText={(text) => {
              setNewCatName(text);
              if (errorMessage) setErrorMessage(null);
            }}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            error={errorMessage || undefined}
            autoFocus
          />

          <Text style={[styles.label, { color: colors.ink }]}>Pilih warna</Text>
          <View style={styles.paletteRow}>
            {CATEGORY_PALETTE.map((color) => {
              const isChosen = selectedColor === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={({ pressed }) => [
                    styles.paletteTouch,
                    pressed && styles.paletteTouchPressed,
                  ]}
                >
                  <CategoryDot
                    color={color}
                    size="lg"
                    selected={isChosen}
                    style={isChosen ? [styles.paletteDotChosen, { borderColor: colors.ink }] : undefined}
                  />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionButtons}>
            <Button
              title="Batal"
              onPress={() => {
                setIsCreating(false);
                setErrorMessage(null);
              }}
              variant="outline"
              disabled={submitting}
              style={styles.flexBtn}
            />

            <Button
              title="Simpan Kategori"
              onPress={handleCreateCategory}
              variant="primary"
              loading={submitting}
              style={styles.flexBtn}
            />
          </View>
        </Animated.View>
      ) : (
        /* transitions.dev 08-page-side-by-side: List Mode */
        <Animated.View
          key="list"
          entering={FadeInLeft.duration(motionTokens.duration.fast)}
          exiting={FadeOutRight.duration(motionTokens.duration.quick)}
          style={styles.listContainer}
        >
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.centerLoading}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Belum ada kategori aktif.</Text>
            </View>
          ) : (
            <LegendList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item: Category) => String(item.id)}
              estimatedItemSize={52}
              style={styles.list}
            />
          )}

          <Button
            title="Buat kategori baru"
            onPress={() => {
              setIsCreating(true);
              setErrorMessage(null);
            }}
            variant="dashed"
            icon={<Icon icon={Add01Icon} size={18} color={colors.primary} />}
            style={styles.newCatBtn}
          />

          {onManageCategories ? (
            <Button
              title="Kelola semua kategori ›"
              onPress={() => {
                onClose();
                onManageCategories();
              }}
              variant="ghost"
              size="sm"
              style={styles.manageBtn}
            />
          ) : null}
        </Animated.View>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: spacing['4'],
  },
  createContainer: {
    paddingBottom: spacing['4'],
  },
  centerLoading: {
    paddingVertical: spacing['10'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    fontSize: 14,
  },
  list: {
    maxHeight: 280,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['2'],
    borderBottomWidth: 1,
    borderRadius: radii.md,
  },
  selectedRow: {
    borderRadius: radii.md,
  },
  categoryName: {
    ...typography.body,
    fontSize: 14,
    marginLeft: spacing['4'],
    flex: 1,
  },
  chevron: {
    marginLeft: spacing['2'],
  },
  newCatBtn: {
    marginTop: spacing['6'],
  },
  manageBtn: {
    marginTop: spacing['3'],
  },
  label: {
    ...typography.captionBold,
    marginTop: spacing['4'],
    marginBottom: spacing['3'],
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['4'],
    marginBottom: spacing['8'],
  },
  paletteTouch: {
    padding: 2,
    borderRadius: radii.full,
  },
  paletteTouchPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  paletteDotChosen: {
    borderWidth: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  flexBtn: {
    flex: 1,
  },
});
