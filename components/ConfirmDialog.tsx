import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { COLORS } from '../lib/constants';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.cancelButton}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.confirmButton,
                destructive ? styles.destructiveButton : styles.primaryButton,
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 44, 75, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderCurve: 'continuous',
    padding: 22,
    boxShadow: '0 20px 40px rgba(28, 44, 75, 0.25)',
    elevation: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#d2def4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  destructiveButton: {
    backgroundColor: COLORS.red,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
