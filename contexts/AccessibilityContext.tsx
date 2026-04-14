import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // expo-haptics may not be available on web
}
import { TextStyle } from 'react-native';

const STORAGE_KEY = 'accessibility_settings';

export interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  hapticFeedback: boolean;
  screenReaderHints: boolean;
  boldText: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  largeText: false,
  highContrast: false,
  reducedMotion: false,
  hapticFeedback: true,
  screenReaderHints: true,
  boldText: false,
};

export interface AccessibilityContextType {
  settings: AccessibilitySettings;
  loaded: boolean;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  resetSettings: () => void;
  activeCount: number;

  // Functional helpers
  fontScale: number;
  scaledSize: (base: number) => number;
  fontWeight: (base: TextStyle['fontWeight']) => TextStyle['fontWeight'];
  textColor: string;
  subtleTextColor: string;
  mutedTextColor: string;
  triggerHaptic: (type?: 'selection' | 'success' | 'warning' | 'error') => void;
  shouldAnimate: boolean;
  a11yProps: (label: string, hint?: string) => Record<string, unknown>;
}

export const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {}
    setLoaded(true);
  };

  const persist = useCallback(async (updated: AccessibilitySettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  const updateSetting = useCallback((key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      persist(updated);
      return updated;
    });
  }, [persist]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persist(DEFAULT_SETTINGS);
  }, [persist]);

  const activeCount = Object.values(settings).filter(Boolean).length;

  // Font scale: 1.0 normal, 1.2 large
  const fontScale = settings.largeText ? 1.2 : 1.0;

  const scaledSize = useCallback((base: number) => {
    return Math.round(base * (settings.largeText ? 1.2 : 1.0));
  }, [settings.largeText]);

  // Bold override: bump weight by ~200
  const fontWeight = useCallback((base: TextStyle['fontWeight']): TextStyle['fontWeight'] => {
    if (!settings.boldText) return base;
    const map: Record<string, TextStyle['fontWeight']> = {
      '100': '300', '200': '400', '300': '500',
      '400': '600', '500': '700', '600': '800',
      '700': '900', '800': '900', '900': '900',
      'normal': '600', 'bold': '900',
    };
    return map[String(base)] || '700';
  }, [settings.boldText]);

  // High contrast colors
  const textColor = settings.highContrast ? '#FFFFFF' : '#FFFFFF';
  const subtleTextColor = settings.highContrast ? '#C8C8D0' : '#8E8E9A';
  const mutedTextColor = settings.highContrast ? '#9A9AAF' : '#55556A';

  // Haptic wrapper: only fires if enabled
  const triggerHaptic = useCallback((type: 'selection' | 'success' | 'warning' | 'error' = 'selection') => {
    if (!settings.hapticFeedback || !Haptics) return;
    try {
      switch (type) {
        case 'selection':
          Haptics?.selectionAsync();
          break;
        case 'success':
          Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Success);
          break;
        case 'warning':
          Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Warning);
          break;
        case 'error':
          Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Error);
          break;
      }
    } catch {}
  }, [settings.hapticFeedback]);

  const shouldAnimate = !settings.reducedMotion;

  // Screen reader hint builder
  const a11yProps = useCallback((label: string, hint?: string): Record<string, unknown> => {
    const props: Record<string, unknown> = {
      accessible: true,
      accessibilityLabel: label,
    };
    if (settings.screenReaderHints && hint) {
      props.accessibilityHint = hint;
    }
    return props;
  }, [settings.screenReaderHints]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        loaded,
        updateSetting,
        resetSettings,
        activeCount,
        fontScale,
        scaledSize,
        fontWeight,
        textColor,
        subtleTextColor,
        mutedTextColor,
        triggerHaptic,
        shouldAnimate,
        a11yProps,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}
