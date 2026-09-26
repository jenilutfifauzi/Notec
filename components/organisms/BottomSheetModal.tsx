import React from 'react';
import BottomSheetWrapper, {
  type BottomSheetWrapperProps,
} from '@/components/atoms/BottomSheetWrapper';

export type BottomSheetModalProps = BottomSheetWrapperProps;

export default function BottomSheetModal(props: BottomSheetModalProps) {
  return <BottomSheetWrapper {...props} />;
}
