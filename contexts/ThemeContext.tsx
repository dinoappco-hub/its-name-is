import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, darkColors, lightColors, createTypography, buildThemeColors, COLOR_PRESETS } from '../constants/theme';

const STORAGE_KEY = 'app_theme_mode';
const PRESET_KEY = 'app_color_preset';

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
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [colorPreset, setColorPresetState] = useState<string>('golden');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const [storedMode, storedPreset] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(PRESET_KEY),
      ]);
      if (storedMode === 'light' || storedMode === 'dark') {
        setModeState(storedMode);
      }
      if (storedPreset && COLOR_PRESETS.some(p => p.key === storedPreset)) {
        setColorPresetState(storedPreset);
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
    AsyncStorage.setItem(PRESET_KEY, key).catch(() => {});
  }, []);

  const isDark = mode === 'dark';
  const colors = useMemo(() => buildThemeColors(mode, colorPreset), [mode, colorPreset]);
  const typo = useMemo(() => createTypography(colors), [colors]);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, typo, setMode, toggleMode, colorPreset, setColorPreset }}>
      {children}
    </ThemeContext.Provider>
  );
}
