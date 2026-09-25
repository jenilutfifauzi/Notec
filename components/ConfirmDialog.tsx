import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors, radii, spacing, typography, Button } from '@/components/ui';

export interface ConfirmDialogProps {
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
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionRow}>
            <Button
              title={cancelText}
              onPress={onCancel}
              variant="outline"
              size="md"
              style={styles.flexBtn}
            />

            <Button
              title={confirmText}
              onPress={onConfirm}
              variant={destructive ? 'destructive' : 'primary'}
              size="md"
              style={styles.flexBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['12'],
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radii['3xl'],
    borderCurve: 'continuous',
    padding: spacing['11'],
    boxShadow: '0 20px 40px rgba(28, 44, 75, 0.25)',
    elevation: 6,
  },
  title: {
    ...typography.title,
    fontSize: 16,
    color: colors.ink,
    marginBottom: spacing['4'],
  },
  message: {
    fontSize: 13,
    color: colors.subtle,
    lineHeight: 19,
    marginBottom: spacing['10'],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing['5'],
  },
  flexBtn: {
    flex: 1,
  },
});
