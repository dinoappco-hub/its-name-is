import { Platform } from 'react-native';

// ──────────────────────────── Color Palettes ────────────────────────────

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  upvote: string;
  downvote: string;
  border: string;
  borderLight: string;
  radiusSmall: number;
  radiusMedium: number;
  radiusLarge: number;
  radiusXL: number;
  radiusFull: number;
  shadow: Record<string, any>;
  shadowElevated: Record<string, any>;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
}

const sharedValues = {
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  radiusXL: 20,
  radiusFull: 9999,
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
};

export const darkColors: ThemeColors = {
  primary: '#FFD700',
  primaryLight: '#FFE44D',
  primaryDark: '#CCB000',
  accent: '#7C5CFC',
  accentLight: '#9B82FD',
  accentDark: '#5A3AD9',
  background: '#0A0A0F',
  backgroundSecondary: '#111118',
  surface: '#16161F',
  surfaceElevated: '#1E1E2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E9A',
  textMuted: '#55556A',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  upvote: '#10B981',
  downvote: '#EF4444',
  border: '#1F1F2E',
  borderLight: '#2A2A3A',
  ...sharedValues,
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 },
    android: { elevation: 4 },
    default: {},
  }) as Record<string, any>,
  shadowElevated: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
    android: { elevation: 8 },
    default: {},
  }) as Record<string, any>,
};

export const lightColors: ThemeColors = {
  primary: '#D4A800',
  primaryLight: '#FFD700',
  primaryDark: '#B08F00',
  accent: '#6B4CE6',
  accentLight: '#8B6FFF',
  accentDark: '#4A30B0',
  background: '#F5F5F8',
  backgroundSecondary: '#EEEEF2',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F0F5',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B80',
  textMuted: '#9E9EB0',
  success: '#0D9668',
  error: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',
  upvote: '#0D9668',
  downvote: '#DC2626',
  border: '#E2E2EA',
  borderLight: '#D5D5E0',
  ...sharedValues,
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }) as Record<string, any>,
  shadowElevated: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
    android: { elevation: 6 },
    default: {},
  }) as Record<string, any>,
};

// Static default (dark) — for backward compatibility
export const theme = darkColors;

// ──────────────────────────── Color Presets ────────────────────────────

