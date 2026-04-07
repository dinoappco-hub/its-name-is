import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, CustomColors, darkColors, lightColors, createTypography, buildThemeColors, COLOR_PRESETS, isValidHex } from '../constants/theme';

const STORAGE_KEY = 'app_theme_mode';
const PRESET_KEY = 'app_color_preset';
const CUSTOM_KEY = 'app_custom_colors';

export type ThemeMode = 'dark' | 'light';

export interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  typo: ReturnType<typeof createTypography>;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  colorPreset: string;
  setColorPreset: (key: string) => void;
  customColors: CustomColors | null;
  setCustomColors: (colors: CustomColors | null) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [colorPreset, setColorPresetState] = useState<string>('golden');
  const [customColors, setCustomColorsState] = useState<CustomColors | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const [storedMode, storedPreset, storedCustom] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(PRESET_KEY),
        AsyncStorage.getItem(CUSTOM_KEY),
      ]);
      if (storedMode === 'light' || storedMode === 'dark') {
        setModeState(storedMode);
      }
      if (storedPreset && (COLOR_PRESETS.some(p => p.key === storedPreset) || storedPreset === 'custom')) {
        setColorPresetState(storedPreset);
      }
      if (storedCustom) {
        try {
          const parsed = JSON.parse(storedCustom);
          if (parsed.primary && parsed.accent && isValidHex(parsed.primary) && isValidHex(parsed.accent)) {
            setCustomColorsState(parsed);
          }
        } catch {}
      }
    } catch {}
    setLoaded(true);
  };

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const setColorPreset = useCallback((key: string) => {
    setColorPresetState(key);
    if (key !== 'custom') {
      setCustomColorsState(null);
      AsyncStorage.removeItem(CUSTOM_KEY).catch(() => {});
    }
    AsyncStorage.setItem(PRESET_KEY, key).catch(() => {});
  }, []);

  const setCustomColors = useCallback((colors: CustomColors | null) => {
    setCustomColorsState(colors);
    if (colors) {
      setColorPresetState('custom');
      AsyncStorage.setItem(PRESET_KEY, 'custom').catch(() => {});
      AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(colors)).catch(() => {});
    } else {
      AsyncStorage.removeItem(CUSTOM_KEY).catch(() => {});
    }
  }, []);

  const isDark = mode === 'dark';
  const colors = useMemo(() => buildThemeColors(mode, colorPreset, customColors), [mode, colorPreset, customColors]);
  const typo = useMemo(() => createTypography(colors), [colors]);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, typo, setMode, toggleMode, colorPreset, setColorPreset, customColors, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}
