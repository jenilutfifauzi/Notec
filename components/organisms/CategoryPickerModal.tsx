import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/db/schema';
import { getActiveCategories, insertCategory } from '@/db/queries/categories';
import { CATEGORY_PALETTE, MAX_CATEGORY_NAME_LENGTH } from '@/lib/constants';
import { colors, radii, spacing, typography } from '@/lib/tokens';
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

export default function CategoryPickerModal({
  visible,
  type,
  selectedId,
  onSelect,
  onClose,
  onManageCategories,
}: CategoryPickerModalProps) {
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
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (visible) {
      setIsCreating(false);
      setNewCatName('');
      setErrorMessage(null);
      fetchCategories();
    }
  }, [visible, fetchCategories]);

  const handleCreateCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setErrorMessage('Isi nama kategori');
      return;
    }
    if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
      setErrorMessage(`Maksimal ${MAX_CATEGORY_NAME_LENGTH} karakter`);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const newCategory = await insertCategory(trimmed, type, selectedColor);
      onSelect(newCategory);
      setIsCreating(false);
      setNewCatName('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat kategori';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = item.id === selectedId;
    return (
      <Pressable
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        style={[styles.categoryRow, isSelected ? styles.selectedRow : null]}
        accessibilityRole="button"
      >
        <CategoryDot color={item.color || colors.primary} label={item.name} size="md" />
        <Text style={[styles.categoryName, isSelected ? styles.selectedCategoryName : null]}>
          {item.name}
        </Text>
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.chevron} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.chevron} style={styles.chevron} />
        )}
      </Pressable>
    );
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={isCreating ? 'Kategori Baru' : 'Pilih Kategori'}
    >
      {isCreating ? (
        /* Create Mode */
        <View style={styles.createContainer}>
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

          <Text style={styles.label}>Pilih warna</Text>
          <View style={styles.paletteRow}>
            {CATEGORY_PALETTE.map((color) => {
              const isChosen = selectedColor === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={styles.paletteTouch}
                >
                  <CategoryDot
                    color={color}
                    size="lg"
                    selected={isChosen}
                    style={isChosen ? styles.paletteDotChosen : undefined}
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
        </View>
      ) : (
        /* List Mode */
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.centerLoading}>
              <Text style={styles.emptyText}>Belum ada kategori aktif.</Text>
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
            icon={<Ionicons name="add" size={18} color={colors.primary} />}
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
        </View>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  createContainer: {
    paddingTop: spacing['2'],
    paddingBottom: spacing['6'],
  },
  label: {
    ...typography.captionBold,
    color: colors.ink,
    marginTop: spacing['6'],
    marginBottom: spacing['3'],
  },
  paletteRow: {
    flexDirection: 'row',
    gap: spacing['3'],
    flexWrap: 'wrap',
    marginBottom: spacing['6'],
  },
  paletteTouch: {
    padding: 2,
  },
  paletteDotChosen: {
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing['4'],
    marginTop: spacing['6'],
  },
  flexBtn: {
    flex: 1,
  },
  listContainer: {
    paddingTop: spacing['2'],
  },
  list: {
    maxHeight: 280,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['5'],
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  selectedRow: {
    backgroundColor: colors.surfaceInput,
  },
  categoryName: {
    ...typography.bodyBold,
    color: colors.ink,
    marginLeft: spacing['6'],
    flex: 1,
  },
  selectedCategoryName: {
    color: colors.primary,
  },
  chevron: {
    marginLeft: 'auto',
  },
  newCatBtn: {
    marginTop: spacing['6'],
  },
  manageBtn: {
    marginTop: spacing['4'],
  },
  centerLoading: {
    padding: spacing['12'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.muted,
  },
});