export interface ColorPreset {
  key: string;
  name: string;
  emoji: string;
  dark: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;
  };
  light: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;
  };
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    key: 'golden',
    name: 'Golden Hour',
    emoji: '✨',
    dark: { primary: '#FFD700', primaryLight: '#FFE44D', primaryDark: '#CCB000', accent: '#7C5CFC', accentLight: '#9B82FD', accentDark: '#5A3AD9' },
    light: { primary: '#D4A800', primaryLight: '#FFD700', primaryDark: '#B08F00', accent: '#6B4CE6', accentLight: '#8B6FFF', accentDark: '#4A30B0' },
  },
  {
    key: 'ocean',
    name: 'Ocean Breeze',
    emoji: '🌊',
    dark: { primary: '#38BDF8', primaryLight: '#7DD3FC', primaryDark: '#0EA5E9', accent: '#06B6D4', accentLight: '#22D3EE', accentDark: '#0891B2' },
    light: { primary: '#0284C7', primaryLight: '#38BDF8', primaryDark: '#0369A1', accent: '#0891B2', accentLight: '#06B6D4', accentDark: '#0E7490' },
  },
  {
    key: 'rose',
    name: 'Rose Garden',
    emoji: '🌹',
    dark: { primary: '#FB7185', primaryLight: '#FDA4AF', primaryDark: '#E11D48', accent: '#F472B6', accentLight: '#F9A8D4', accentDark: '#DB2777' },
    light: { primary: '#E11D48', primaryLight: '#FB7185', primaryDark: '#BE123C', accent: '#DB2777', accentLight: '#F472B6', accentDark: '#BE185D' },
  },
  {
    key: 'forest',
    name: 'Forest Canopy',
    emoji: '🌿',
    dark: { primary: '#34D399', primaryLight: '#6EE7B7', primaryDark: '#10B981', accent: '#A3E635', accentLight: '#BEF264', accentDark: '#84CC16' },
    light: { primary: '#059669', primaryLight: '#34D399', primaryDark: '#047857', accent: '#65A30D', accentLight: '#84CC16', accentDark: '#4D7C0F' },
  },
  {
    key: 'sunset',
    name: 'Sunset Blaze',
    emoji: '🌅',
    dark: { primary: '#FB923C', primaryLight: '#FDBA74', primaryDark: '#F97316', accent: '#F87171', accentLight: '#FCA5A5', accentDark: '#EF4444' },
    light: { primary: '#EA580C', primaryLight: '#FB923C', primaryDark: '#C2410C', accent: '#DC2626', accentLight: '#F87171', accentDark: '#B91C1C' },
  },
  {
    key: 'arctic',
    name: 'Arctic Frost',
    emoji: '❄️',
    dark: { primary: '#67E8F9', primaryLight: '#A5F3FC', primaryDark: '#22D3EE', accent: '#818CF8', accentLight: '#A5B4FC', accentDark: '#6366F1' },
    light: { primary: '#0891B2', primaryLight: '#22D3EE', primaryDark: '#0E7490', accent: '#4F46E5', accentLight: '#6366F1', accentDark: '#4338CA' },
  },
  {
    key: 'berry',
    name: 'Berry Burst',
    emoji: '🫐',
    dark: { primary: '#E879F9', primaryLight: '#F0ABFC', primaryDark: '#D946EF', accent: '#C084FC', accentLight: '#D8B4FE', accentDark: '#A855F7' },
    light: { primary: '#C026D3', primaryLight: '#E879F9', primaryDark: '#A21CAF', accent: '#9333EA', accentLight: '#A855F7', accentDark: '#7E22CE' },
  },
  {
    key: 'sage',
    name: 'Sage Mist',
    emoji: '🍃',
    dark: { primary: '#86EFAC', primaryLight: '#BBF7D0', primaryDark: '#4ADE80', accent: '#FDE68A', accentLight: '#FEF3C7', accentDark: '#FBBF24' },
    light: { primary: '#16A34A', primaryLight: '#4ADE80', primaryDark: '#15803D', accent: '#D97706', accentLight: '#F59E0B', accentDark: '#B45309' },
  },
];

export interface CustomColors {
  primary: string;
  accent: string;
}

// ──────────────────────────── Font Presets ────────────────────────────

export interface FontPreset {
  key: string;
  name: string;
  emoji: string;
  description: string;
  fontFamily: {
    regular: string | undefined;
    bold: string | undefined;
  };
}

export const FONT_PRESETS: FontPreset[] = [
  {
    key: 'system',
    name: 'System Default',
    emoji: '📱',
    description: 'Clean and native feel',
    fontFamily: { regular: undefined, bold: undefined },
  },
  {
    key: 'rounded',
    name: 'Rounded',
    emoji: '🫧',
    description: 'Soft and friendly',
    fontFamily: {
      regular: Platform.select({ ios: 'Avenir-Medium', android: 'sans-serif-medium', default: undefined }),
      bold: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-black', default: undefined }),
    },
  },
  {
    key: 'serif',
    name: 'Serif',
    emoji: '📰',
    description: 'Classic and elegant',
    fontFamily: {
      regular: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      bold: Platform.select({ ios: 'Georgia-Bold', android: 'serif', default: 'serif' }),
    },
  },
  {
    key: 'monospace',
    name: 'Monospace',
    emoji: '💻',
    description: 'Technical and precise',
    fontFamily: {
      regular: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      bold: Platform.select({ ios: 'Courier-Bold', android: 'monospace', default: 'monospace' }),
    },
  },
  {
    key: 'classic',
    name: 'Classic',
    emoji: '🖋️',
    description: 'Timeless and refined',
    fontFamily: {
      regular: Platform.select({ ios: 'Palatino-Roman', android: 'serif', default: 'serif' }),
      bold: Platform.select({ ios: 'Palatino-Bold', android: 'serif', default: 'serif' }),
    },
  },
];

