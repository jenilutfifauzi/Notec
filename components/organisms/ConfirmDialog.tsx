import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/lib/tokens';
import Button from '@/components/atoms/Button';
import BottomSheetWrapper from '@/components/atoms/BottomSheetWrapper';

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

export default function ConfirmDialog({
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
    <BottomSheetWrapper
      visible={visible}
      onClose={onCancel}
      title={title}
      scrollable={false}
    >
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
    </BottomSheetWrapper>
  );
}

const styles = StyleSheet.create({
  message: {
    ...typography.body,
    fontSize: 14,
    color: colors.subtle,
    lineHeight: 20,
    marginBottom: spacing['6'],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  flexBtn: {
    flex: 1,
  },
});
