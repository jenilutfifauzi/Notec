import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { ConfirmDialog } from '../components/ConfirmDialog';
import { COLORS } from '../lib/constants';

export default function SettingsScreen() {
  // Backup modal state
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

      // Write to file
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `catatan_${dateStr}.ckbackup`;

      if (Platform.OS === 'web') {
        const blob = new Blob([encryptedBase64], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
        const fileUri = `${dir}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, encryptedBase64, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Share via system picker
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/octet-stream',
            dialogTitle: 'Simpan Cadangan Catatan Keuangan',
            UTI: 'public.data',
          });
        }
      }

      setBackupModalVisible(false);
      showToast('Cadangan berhasil dibuat');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat cadangan';
      setBackupError(msg);
      Alert.alert('Gagal', msg);
    } finally {
      setIsBackingUp(false);
    }
  };

  // 2. Handle Backup Restore
  const handleStartRestore = async () => {
    try {
      let fileData: string | null = null;

      // 1. Web environment
      if (Platform.OS === 'web') {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return;
        }

        const asset = result.assets[0];
        if (asset.file) {
          fileData = await asset.file.text();
        } else if (asset.uri) {
          const res = await fetch(asset.uri);
          fileData = await res.text();
        }
      } else {
        // 2. Native (Android & iOS):
        // On Android, copyToCacheDirectory MUST be false. Setting it to true copies
        // the file into host.exp.exponent/cache/DocumentPicker/ which Expo Go's security
        // sandbox rejects with "Missing READ permission". With false, it returns the original
        // content:// URI which ExpoFile reads directly via ContentResolver.
        let pickedUri: string | null = null;

        try {
          const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: Platform.OS === 'ios',
          });

          if (result.canceled || !result.assets || result.assets.length === 0) {
            return;
          }
          pickedUri = result.assets[0].uri;
        } catch (pickerErr) {
          console.warn('DocumentPicker.getDocumentAsync failed:', pickerErr);
        }

        // Secondary native picker fallback: ExpoFile.pickFileAsync
        if (!pickedUri) {
          try {
            const pickRes = await ExpoFile.pickFileAsync();
            if (pickRes && !pickRes.canceled && pickRes.result) {
              fileData = await pickRes.result.text();
            } else {
              return;
            }
          } catch (filePickerErr) {
            console.warn('ExpoFile.pickFileAsync fallback failed:', filePickerErr);
          }
        }

        // Read the picked URI
        if (pickedUri && !fileData) {
          // Primary native: ExpoFile (properly handles content://, SAF, and file://)
          try {
            const file = new ExpoFile(pickedUri);
            fileData = await file.text();
          } catch (fileErr) {
            console.warn('ExpoFile.text() failed, trying legacy FileSystem:', fileErr);
          }

          // Fallback native: legacy FileSystem
          if (!fileData) {
            try {
              fileData = await FileSystem.readAsStringAsync(pickedUri, {
                encoding: FileSystem.EncodingType.UTF8,
              });
            } catch (legacyErr) {
              console.warn('FileSystem.readAsStringAsync failed:', legacyErr);
            }
          }
        }
      }

      if (!fileData) {
        throw new Error('Berkas kosong atau tidak dapat diakses');
      }
      setRestoreFileContent(fileData);
      setRestorePassword('');
      setRestoreError(null);
      setRestoreModalVisible(true);
    } catch (err) {
      console.error('Error saat memilih/membaca berkas cadangan:', err);
      const msg = err instanceof Error ? err.message : 'Gagal membuka berkas';
      Alert.alert('Gagal', `Tidak dapat membaca berkas cadangan: ${msg}`);
    }
  };

  const handleExecuteDecrypt = async () => {
    if (!restoreFileContent) return;
    const pwd = restorePassword.trim();
    if (!pwd) {
      setRestoreError('Masukkan kata sandi');
      return;
    }

    try {
      setIsDecrypting(true);
      setRestoreError(null);

      // Decrypt
      const decryptedJson = await decryptBackup(restoreFileContent, pwd);

      // Validate structure
      const validated = validateBackupPayload(decryptedJson);

      setPendingRestoreData(validated);
      setRestoreModalVisible(false);
      setShowRestoreConfirm(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sandi salah atau berkas rusak';
      setRestoreError(msg);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;
    try {
      setShowRestoreConfirm(false);
      const jsonStr = JSON.stringify(pendingRestoreData);
      const counts = await restoreFromPayload(jsonStr);

      showToast(`Data berhasil dipulihkan: ${counts.transactionCount} transaksi`);
      setPendingRestoreData(null);
      setRestoreFileContent(null);

      setTimeout(() => {
        router.push('/(tabs)');
      }, 500);
    } catch (err) {
      Alert.alert('Gagal memulihkan', err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  // 3. Handle Delete All Data
  const handleExecuteDeleteAll = async () => {
    try {
      setIsDeleting(true);
      setShowDeleteConfirm(false);
      await deleteAllData();
      showToast('Semua data berhasil dihapus');
      setTimeout(() => {
        router.push('/(tabs)');
      }, 500);
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Blue Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Kembali"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Pengaturan</Text>
          <View style={styles.headerPlaceholder} />
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Kategori */}
        <Text style={styles.sectionHeader}>KATEGORI</Text>
        <View style={styles.menuCard}>
          <Pressable
            style={[styles.menuRow, styles.menuRowLast]}
            onPress={() => router.push('/categories')}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="pricetags-outline" size={20} color="#d97706" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Kelola kategori</Text>
              <Text style={styles.menuSubtitle}>Tambah, ubah, atau arsipkan kategori</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#b5c1d3" />
          </Pressable>
        </View>

        {/* Section: Data */}
        <Text style={styles.sectionHeader}>DATA & CADANGAN</Text>
        <View style={styles.menuCard}>
          {/* Cadangkan Data */}
          <Pressable style={styles.menuRow} onPress={handleStartBackup} accessibilityRole="button">
            <View style={[styles.menuIconWrap, { backgroundColor: '#eaf0ff' }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Cadangkan data</Text>
              <Text style={styles.menuSubtitle}>Ekspor data terenkripsi sandi (.ckbackup)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#b5c1d3" />
          </Pressable>

          {/* Pulihkan Cadangan */}
          <Pressable style={styles.menuRow} onPress={handleStartRestore} accessibilityRole="button">
            <View style={[styles.menuIconWrap, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="cloud-download-outline" size={20} color="#0284c7" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Pulihkan cadangan</Text>
              <Text style={styles.menuSubtitle}>Buka dan pulihkan berkas .ckbackup</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#b5c1d3" />
          </Pressable>

          {/* Hapus Semua Data */}
          <Pressable
            style={[styles.menuRow, styles.menuRowLast]}
            onPress={() => setShowDeleteConfirm(true)}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, styles.destructiveText]}>Hapus semua data</Text>
              <Text style={styles.menuSubtitle}>Hapus semua transaksi dan atur ulang kategori</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#b5c1d3" />
          </Pressable>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color={COLORS.primary}
            style={styles.infoIcon}
          />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Penyimpanan Lokal & Terenkripsi</Text>
            <Text style={styles.infoBody}>
              Seluruh catatan keuangan Anda tersimpan offline di perangkat ini. Berkas cadangan
              diamankan dengan enkripsi standar AES-GCM 256-bit dan PBKDF2.
            </Text>
            <Text style={[styles.infoBody, { marginTop: 6 }]}>
              Menghapus aplikasi dapat menghilangkan data. Buat cadangan secara berkala sebelum
              berpindah perangkat.
            </Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Catatan Keuangan v1.0.0</Text>
          <Text style={styles.appInfoSub}>Aplikasi Pelacak Keuangan Pribadi Offline</Text>
        </View>
      </ScrollView>

      {/* Backup Password Modal */}
      <Modal
        visible={backupModalVisible}
        presentationStyle="formSheet"
        animationType="slide"
        onRequestClose={() => !isBackingUp && setBackupModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cadangkan Data</Text>
            <Pressable
              onPress={() => setBackupModalVisible(false)}
              disabled={isBackingUp}
              style={styles.closeModalBtn}
            >
              <Ionicons name="close" size={22} color={COLORS.ink} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalDesc}>
              Tentukan kata sandi untuk melindungi berkas cadangan Anda. Sandi ini akan
              dibutuhkan untuk membuka cadangan di kemudian hari.
            </Text>

            <Text style={styles.modalLabel}>Kata Sandi</Text>
            <TextInput
              style={styles.modalInput}
              value={backupPassword}
              onChangeText={(t) => {
                setBackupPassword(t);
                if (backupError) setBackupError(null);
              }}
              placeholder="Minimal 4 karakter"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              autoFocus
            />

            <Text style={styles.modalLabel}>Konfirmasi Kata Sandi</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (backupError) setBackupError(null);
              }}
              placeholder="Ulangi kata sandi"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
            />

            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#b45309" />
              <Text style={styles.warningText}>
                Sandi ini tidak dapat dipulihkan jika lupa. Simpan atau ingat sandi dengan baik.
              </Text>
            </View>

            {backupError ? <Text style={styles.errorText}>{backupError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.primaryActionBtn, isBackingUp ? styles.btnDisabled : null]}
                onPress={handleExecuteBackup}
                disabled={isBackingUp}
              >
                {isBackingUp ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryActionBtnText}>Buat & Simpan Cadangan</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Restore Password Modal */}
      <Modal
        visible={restoreModalVisible}
        presentationStyle="formSheet"
        animationType="slide"
        onRequestClose={() => !isDecrypting && setRestoreModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Buka Cadangan</Text>
            <Pressable
              onPress={() => setRestoreModalVisible(false)}
              disabled={isDecrypting}
              style={styles.closeModalBtn}
            >
              <Ionicons name="close" size={22} color={COLORS.ink} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalDesc}>
              Masukkan kata sandi yang digunakan saat membuat berkas cadangan ini.
            </Text>

            <Text style={styles.modalLabel}>Kata Sandi</Text>
            <TextInput
              style={styles.modalInput}
              value={restorePassword}
              onChangeText={(t) => {
                setRestorePassword(t);
                if (restoreError) setRestoreError(null);
              }}
              placeholder="Masukkan kata sandi"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              autoFocus
            />

            {restoreError ? <Text style={styles.errorText}>{restoreError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.primaryActionBtn, isDecrypting ? styles.btnDisabled : null]}
                onPress={handleExecuteDecrypt}
                disabled={isDecrypting}
              >
                {isDecrypting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryActionBtnText}>Buka Cadangan</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
      {toastMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
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
  headerPlaceholder: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8896aa',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(31, 63, 119, 0.04)',
    elevation: 2,
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  destructiveText: {
    color: COLORS.red,
  },
  menuSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 14,
    boxShadow: '0 4px 14px rgba(31, 63, 119, 0.04)',
  },
  infoIcon: {
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  appInfo: {
    marginTop: 36,
    alignItems: 'center',
  },
  appInfoText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  appInfoSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
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
  modalDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 6,
    marginTop: 10,
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
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    borderCurve: 'continuous',
    padding: 12,
    gap: 8,
    marginTop: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 10,
    fontWeight: '600',
  },
  modalActions: {
    marginTop: 24,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#1a2a48',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(26, 42, 72, 0.35)',
    elevation: 6,
  },
  toastText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