export function getFontPreset(key: string): FontPreset {
  return FONT_PRESETS.find(f => f.key === key) || FONT_PRESETS[0];
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xFF) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase()}`;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xFF) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xFF) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase()}`;
}

export function buildThemeColors(mode: 'dark' | 'light', presetKey: string, custom?: CustomColors | null): ThemeColors {
  const base = mode === 'dark' ? darkColors : lightColors;

  if (custom && custom.primary && custom.accent) {
    return {
      ...base,
      primary: custom.primary,
      primaryLight: lightenColor(custom.primary, 0.15),
      primaryDark: darkenColor(custom.primary, 0.15),
      accent: custom.accent,
      accentLight: lightenColor(custom.accent, 0.15),
      accentDark: darkenColor(custom.accent, 0.15),
    };
  }

  const preset = COLOR_PRESETS.find(p => p.key === presetKey) || COLOR_PRESETS[0];
  const presetColors = mode === 'dark' ? preset.dark : preset.light;
  return {
    ...base,
    primary: presetColors.primary,
    primaryLight: presetColors.primaryLight,
    primaryDark: presetColors.primaryDark,
    accent: presetColors.accent,
    accentLight: presetColors.accentLight,
    accentDark: presetColors.accentDark,
  };
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = ((num >> 16) & 0xFF) / 255;
  let g = ((num >> 8) & 0xFF) / 255;
  let b = (num & 0xFF) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ──────────────────────────── Typography Factory ────────────────────────────

export function createTypography(t: ThemeColors, fontKey?: string) {
  const fp = getFontPreset(fontKey || 'system');
  const ff = fp.fontFamily.regular;
  const ffBold = fp.fontFamily.bold;
  return {
    heroValue: { fontSize: 48, fontWeight: '700' as const, color: t.textPrimary, ...(ffBold ? { fontFamily: ffBold } : {}) },
    heroLabel: { fontSize: 11, fontWeight: '600' as const, color: t.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 1, ...(ffBold ? { fontFamily: ffBold } : {}) },
    title: { fontSize: 28, fontWeight: '700' as const, color: t.textPrimary, ...(ffBold ? { fontFamily: ffBold } : {}) },
    subtitle: { fontSize: 20, fontWeight: '700' as const, color: t.textPrimary, ...(ffBold ? { fontFamily: ffBold } : {}) },
    cardTitle: { fontSize: 16, fontWeight: '600' as const, color: t.textPrimary, ...(ffBold ? { fontFamily: ffBold } : {}) },
    cardValue: { fontSize: 24, fontWeight: '700' as const, color: t.textPrimary, ...(ffBold ? { fontFamily: ffBold } : {}) },
    body: { fontSize: 15, fontWeight: '400' as const, color: t.textPrimary, ...(ff ? { fontFamily: ff } : {}) },
    bodyBold: { fontSize: 15, fontWeight: '600' as const, color: t.textPrimary, ...(ffBold ? { fontFamily: ffBold } : {}) },
    caption: { fontSize: 13, fontWeight: '400' as const, color: t.textSecondary, ...(ff ? { fontFamily: ff } : {}) },
    captionBold: { fontSize: 13, fontWeight: '600' as const, color: t.textSecondary, ...(ffBold ? { fontFamily: ffBold } : {}) },
    small: { fontSize: 11, fontWeight: '500' as const, color: t.textMuted, ...(ff ? { fontFamily: ff } : {}) },
    button: { fontSize: 16, fontWeight: '700' as const, color: t.background, ...(ffBold ? { fontFamily: ffBold } : {}) },
    badge: { fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5, ...(ffBold ? { fontFamily: ffBold } : {}) },
    fontFamily: ff,
    fontFamilyBold: ffBold,
  } as const;
}

export const typography = createTypography(darkColors);
