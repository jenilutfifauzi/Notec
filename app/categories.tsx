import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { LegendList } from '@legendapp/list/react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../db/client';
import { categories, Category } from '../db/schema';
import {
  getActiveCategories,
  getArchivedCategories,
  insertCategory,
  updateCategory,
  archiveCategory,
  unarchiveCategory,
} from '../db/queries/categories';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  COLORS,
  CATEGORY_PALETTE,
  MAX_CATEGORY_NAME_LENGTH,
} from '../lib/constants';

interface CategoryRowProps {
  id: number;
  name: string;
  color: string;
  onPress: (id: number) => void;
}

const CategoryRow = memo(function CategoryRow({
  id,
  name,
  color,
  onPress,
}: CategoryRowProps) {
  return (
    <Pressable
      style={styles.categoryRow}
      onPress={() => onPress(id)}
      accessibilityRole="button"
    >
      <View style={[styles.catDot, { backgroundColor: color || COLORS.primary }]}>
        <Text style={styles.catDotText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.categoryName} numberOfLines={1}>
        {name}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#b5c1d3" style={styles.chevron} />
    </Pressable>
  );
});

export default function CategoriesScreen() {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [activeList, setActiveList] = useState<Category[]>([]);
  const [archivedList, setArchivedList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Modal state (add or edit)
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState<string>(CATEGORY_PALETTE[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Archive confirmation dialog
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // React to DB changes
  const { data: liveCategories } = useLiveQuery(
    db.select({ id: categories.id, updatedAt: categories.updated_at }).from(categories)
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [active, archived] = await Promise.all([
        getActiveCategories(type),
        getArchivedCategories(type),
      ]);
      setActiveList(active);
      setArchivedList(archived);
    } catch (e) {
      console.error('Error loading categories:', e);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadData();
  }, [loadData, liveCategories]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormColor(CATEGORY_PALETTE[activeList.length % CATEGORY_PALETTE.length]);
    setFormError(null);
    setModalVisible(true);
  };

  // Open modal for edit
  const handleOpenEdit = (id: number) => {
    const cat = activeList.find((c) => c.id === id);
    if (!cat) return;
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormColor(cat.color || CATEGORY_PALETTE[0]);
    setFormError(null);
    setModalVisible(true);
  };

  // Save (add or edit)
  const handleSaveForm = async () => {
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError('Isi nama kategori');
      return;
    }
    if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
      setFormError(`Maksimal ${MAX_CATEGORY_NAME_LENGTH} karakter`);
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: trimmed,
          color: formColor,
        });
      } else {
        await insertCategory(trimmed, type, formColor);
      }

      setModalVisible(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kategori';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Archive category
  const handleArchive = async () => {
    if (!editingCategory) return;
    try {
      await archiveCategory(editingCategory.id);
      setShowArchiveConfirm(false);
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal mengarsipkan');
    }
  };

  // Unarchive category
  const handleUnarchive = async (cat: Category) => {
    try {
      await unarchiveCategory(cat.id);
    } catch (err) {
      Alert.alert(
        'Tidak dapat mengaktifkan',
        err instanceof Error ? err.message : 'Kategori dengan nama ini sudah aktif'
      );
    }
  };

  const renderActiveItem = useCallback(
    ({ item }: { item: Category }) => (
      <CategoryRow
        id={item.id}
        name={item.name}
        color={item.color || COLORS.primary}
        onPress={handleOpenEdit}
      />
    ),
    [activeList]
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Kembali"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Kategori</Text>
          <Pressable
            onPress={handleOpenAdd}
            style={styles.headerAddBtn}
            accessibilityLabel="Tambah Kategori"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={26} color={COLORS.white} />
          </Pressable>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Toggle */}
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setType('expense')}
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
            onPress={() => setType('income')}
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

        {/* Section Title */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Kategori saya</Text>
          <Text style={styles.sectionSubtitle}>{activeList.length} kategori</Text>
        </View>

        {/* Active Categories Card */}
        <View style={styles.card}>
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : activeList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Belum ada kategori aktif.</Text>
            </View>
          ) : (
            activeList.map((item) => (
              <CategoryRow
                key={item.id}
                id={item.id}
                name={item.name}
                color={item.color || COLORS.primary}
                onPress={handleOpenEdit}
              />
            ))
          )}
        </View>

        {/* Add Category Button */}
        <Pressable style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={18} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Tambah kategori</Text>
        </Pressable>

        {/* Tip Text Card */}
        <View style={styles.tipCard}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={COLORS.primary}
            style={styles.tipIcon}
          />
          <Text style={styles.tipText}>
            Kategori yang sudah dipakai bisa diarsipkan. Catatan transaksi lama tetap tersimpan
            dan terhubung.
          </Text>
        </View>

        {/* Archived Section */}
        {archivedList.length > 0 ? (
          <View style={styles.archivedSection}>
            <Pressable
              style={styles.archivedHeaderRow}
              onPress={() => setShowArchived(!showArchived)}
            >
              <Text style={styles.archivedTitle}>
                Diarsipkan ({archivedList.length})
              </Text>
              <Ionicons
                name={showArchived ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.muted}
              />
            </Pressable>

            {showArchived ? (
              <View style={styles.card}>
                {archivedList.map((item) => (
                  <View key={item.id} style={styles.archivedRow}>
                    <View
                      style={[
                        styles.catDotSmall,
                        { backgroundColor: item.color || COLORS.muted },
                      ]}
                    />
                    <Text style={styles.archivedName}>{item.name}</Text>
                    <Pressable
                      style={styles.restoreBtn}
                      onPress={() => handleUnarchive(item)}
                    >
                      <Text style={styles.restoreBtnText}>Aktifkan kembali</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Add / Edit Category Modal */}
      <Modal
        visible={modalVisible}
        presentationStyle="formSheet"
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Ubah Kategori' : 'Kategori Baru'}
            </Text>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeModalBtn}
            >
              <Ionicons name="close" size={22} color={COLORS.ink} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalLabel}>Nama kategori</Text>
            <TextInput
              style={styles.modalInput}
              value={formName}
              onChangeText={(text) => {
                setFormName(text);
                if (formError) setFormError(null);
              }}
              placeholder="Contoh: Belanja, Kopi"
              placeholderTextColor={COLORS.muted}
              maxLength={MAX_CATEGORY_NAME_LENGTH}
              autoFocus
            />

            <Text style={styles.modalLabel}>Warna</Text>
            <View style={styles.paletteRow}>
              {CATEGORY_PALETTE.map((color) => {
                const isSelected = formColor === color;
                return (
                  <Pressable
                    key={color}
                    onPress={() => setFormColor(color)}
                    style={[
                      styles.paletteDot,
                      { backgroundColor: color },
                      isSelected ? styles.paletteDotSelected : null,
                    ]}
                  >
                    {isSelected ? (
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.saveFormBtn, submitting ? styles.btnDisabled : null]}
                onPress={handleSaveForm}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveFormBtnText}>Simpan</Text>
                )}
              </Pressable>

              {editingCategory ? (
                <Pressable
                  style={styles.archiveActionBtn}
                  onPress={() => setShowArchiveConfirm(true)}
                >
                  <Ionicons name="archive-outline" size={16} color={COLORS.red} />
                  <Text style={styles.archiveActionBtnText}>Arsipkan kategori</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        visible={showArchiveConfirm}
        title="Arsipkan kategori ini?"
        message="Kategori tidak akan muncul lagi di pilihan transaksi baru. Catatan transaksi yang sudah ada tetap tersimpan."
        confirmText="Arsipkan"
        cancelText="Batal"
        destructive
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
  headerAddBtn: {
    padding: 6,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f4fa',
    padding: 4,
    borderRadius: 12,
    borderCurve: 'continuous',
    gap: 6,
    marginBottom: 20,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    boxShadow: '0 4px 14px rgba(31, 63, 119, 0.04)',
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  catDot: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catDotText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  categoryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginLeft: 12,
  },
  chevron: {
    marginLeft: 'auto',
  },
  addBtn: {
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
    marginTop: 14,
    gap: 6,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#f4f7fe',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  tipIcon: {
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: '#8291aa',
    lineHeight: 16,
  },
  archivedSection: {
    marginTop: 22,
  },
  archivedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 6,
  },
  archivedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
  },
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  catDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  archivedName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  restoreBtn: {
    backgroundColor: COLORS.pale,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  restoreBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  centerLoading: {
    padding: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
  },
  closeModalBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    marginVertical: 12,
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
  paletteDotSelected: {
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  modalActions: {
    marginTop: 28,
    gap: 14,
  },
  saveFormBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveFormBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  archiveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  archiveActionBtnText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
