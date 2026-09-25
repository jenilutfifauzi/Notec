import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../db/schema';
import { getActiveCategories, insertCategory } from '../db/queries/categories';
import { COLORS, CATEGORY_PALETTE, MAX_CATEGORY_NAME_LENGTH } from '../lib/constants';

interface CategoryPickerModalProps {
  visible: boolean;
  type: 'income' | 'expense';
  selectedId?: number | null;
  onSelect: (category: Category) => void;
  onClose: () => void;
  onManageCategories?: () => void;
}

export function CategoryPickerModal({
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
        <View style={[styles.colorDot, { backgroundColor: item.color || COLORS.primary }]}>
          <Text style={styles.colorDotText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.categoryName, isSelected ? styles.selectedCategoryName : null]}>
          {item.name}
        </Text>
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={styles.chevron} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color="#b5c1d3" style={styles.chevron} />
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="formSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isCreating ? 'Kategori Baru' : 'Pilih Kategori'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Tutup">
            <Ionicons name="close" size={22} color={COLORS.ink} />
          </Pressable>
        </View>

        {isCreating ? (
          /* Create Mode */
          <View style={styles.createContainer}>
            <Text style={styles.label}>Nama kategori</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Kopi, Langganan"
              placeholderTextColor={COLORS.muted}
              value={newCatName}
              onChangeText={(text) => {
                setNewCatName(text);
                if (errorMessage) setErrorMessage(null);
              }}
              maxLength={MAX_CATEGORY_NAME_LENGTH}
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
                    style={[
                      styles.paletteDot,
                      { backgroundColor: color },
                      isChosen ? styles.paletteDotChosen : null,
                    ]}
                  >
                    {isChosen ? (
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <View style={styles.actionButtons}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setIsCreating(false);
                  setErrorMessage(null);
                }}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </Pressable>

              <Pressable
                style={[styles.saveBtn, submitting ? styles.btnDisabled : null]}
                onPress={handleCreateCategory}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Kategori</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          /* List Mode */
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
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

            <Pressable
              style={styles.newCatBtn}
              onPress={() => {
                setIsCreating(true);
                setErrorMessage(null);
              }}
            >
              <Ionicons name="add" size={18} color={COLORS.primary} />
              <Text style={styles.newCatBtnText}>Buat kategori baru</Text>
            </Pressable>

            {onManageCategories ? (
              <Pressable
                style={styles.manageBtn}
                onPress={() => {
                  onClose();
                  onManageCategories();
                }}
              >
                <Text style={styles.manageBtnText}>Kelola semua kategori ›</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
  },
  closeBtn: {
    padding: 6,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  list: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  selectedRow: {
    backgroundColor: COLORS.pale,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    marginLeft: 12,
    flex: 1,
  },
  selectedCategoryName: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 'auto',
  },
  newCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#b5c9ef',
    backgroundColor: '#f8faff',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    marginTop: 12,
    gap: 6,
  },
  newCatBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  manageBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  createContainer: {
    padding: 20,
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.ink,
    backgroundColor: '#fbfcfd',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  paletteDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteDotChosen: {
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d2def4',
    borderRadius: 11,
    borderCurve: 'continuous',
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  cancelBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 11,
    borderCurve: 'continuous',
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
