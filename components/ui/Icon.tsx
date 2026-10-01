import React from 'react';
import { HugeiconsIcon, type HugeiconsProps, type IconSvgElement } from '@hugeicons/react-native';

export type IconProps = HugeiconsProps;

export function Icon({
  icon,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.5,
  style,
  ...rest
}: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
      {...rest}
    />
  );
}

export default Icon;
