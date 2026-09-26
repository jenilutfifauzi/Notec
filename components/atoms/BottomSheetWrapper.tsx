import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Dimensions,
} from 'react-native';
import {
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/lib/tokens';

export interface BottomSheetWrapperProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  maxHeight?: number;
  style?: StyleProp<ViewStyle>;
  enablePanDownToClose?: boolean;
}

export default function BottomSheetWrapper({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  scrollable = true,
  maxHeight,
  style,
  enablePanDownToClose = true,
}: BottomSheetWrapperProps) {
  const bottomSheetRef = useRef<GorhomBottomSheetModal>(null);
  const windowHeight = Dimensions.get('window').height;
  const sheetMaxHeight = maxHeight || windowHeight * 0.88;
  const isMountedRef = useRef(false);
  const isPresentedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      if (visible) {
        isPresentedRef.current = true;
        bottomSheetRef.current?.present();
      }
      return;
    }

    if (visible && !isPresentedRef.current) {
      isPresentedRef.current = true;
      bottomSheetRef.current?.present();
    } else if (!visible && isPresentedRef.current) {
      isPresentedRef.current = false;
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    isPresentedRef.current = false;
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.45}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <Pressable
        onPress={onClose}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Tutup"
        style={styles.closeBtn}
      >
        <Ionicons name="close" size={20} color={colors.ink} />
      </Pressable>
    </View>
  );

  return (
    <GorhomBottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing={true}
      maxDynamicContentSize={sheetMaxHeight}
      enablePanDownToClose={enablePanDownToClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={[styles.sheetBackground, style]}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={handleDismiss}
    >
      {scrollable ? (
        <BottomSheetScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderHeader()}
          <View style={styles.contentWrap}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={styles.viewContainer}>
          {renderHeader()}
          <View style={styles.contentWrap}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </BottomSheetView>
      )}
    </GorhomBottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii['5xl'],
    borderTopRightRadius: radii['5xl'],
    borderCurve: 'continuous',
  },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.dragHandle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['8'],
    paddingTop: spacing['2'],
    paddingBottom: spacing['4'],
  },
  titleWrap: {
    flex: 1,
    marginRight: spacing['4'],
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing['1'],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: spacing['8'],
  },
  viewContainer: {
    paddingBottom: spacing['8'],
  },
  contentWrap: {
    paddingHorizontal: spacing['8'],
  },
  footer: {
    paddingHorizontal: spacing['8'],
    paddingTop: spacing['4'],
    marginTop: spacing['4'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
