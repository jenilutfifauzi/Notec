import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDeep: string;
  primaryPale: string;
  primaryBarInactive: string;
  pale: string;
  barInactive: string;

  bg: string;
  white: string;
  surfaceInput: string;
  surfaceControl: string;
  surfaceTip: string;
  surfaceDashed: string;

  ink: string;
  muted: string;
  subtle: string;
  placeholder: string;

  line: string;
  border: string;
  borderSecondary: string;
  borderInput: string;
  borderDashed: string;
  borderHighlight: string;
  dragHandle: string;

  green: string;
  red: string;

  warningBg: string;
  warningBorder: string;
  warningText: string;
  warningIcon: string;
  errorBg: string;
  errorBorder: string;

  overlayLight: string;
  overlayDark: string;

  toastBg: string;
  toastAction: string;

  heroSubtitle: string;
  heroBalanceLabel: string;
  heroIconBorder: string;
  heroIconBg: string;

  chevron: string;
  iconMuted: string;
  sectionHeader: string;

  tabBarBg: string;

  searchBg: string;
  searchBorder: string;

  segmentActiveBg: string;

  chipActiveBg: string;
  chipActiveText: string;
  chipInactiveBg: string;
  chipInactiveText: string;
  chipInactiveBorder: string;

  buttonPrimaryBg: string;
  buttonPrimaryText: string;

  transactionIconBg: string;
  transactionIconColor: string;
  transactionIconIncomeColor: string;

  heroStack1: string;
  heroStack2: string;
  heroStack3: string;
}

export interface ThemeShadows {
  card: { boxShadow: string; elevation: number };
  cardLight: { boxShadow: string; elevation: number };
  button: { boxShadow: string; elevation: number };
  buttonHero: { boxShadow: string; elevation: number };
  dialog: { boxShadow: string; elevation: number };
  toast: { boxShadow: string; elevation: number };
  sheet: { boxShadow: string; elevation: number };
}

export interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  shadows: ThemeShadows;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const lightColors: ThemeColors = {
  primary: '#5B9A3C',
  primaryDeep: '#3D7A26',
  primaryPale: '#E7F0D9',
  primaryBarInactive: '#183A27',
  pale: '#E7F0D9',
  barInactive: '#183A27',

  bg: '#FFFDF8',
  white: '#FFFDF8',
  surfaceInput: '#FFFDF8',
  surfaceControl: '#E7F0D9',
  surfaceTip: '#E7F0D9',
  surfaceDashed: '#F7FAF0',

  ink: '#183A27',
  muted: '#587066',
  subtle: '#587066',
  placeholder: '#777777',

  line: '#E5EEE0',
  border: '#E5EEE0',
  borderSecondary: '#E5EEE0',
  borderInput: '#D8E4D3',
  borderDashed: '#B7D493',
  borderHighlight: '#9DC86A',
  dragHandle: '#B7D493',

  green: '#14996b',
  red: '#e05b67',

  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  warningText: '#92400e',
  warningIcon: '#b45309',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',

  overlayLight: 'rgba(6, 59, 27, 0.45)',
  overlayDark: 'rgba(24, 58, 39, 0.55)',

  toastBg: '#183A27',
  toastAction: '#d9f77b',

  heroSubtitle: '#063b1b',
  heroBalanceLabel: '#063b1b',
  heroIconBorder: '#6F9F4266',
  heroIconBg: '#21451f',

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

  // Button primary for dark mode (save button uses different color in dark)
  buttonPrimaryBg: '#5B9A3C',
  buttonPrimaryText: '#FFFDF8',

  // Transaction icon
  transactionIconBg: '#E7F0D9',
  transactionIconColor: '#5B9A3C',
  transactionIconIncomeColor: '#183A27',

  heroStack1: '#B8D990',
  heroStack2: '#CBE4B3',
  heroStack3: '#DCEBCB',
};

