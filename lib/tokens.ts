export const colors = {
  // Brand
  primary: '#2451bf',
  primaryDeep: '#1b429f',
  primaryPale: '#eaf0ff',
  primaryBarInactive: '#c7d6fa',
  // Aliases for backward compatibility with COLORS
  pale: '#eaf0ff',
  barInactive: '#c7d6fa',

  // Surfaces
  bg: '#f3f6fc',
  white: '#ffffff',
  surfaceInput: '#f8fafd',
  surfaceControl: '#f1f4fa',
  surfaceTip: '#f4f7fe',
  surfaceDashed: '#f8faff',

  // Text
  ink: '#18243c',
  muted: '#8190a8',
  subtle: '#64748b',
  placeholder: '#9ca3af',

  // Borders
  line: '#e8edf5',
  border: '#d7e1f3',
  borderSecondary: '#d2def4',
  borderInput: '#e2e8f0',
  borderDashed: '#b5c9ef',
  borderHighlight: '#bdd0ff',
  dragHandle: '#d7dfec',

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
  overlayLight: 'rgba(15, 23, 42, 0.45)',
  overlayDark: 'rgba(28, 44, 75, 0.55)',

  // Toast
  toastBg: '#1a2a48',
  toastAction: '#91acff',

  // Hero-specific
  heroSubtitle: '#d4e1ff',
  heroBalanceLabel: '#d7e3ff',
  heroIconBorder: '#88a9ec',
  heroIconBg: 'rgba(255, 255, 255, 0.15)',

  // Chevron/icon tints
  chevron: '#b5c1d3',
  iconMuted: '#758cb6',
  sectionHeader: '#8896aa',
} as const;

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

export const typography = {
  displayLarge: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  title: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.3 },
  titleSmall: { fontSize: 14, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodySemibold: { fontSize: 14, fontWeight: '600' as const },
  bodyBold: { fontSize: 14, fontWeight: '700' as const },
  label: { fontSize: 13, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
  captionBold: { fontSize: 12, fontWeight: '700' as const },
  small: { fontSize: 11, fontWeight: '600' as const },
  overline: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
} as const;

export const shadows = {
  card: { boxShadow: '0 6px 16px rgba(31, 63, 119, 0.05)', elevation: 2 },
  cardLight: { boxShadow: '0 6px 16px rgba(31, 63, 119, 0.03)', elevation: 1 },
  button: { boxShadow: '0 4px 12px rgba(36, 81, 191, 0.25)', elevation: 3 },
  buttonHero: { boxShadow: '0 4px 10px rgba(36, 81, 191, 0.35)', elevation: 4 },
  dialog: { boxShadow: '0 8px 24px rgba(28, 44, 75, 0.25)', elevation: 8 },
  toast: { boxShadow: '0 4px 12px rgba(26, 42, 72, 0.35)', elevation: 6 },
  sheet: { boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.1)', elevation: 8 },
} as const;
