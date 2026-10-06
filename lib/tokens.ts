import { Platform } from 'react-native';

export const colors = {
  // Brand
  primary: '#5B9A3C',
  primaryDeep: '#3D7A26',
  primaryPale: '#E7F0D9',
  primaryBarInactive: '#183A27',
  // Aliases for backward compatibility with COLORS
  pale: '#E7F0D9',
  barInactive: '#183A27',

  // Surfaces
  bg: '#FFFDF8',
  white: '#FFFDF8',
  surfaceInput: '#FFFDF8',
  surfaceControl: '#E7F0D9',
  surfaceTip: '#E7F0D9',
  surfaceDashed: '#F7FAF0',

  // Text
  ink: '#183A27',
  muted: '#587066',
  subtle: '#587066',
  placeholder: '#777777',

  // Borders
  line: '#D1E2C9',
  border: '#D1E2C9',
  borderSecondary: '#D1E2C9',
  borderInput: '#D1E2C9',
  borderDashed: '#B7D493',
  borderHighlight: '#9DC86A',
  dragHandle: '#B7D493',

  // Semantic
  green: '#14996b',
  red: '#e05b67',

  // Warning
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  warningText: '#92400e',
  warningIcon: '#b45309',

  // Error
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',

  // Overlays
  overlayLight: 'rgba(6, 59, 27, 0.45)',
  overlayDark: 'rgba(24, 58, 39, 0.55)',

  // Toast
  toastBg: '#183A27',
  toastAction: '#d9f77b',

  // Hero-specific
  heroSubtitle: '#063b1b',
  heroBalanceLabel: '#063b1b',
  heroIconBorder: '#6F9F4266',
  heroIconBg: '#21451f',

  // Chevron/icon tints
  chevron: '#587066',
  iconMuted: '#587066',
  sectionHeader: '#587066',

  // Tab bar
  tabBarBg: '#F7FAF0',

  // Search input (Riwayat)
  searchBg: '#EFF8DA',
  searchBorder: '#9DC86A',

  // Segmented control active segment
  segmentActiveBg: '#FFFFFF',

  // Chip active
  chipActiveBg: '#5B9A3C',
  chipActiveText: '#FFFDF8',
  chipInactiveBg: '#FFFDF8',
  chipInactiveText: '#587066',
  chipInactiveBorder: '#D1E2C9',

  // Button primary for dark mode
  buttonPrimaryBg: '#5B9A3C',
  buttonPrimaryText: '#FFFDF8',

  // Transaction icon
  transactionIconBg: '#E7F0D9',
  transactionIconColor: '#5B9A3C',
  transactionIconIncomeColor: '#183A27',

  // Hero stacked cards
  heroStack1: '#B8D990',
  heroStack2: '#CBE4B3',
  heroStack3: '#DCEBCB',

  // Hero New
  heroBg: '#030501',
  heroGlowChampagne: '#DFFF0038',
  heroGlowEmerald: '#2FEA702A',
  heroGlowGold: '#DFFF0030',
  heroPocketBg: '#B6C90F',
  heroCardHandle: '#B6C90F',
  heroSubText: '#DFFF00',
};

export const heroCardGradient = ['#AABD3F', '#E5FE52'] as const;

export const radii = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 18,
  '4xl': 20,
  '5xl': 24,
  full: 9999,
} as const;

export const spacing = {
  '0': 0,
  '1': 2,
  '2': 4,
  '3': 6,
  '4': 8,
  '5': 10,
  '6': 12,
  '7': 14,
  '8': 16,
  '9': 18,
  '10': 20,
  '11': 22,
  '12': 24,
  '14': 28,
  '16': 32,
  '20': 40,
  '24': 48,
} as const;

export const fontFamilies = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semiBold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  extraBold: 'Geist_800ExtraBold',
  black: 'Geist_900Black',
} as const;

// On Android, custom fonts loaded via expo-font are registered under Typeface.NORMAL.
// Specifying bold/numeric weights on Android causes React Native to look up non-existent
// variants and silently fall back to the system font (Roboto).
const isAndroid = Platform.OS === 'android';

export const typography = {
  displayLarge: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 32,
    fontWeight: isAndroid ? undefined : ('800' as const),
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    fontWeight: isAndroid ? undefined : ('700' as const),
    letterSpacing: -0.3,
  },
  titleSmall: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    fontWeight: isAndroid ? undefined : ('700' as const),
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    fontWeight: isAndroid ? undefined : ('400' as const),
  },
  bodySemibold: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    fontWeight: isAndroid ? undefined : ('600' as const),
  },
  bodyBold: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    fontWeight: isAndroid ? undefined : ('700' as const),
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    fontWeight: isAndroid ? undefined : ('700' as const),
  },
  caption: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    fontWeight: isAndroid ? undefined : ('600' as const),
  },
  captionBold: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    fontWeight: isAndroid ? undefined : ('700' as const),
  },
  small: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    fontWeight: isAndroid ? undefined : ('600' as const),
  },
  overline: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 10,
    fontWeight: isAndroid ? undefined : ('800' as const),
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
} as const;

export const shadows = {
  card: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)', elevation: 1 },
  cardLight: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)', elevation: 1 },
  button: { boxShadow: '0 2px 6px rgba(36, 81, 191, 0.2)', elevation: 2 },
  buttonHero: { boxShadow: '0 3px 8px rgba(36, 81, 191, 0.2)', elevation: 3 },
  dialog: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)', elevation: 6 },
  toast: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)', elevation: 4 },
  sheet: { boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)', elevation: 6 },
};

export { motionTokens } from './motion';
