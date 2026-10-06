import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  Icon,
  SaleTag01Icon,
  ChevronRightIcon,
  CloudUploadIcon,
  CloudDownloadIcon,
  Delete01Icon,
  SecurityCheckIcon,
  AlertCircleIcon,
} from '@/lib/icons';
import * as FileSystem from 'expo-file-system/legacy';
import { File as ExpoFile } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  generateBackupPayload,
  validateBackupPayload,
  restoreFromPayload,
  deleteAllData,
  BackupData,
} from '../db/queries/backup';
import { encryptBackup, decryptBackup } from '../lib/crypto';
import ConfirmDialog from '@/components/organisms/ConfirmDialog';
import { useTheme } from '@/lib/theme';
import {
  radii,
  spacing,
  typography,
  ScreenHeader,
  SectionHeader,
  Card,
  BottomSheetModal,
  TextInput,
  Button,
  Toast,
} from '@/components/ui';
export default function SettingsScreen() {
  const { colors } = useTheme();
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Restore state
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<BackupData | null>(null);
  const [pendingRestoreJson, setPendingRestoreJson] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Delete all state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Handle Backup Export
  const handleStartBackup = () => {
    setBackupPassword('');
    setConfirmPassword('');
    setBackupError(null);
    setBackupModalVisible(true);
  };

  const handleExecuteBackup = async () => {
    const pwd = backupPassword.trim();
    if (!pwd) {
      setBackupError('Kata sandi tidak boleh kosong');
      return;
    }
    if (pwd.length < 4) {
      setBackupError('Kata sandi minimal 4 karakter');
      return;
    }
    if (pwd !== confirmPassword.trim()) {
      setBackupError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    try {
      setIsBackingUp(true);
      setBackupError(null);

      // Generate payload and encrypt
      const payload = await generateBackupPayload();
      const encryptedBase64 = await encryptBackup(payload, pwd);

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
      const filename = `catatan-keuangan-backup-${timestamp}.ckbackup`;

      // Save to document directory
      const docDir = FileSystem.documentDirectory;
      if (!docDir) {
        throw new Error('Direktori penyimpanan tidak tersedia');
      }
      const fileUri = docDir + filename;

      await FileSystem.writeAsStringAsync(fileUri, encryptedBase64, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share/Save dialog
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Simpan Berkas Cadangan',
          UTI: 'public.data',
        });
        showToast('Berkas cadangan berhasil dibuat');
      } else {
        Alert.alert(
          'Cadangan Tersimpan',
          `Berkas tersimpan di: ${filename}. Berbagi tidak didukung pada perangkat ini.`
        );
      }

      setBackupModalVisible(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat cadangan';
      setBackupError(msg);
    } finally {
      setIsBackingUp(false);
    }
  };

  // 2. Handle Restore Import
  const handleStartRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      if (!file.name.endsWith('.ckbackup')) {
        Alert.alert(
          'Format Tidak Sesuai',
          'Harap pilih berkas cadangan dengan ekstensi .ckbackup'
        );
        return;
      }

      // Read file content
      const expoFile = new ExpoFile(file.uri);
      const content = await expoFile.text();

      setRestoreFileContent(content);
      setRestorePassword('');
      setRestoreError(null);
      setRestoreModalVisible(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membaca berkas cadangan';
      Alert.alert('Gagal Membaca Berkas', msg);
    }
  };

  const handleExecuteDecrypt = async () => {
    if (!restoreFileContent) return;
    const pwd = restorePassword.trim();
    if (!pwd) {
      setRestoreError('Masukkan kata sandi cadangan');
      return;
    }

    try {
      setIsDecrypting(true);
      setRestoreError(null);

      const decryptedPayload = await decryptBackup(restoreFileContent, pwd);
      const parsedData = validateBackupPayload(decryptedPayload);

      setPendingRestoreData(parsedData);
      setPendingRestoreJson(decryptedPayload);
      setRestoreModalVisible(false);
      setShowRestoreConfirm(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kata sandi salah atau berkas rusak';
      if (
        msg.includes('Bad MAC') ||
        msg.includes('Unsupported state') ||
        msg.includes('decryption failed') ||
        msg.includes('Gagal mendekripsi')
      ) {
        setRestoreError('Kata sandi salah atau berkas rusak');
      } else {
        setRestoreError(msg);
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreJson) return;
    try {
      await restoreFromPayload(pendingRestoreJson);
      setShowRestoreConfirm(false);
      setPendingRestoreData(null);
      setPendingRestoreJson(null);
      showToast('Data berhasil dipulihkan dari cadangan');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memulihkan data';
      Alert.alert('Pemulihan Gagal', msg);
    }
  };

  // 3. Handle Delete All Data
  const handleExecuteDeleteAll = async () => {
    try {
      setIsDeleting(true);
      setShowDeleteConfirm(false);
      await deleteAllData();
      showToast('Semua data berhasil dihapus');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus data';
      Alert.alert('Gagal', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScreenHeader
        title="Pengaturan"
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Kategori */}
        <SectionHeader title="KATEGORI" variant="overline" style={styles.sectionHeaderWrap} />
        <Card style={styles.menuCard}>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.menuRow,
              styles.menuRowLast,
              { borderBottomColor: colors.line },
              pressed && styles.menuRowPressed,
            ]}
            onPress={() => router.push('/categories')}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#fef3c7' }]}>
              <Icon icon={SaleTag01Icon} size={20} color="#d97706" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, { color: colors.ink }]}>Kelola kategori</Text>
              <Text style={[styles.menuSubtitle, { color: colors.muted }]}>Tambah, ubah, atau arsipkan kategori</Text>
            </View>
            <Icon icon={ChevronRightIcon} size={18} color={colors.chevron} />
          </Pressable>
        </Card>

        {/* Section: Data */}
        <SectionHeader title="DATA & CADANGAN" variant="overline" style={styles.sectionHeaderWrap} />
        <Card style={styles.menuCard}>
          {/* Cadangkan Data */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.menuRow,
              { borderBottomColor: colors.line },
              pressed && styles.menuRowPressed,
            ]}
            onPress={handleStartBackup}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.primaryPale }]}>
              <Icon icon={CloudUploadIcon} size={20} color={colors.primary} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, { color: colors.ink }]}>Cadangkan data</Text>
              <Text style={[styles.menuSubtitle, { color: colors.muted }]}>Ekspor data terenkripsi sandi (.ckbackup)</Text>
            </View>
            <Icon icon={ChevronRightIcon} size={18} color={colors.chevron} />
          </Pressable>

          {/* Pulihkan Cadangan */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.menuRow,
              { borderBottomColor: colors.line },
              pressed && styles.menuRowPressed,
            ]}
            onPress={handleStartRestore}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.transactionIconBg }]}>
              <Icon icon={CloudDownloadIcon} size={20} color={colors.transactionIconColor} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, { color: colors.ink }]}>Pulihkan cadangan</Text>
              <Text style={[styles.menuSubtitle, { color: colors.muted }]}>Buka dan pulihkan berkas .ckbackup</Text>
            </View>
            <Icon icon={ChevronRightIcon} size={18} color={colors.chevron} />
          </Pressable>

          {/* Hapus Semua Data */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.menuRow,
              styles.menuRowLast,
              pressed && styles.menuRowPressed,
            ]}
            onPress={() => setShowDeleteConfirm(true)}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#fee2e2' }]}>
              <Icon icon={Delete01Icon} size={20} color={colors.red} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, styles.destructiveText, { color: colors.red }]}>Hapus semua data</Text>
              <Text style={[styles.menuSubtitle, { color: colors.muted }]}>Hapus semua transaksi dan atur ulang kategori</Text>
            </View>
            <Icon icon={ChevronRightIcon} size={18} color={colors.chevron} />
          </Pressable>
        </Card>
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Icon
            icon={SecurityCheckIcon}
            size={22}
            color={colors.primary}
            style={styles.infoIcon}
          />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.ink }]}>Penyimpanan Lokal & Terenkripsi</Text>
            <Text style={[styles.infoBody, { color: colors.subtle }]}>
              Seluruh catatan keuangan Anda tersimpan offline di perangkat ini. Berkas cadangan
              diamankan dengan enkripsi standar AES-GCM 256-bit dan PBKDF2.
            </Text>
            <Text style={[styles.infoBody, { color: colors.subtle, marginTop: 6 }]}>
              Menghapus aplikasi dapat menghilangkan data. Buat cadangan secara berkala sebelum
              berpindah perangkat.
            </Text>
          </View>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: colors.muted }]}>Catatan Keuangan v1.0.0</Text>
          <Text style={[styles.appInfoSub, { color: colors.sectionHeader }]}>Aplikasi Pelacak Keuangan Pribadi Offline</Text>
        </View>
      </ScrollView>
      {/* Backup Password Modal */}
      <BottomSheetModal
        visible={backupModalVisible}
        onClose={() => !isBackingUp && setBackupModalVisible(false)}
        title="Cadangkan Data"
        subtitle="Tentukan kata sandi untuk melindungi berkas cadangan Anda. Sandi ini akan dibutuhkan untuk membuka cadangan di kemudian hari."
      >
        <TextInput
          label="Kata Sandi"
          value={backupPassword}
          onChangeText={(t) => {
            setBackupPassword(t);
            if (backupError) setBackupError(null);
          }}
          placeholder="Minimal 4 karakter"
          secureTextEntry
          autoFocus
        />

        <TextInput
          label="Konfirmasi Kata Sandi"
          value={confirmPassword}
          onChangeText={(t) => {
            setConfirmPassword(t);
            if (backupError) setBackupError(null);
          }}
          placeholder="Ulangi kata sandi"
          secureTextEntry
          containerStyle={{ marginTop: spacing['4'] }}
        />

        <View style={[styles.warningBox, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
          <Icon icon={AlertCircleIcon} size={18} color={colors.warningIcon} />
          <Text style={[styles.warningText, { color: colors.warningText }]}>
            Sandi ini tidak dapat dipulihkan jika lupa. Simpan atau ingat sandi dengan baik.
          </Text>
        </View>

        {backupError ? <Text style={styles.errorText}>{backupError}</Text> : null}

        <View style={styles.modalActions}>
          <Button
            title="Buat & Simpan Cadangan"
            onPress={handleExecuteBackup}
            variant="primary"
            fullWidth
            loading={isBackingUp}
          />
        </View>
      </BottomSheetModal>

      {/* Restore Password Modal */}
      <BottomSheetModal
        visible={restoreModalVisible}
        onClose={() => !isDecrypting && setRestoreModalVisible(false)}
        title="Buka Cadangan"
        subtitle="Masukkan kata sandi yang digunakan saat membuat berkas cadangan ini."
      >
        <TextInput
          label="Kata Sandi"
          value={restorePassword}
          onChangeText={(t) => {
            setRestorePassword(t);
            if (restoreError) setRestoreError(null);
          }}
          placeholder="Masukkan kata sandi"
          secureTextEntry
          autoFocus
        />

        {restoreError ? <Text style={styles.errorText}>{restoreError}</Text> : null}

        <View style={styles.modalActions}>
          <Button
            title="Buka Cadangan"
            onPress={handleExecuteDecrypt}
            variant="primary"
            fullWidth
            loading={isDecrypting}
          />
        </View>
      </BottomSheetModal>

      {/* Confirmation Dialog for Restore */}
      <ConfirmDialog
        visible={showRestoreConfirm}
        title="Ganti semua data?"
        message={`Data yang ada di aplikasi akan diganti dengan cadangan ini:\n\n• ${pendingRestoreData?.transactions.length || 0} transaksi\n• ${pendingRestoreData?.categories.length || 0} kategori\n\nLanjutkan pemulihan?`}
        confirmText="Pulihkan Sekarang"
        cancelText="Batal"
        destructive
        onConfirm={handleConfirmRestore}
        onCancel={() => {
          setShowRestoreConfirm(false);
          setPendingRestoreData(null);
        }}
      />

      {/* Confirmation Dialog for Delete All */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Hapus semua data?"
        message="Semua transaksi dan kategori buatan Anda akan dihapus permanen. Cadangan file di luar aplikasi tidak terpengaruh."
        confirmText="Hapus Permanen"
        cancelText="Batal"
        destructive
        onConfirm={handleExecuteDeleteAll}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Success Toast */}
      <Toast
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing['8'],
    paddingBottom: spacing['24'],
  },
  sectionHeaderWrap: {
    marginTop: spacing['2'],
    marginBottom: spacing['3'],
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing['10'],
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing['8'],
    borderBottomWidth: 1,
  },
  menuRowPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitle: {
    ...typography.bodyBold,
  },
  destructiveText: {},
  menuSubtitle: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 18,
    gap: 14,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...typography.label,
    marginBottom: 4,
  },
  infoBody: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 16,
  },
  appInfo: {
    marginTop: 36,
    alignItems: 'center',
  },
  appInfoText: {
    ...typography.captionBold,
  },
  appInfoSub: {
    ...typography.overline,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'none',
  },
  warningBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    padding: spacing['6'],
    gap: spacing['4'],
    alignItems: 'center',
    marginTop: spacing['6'],
  },
  warningText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  errorText: {
    ...typography.captionBold,
    marginTop: spacing['4'],
  },
  modalActions: {
    marginTop: spacing['8'],
  },
});
