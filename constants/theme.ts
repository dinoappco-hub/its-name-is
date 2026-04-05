import { Platform } from 'react-native';

export const theme = {
  // Brand Colors
  primary: '#FFD700',
  primaryLight: '#FFE44D',
  primaryDark: '#CCB000',
  accent: '#7C5CFC',
  accentLight: '#9B82FD',
  accentDark: '#5A3AD9',

  // Backgrounds
  background: '#0A0A0F',
  backgroundSecondary: '#111118',
  surface: '#16161F',
  surfaceElevated: '#1E1E2A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E9A',
  textMuted: '#55556A',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Voting
  upvote: '#10B981',
  downvote: '#EF4444',

  // Border
  border: '#1F1F2E',
  borderLight: '#2A2A3A',

  // Radius
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  radiusXL: 20,
  radiusFull: 9999,

  // Shadows
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 },
    android: { elevation: 4 },
    default: {},
  }),
  shadowElevated: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
    android: { elevation: 8 },
    default: {},
  }),

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
} as const;

export const typography = {
  heroValue: { fontSize: 48, fontWeight: '700' as const, color: theme.textPrimary },
  heroLabel: { fontSize: 11, fontWeight: '600' as const, color: theme.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '700' as const, color: theme.textPrimary },
  subtitle: { fontSize: 20, fontWeight: '700' as const, color: theme.textPrimary },
  cardTitle: { fontSize: 16, fontWeight: '600' as const, color: theme.textPrimary },
  cardValue: { fontSize: 24, fontWeight: '700' as const, color: theme.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: theme.textPrimary },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, color: theme.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: theme.textSecondary },
  captionBold: { fontSize: 13, fontWeight: '600' as const, color: theme.textSecondary },
  small: { fontSize: 11, fontWeight: '500' as const, color: theme.textMuted },
  button: { fontSize: 16, fontWeight: '700' as const, color: theme.background },
  badge: { fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
} as const;