export const darkColors: ThemeColors = {
  primary: '#c7f23a',           // lime-green accent in dark mode
  primaryDeep: '#a8d62a',
  primaryPale: '#303030',       // dark icon background
  primaryBarInactive: '#5B9A3C', // bar inactive in dark
  pale: '#303030',
  barInactive: '#5B9A3C',

  bg: '#212121',                // main dark background
  white: '#212121',             // card backgrounds in dark
  surfaceInput: '#272727',      // dark input fields
  surfaceControl: '#292929',    // segmented control track
  surfaceTip: '#242424',        // tip card background
  surfaceDashed: '#272727',

  ink: '#f1f1f1',               // primary text
  muted: '#aaaaaa',             // secondary text
  subtle: '#aaaaaa',
  placeholder: '#777777',       // same as light

  line: '#2d2d2d',              // refined hairline borders in dark
  border: '#2d2d2d',
  borderSecondary: '#2d2d2d',
  borderInput: '#353535',
  borderDashed: '#666666',
  borderHighlight: '#c7f23a66',
  dragHandle: '#666666',

  green: '#14996b',
  red: '#e05b67',

  warningBg: '#2a2000',
  warningBorder: '#5c4a00',
  warningText: '#fde68a',
  warningIcon: '#f59e0b',
  errorBg: '#2a1010',
  errorBorder: '#5c2020',

  overlayLight: 'rgba(0, 0, 0, 0.55)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  toastBg: '#303030',
  toastAction: '#c7f23a',

  heroSubtitle: '#063b1b',      // same — on gradient hero
  heroBalanceLabel: '#063b1b',
  heroIconBorder: '#c7f23a66',
  heroIconBg: '#21451f',

  chevron: '#aaaaaa',
  iconMuted: '#aaaaaa',
  sectionHeader: '#aaaaaa',

  tabBarBg: '#212121',

  searchBg: '#272727',
  searchBorder: '#323232',

  segmentActiveBg: '#212121',

  chipActiveBg: '#c7f23a',
  chipActiveText: '#212121',
  chipInactiveBg: '#212121',
  chipInactiveText: '#aaaaaa',
  chipInactiveBorder: '#323232',

  buttonPrimaryBg: '#c7f23a',
  buttonPrimaryText: '#212121',

  transactionIconBg: '#303030',
  transactionIconColor: '#c7f23a',
  transactionIconIncomeColor: '#c7f23a',

  heroStack1: '#396328',
  heroStack2: '#24452d',
  heroStack3: '#193526',
};

export const lightShadows: ThemeShadows = {
  card: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)', elevation: 1 },
  cardLight: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)', elevation: 1 },
  button: { boxShadow: '0 2px 6px rgba(36, 81, 191, 0.2)', elevation: 2 },
  buttonHero: { boxShadow: '0 3px 8px rgba(36, 81, 191, 0.2)', elevation: 3 },
  dialog: { boxShadow: '0 8px 24px rgba(7, 21, 13, 0.2)', elevation: 6 },
  toast: { boxShadow: '0 4px 12px rgba(24, 58, 39, 0.25)', elevation: 4 },
  sheet: { boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.06)', elevation: 6 },
};

export const darkShadows: ThemeShadows = {
  card: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)', elevation: 1 },
  cardLight: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)', elevation: 1 },
  button: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)', elevation: 2 },
  buttonHero: { boxShadow: '0 3px 8px rgba(0, 0, 0, 0.35)', elevation: 3 },
  dialog: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)', elevation: 6 },
  toast: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)', elevation: 4 },
  sheet: { boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.4)', elevation: 6 },
};

const THEME_FILE_NAME = 'theme.json';

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: lightColors,
  shadows: lightShadows,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    try {
      if (FileSystem.documentDirectory) {
        const path = `${FileSystem.documentDirectory}${THEME_FILE_NAME}`;
        FileSystem.readAsStringAsync(path)
          .then((data) => {
            const parsed = JSON.parse(data);
            if (parsed.mode === 'dark' || parsed.mode === 'light') {
              setMode(parsed.mode);
            }
          })
          .catch(() => {
            // File does not exist yet or unreadable, default light
          });
      }
    } catch {
      // Ignore filesystem access failure
    }
  }, []);

  const persistMode = useCallback((newMode: ThemeMode) => {
    try {
      if (FileSystem.documentDirectory) {
        const path = `${FileSystem.documentDirectory}${THEME_FILE_NAME}`;
        FileSystem.writeAsStringAsync(path, JSON.stringify({ mode: newMode })).catch(() => {});
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      persistMode(next);
      return next;
    });
  }, [persistMode]);

  const setTheme = useCallback(
    (newMode: ThemeMode) => {
      setMode(newMode);
      persistMode(newMode);
    },
    [persistMode],
  );

  const value = useMemo(
    () => ({
      mode,
      colors: mode === 'light' ? lightColors : darkColors,
      shadows: mode === 'light' ? lightShadows : darkShadows,
      toggleTheme,
      setTheme,
    }),
    [mode, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
