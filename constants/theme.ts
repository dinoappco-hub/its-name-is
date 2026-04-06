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

// ──────────────────────────── Typography Factory ────────────────────────────

export function createTypography(t: ThemeColors) {
  return {
    heroValue: { fontSize: 48, fontWeight: '700' as const, color: t.textPrimary },
    heroLabel: { fontSize: 11, fontWeight: '600' as const, color: t.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 1 },
    title: { fontSize: 28, fontWeight: '700' as const, color: t.textPrimary },
    subtitle: { fontSize: 20, fontWeight: '700' as const, color: t.textPrimary },
    cardTitle: { fontSize: 16, fontWeight: '600' as const, color: t.textPrimary },
    cardValue: { fontSize: 24, fontWeight: '700' as const, color: t.textPrimary },
    body: { fontSize: 15, fontWeight: '400' as const, color: t.textPrimary },
    bodyBold: { fontSize: 15, fontWeight: '600' as const, color: t.textPrimary },
    caption: { fontSize: 13, fontWeight: '400' as const, color: t.textSecondary },
    captionBold: { fontSize: 13, fontWeight: '600' as const, color: t.textSecondary },
    small: { fontSize: 11, fontWeight: '500' as const, color: t.textMuted },
    button: { fontSize: 16, fontWeight: '700' as const, color: t.background },
    badge: { fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  } as const;
}

export const typography = createTypography(darkColors);
