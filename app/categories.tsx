import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import {
  Icon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Add01Icon,
  InformationCircleIcon,
  Archive01Icon,
} from '@/lib/icons';
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
import ConfirmDialog from '@/components/organisms/ConfirmDialog';
import {
  CATEGORY_PALETTE,
  MAX_CATEGORY_NAME_LENGTH,
} from '../lib/constants';
import { useTheme } from '@/lib/theme';
import {
  radii,
  spacing,
  typography,
  ScreenHeader,
  SegmentedControl,
  SectionHeader,
  CategoryDot,
  Button,
  BottomSheetModal,
  TextInput,
  Card,
} from '@/components/ui';

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
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.categoryRow, { borderBottomColor: colors.line }]}
      onPress={() => onPress(id)}
      accessibilityRole="button"
      accessibilityLabel={`Kategori ${name}`}
    >
      <CategoryDot color={color || colors.primary} label={name} size="md" />
      <Text style={[styles.categoryName, { color: colors.ink }]} numberOfLines={1}>
        {name}
      </Text>
      <Icon icon={ChevronRightIcon} size={18} color={colors.chevron} />
    </Pressable>
  );
});

export default function CategoriesScreen() {
  const { colors } = useTheme();
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
      console.error('Failed to load categories:', e);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadData();
  }, [loadData, liveCategories]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormColor(CATEGORY_PALETTE[0]);
    setFormError(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (id: number) => {
    const cat = activeList.find((c) => c.id === id);
    if (!cat) return;
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormColor(cat.color || CATEGORY_PALETTE[0]);
    setFormError(null);
    setModalVisible(true);
  };

  const handleSaveForm = async () => {
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError('Nama kategori wajib diisi');
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
      loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('sudah digunakan')) {
        setFormError(msg);
      } else {
        setFormError('Gagal menyimpan kategori');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!editingCategory) return;
    try {
      await archiveCategory(editingCategory.id);
      setShowArchiveConfirm(false);
      setModalVisible(false);
      loadData();
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat mengarsipkan kategori ini');
    }
  };

  const handleUnarchive = async (cat: Category) => {
    try {
      await unarchiveCategory(cat.id);
      loadData();
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat mengaktifkan kembali kategori ini');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <ScreenHeader
        title="Kategori"
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={handleOpenAdd}
            hitSlop={8}
            accessibilityLabel="Tambah Kategori"
            accessibilityRole="button"
          >
            <Icon icon={Add01Icon} size={26} color="#063b1b" />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Toggle */}
        <SegmentedControl
          segments={[
            { value: 'expense', label: '↗ Keluar' },
            { value: 'income', label: '↙ Masuk' },
          ]}
          selected={type}
          onChange={setType}
          colorMap={{ expense: colors.ink, income: colors.ink }}
          style={styles.segmented}
        />

        {/* Section Title */}
        <SectionHeader
          title="Kategori saya"
          rightAction={{ label: `${activeList.length} kategori`, onPress: () => {} }}
          variant="subtitle"
        />

        {/* Active Categories Card */}
        <Card style={styles.listCard}>
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : activeList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Belum ada kategori aktif.</Text>
            </View>
          ) : (
            activeList.map((item, index) => (
              <View key={item.id}>
                <CategoryRow
                  id={item.id}
                  name={item.name}
                  color={item.color || colors.primary}
                  onPress={handleOpenEdit}
                />
              </View>
            ))
          )}
        </Card>

        {/* Add Category Button */}
        <Button
          title="Tambah kategori"
          onPress={handleOpenAdd}
          variant="dashed"
          icon={<Icon icon={Add01Icon} size={18} color={colors.primary} />}
          style={styles.addBtn}
        />

        {/* Tip Text Card */}
        <Card style={[styles.tipCard, { backgroundColor: colors.surfaceTip }]}>
          <Icon
            icon={InformationCircleIcon}
            size={18}
            color={colors.primary}
            style={styles.tipIcon}
          />
          <Text style={[styles.tipText, { color: colors.sectionHeader }]}>
            Kategori yang sudah dipakai bisa diarsipkan. Catatan transaksi lama tetap tersimpan
            dan terhubung.
          </Text>
        </Card>
        {/* Archived Section */}
        {archivedList.length > 0 ? (
          <View style={styles.archivedSection}>
            <Pressable
              style={styles.archivedHeaderRow}
              onPress={() => setShowArchived(!showArchived)}
            >
              <Text style={[styles.archivedTitle, { color: colors.muted }]}>
                Diarsipkan ({archivedList.length})
              </Text>
              <Icon
                icon={showArchived ? ChevronUpIcon : ChevronDownIcon}
                size={18}
                color={colors.muted}
              />
            </Pressable>

            {showArchived ? (
              <Card style={styles.listCard}>
                {archivedList.map((item) => (
                  <View key={item.id} style={[styles.archivedRow, { borderBottomColor: colors.line }]}>
                    <CategoryDot
                      color={item.color || colors.muted}
                      size="sm"
                    />
                    <Text style={[styles.archivedName, { color: colors.muted }]}>{item.name}</Text>
                    <Pressable
                      style={[styles.restoreBtn, { backgroundColor: colors.primaryPale }]}
                      onPress={() => handleUnarchive(item)}
                    >
                      <Text style={[styles.restoreBtnText, { color: colors.primary }]}>Aktifkan kembali</Text>
                    </Pressable>
                  </View>
                ))}
              </Card>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Add / Edit Category Modal */}
      <BottomSheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingCategory ? 'Ubah Kategori' : 'Kategori Baru'}
      >
        <TextInput
          label="Nama kategori"
          value={formName}
          onChangeText={(text) => {
            setFormName(text);
            if (formError) setFormError(null);
          }}
          placeholder="Contoh: Belanja, Kopi"
          maxLength={MAX_CATEGORY_NAME_LENGTH}
          charCount={{ current: formName.length, max: MAX_CATEGORY_NAME_LENGTH }}
          error={formError || undefined}
          autoFocus
        />

        <Text style={[styles.paletteLabel, { color: colors.ink }]}>Warna</Text>
        <View style={styles.paletteRow}>
          {CATEGORY_PALETTE.map((color) => {
            const isSelected = formColor === color;
            return (
              <Pressable
                key={color}
                onPress={() => setFormColor(color)}
                style={styles.paletteItem}
              >
                <CategoryDot
                  color={color}
                  size="lg"
                  selected={isSelected}
                  style={isSelected ? [styles.paletteDotSelected, { borderColor: colors.ink }] : undefined}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.modalActions}>
          <Button
            title="Simpan"
            onPress={handleSaveForm}
            variant="primary"
            fullWidth
            loading={submitting}
          />

          {editingCategory ? (
            <Button
              title="Arsipkan kategori"
              onPress={() => setShowArchiveConfirm(true)}
              variant="ghost"
              fullWidth
              textStyle={[styles.archiveActionText, { color: colors.red }]}
              icon={<Icon icon={Archive01Icon} size={16} color={colors.red} />}
            />
          ) : null}
        </View>
      </BottomSheetModal>

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
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing['8'],
    paddingBottom: spacing['24'],
  },
  segmented: {
    marginBottom: spacing['10'],
  },
  listCard: {
    paddingHorizontal: spacing['7'],
    paddingVertical: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['6'],
    borderBottomWidth: 1,
  },
  categoryName: {
    flex: 1,
    ...typography.bodyBold,
    marginLeft: spacing['6'],
  },
  addBtn: {
    marginTop: spacing['7'],
  },
  tipCard: {
    flexDirection: 'row',
    padding: spacing['7'],
    marginTop: spacing['8'],
    gap: spacing['5'],
  },
  tipIcon: {
    marginTop: 1,
  },
  tipText: {
    ...typography.caption,
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  archivedSection: {
    marginTop: spacing['11'],
  },
  archivedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing['4'],
    marginBottom: spacing['3'],
  },
  archivedTitle: {
    ...typography.captionBold,
  },
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['6'],
    borderBottomWidth: 1,
    gap: spacing['5'],
  },
  archivedName: {
    flex: 1,
    ...typography.bodySemibold,
  },
  restoreBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing['5'],
    borderRadius: radii['4xl'],
    borderCurve: 'continuous',
  },
  restoreBtnText: {
    ...typography.overline,
    textTransform: 'none',
  },
  centerLoading: {
    padding: spacing['12'],
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing['12'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
  },
  paletteLabel: {
    ...typography.captionBold,
    marginTop: spacing['6'],
    marginBottom: spacing['4'],
  },
  paletteRow: {
    flexDirection: 'row',
    gap: spacing['5'],
    flexWrap: 'wrap',
    marginBottom: spacing['6'],
  },
  paletteItem: {
    padding: 2,
  },
  paletteDotSelected: {
    borderWidth: 2.5,
  },
  modalActions: {
    marginTop: spacing['8'],
    gap: spacing['6'],
  },
  archiveActionText: {
  },
});
