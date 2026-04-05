import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../contexts/AppContext';
import { theme, typography } from '../constants/theme';

interface AdBannerProps {
  size?: 'banner' | 'large';
  style?: object;
}

export default function AdBanner({ size = 'banner', style }: AdBannerProps) {
  const { isPremium } = useApp();
  if (isPremium) return null;

  return (
    <View style={[styles.container, styles.placeholder, size === 'large' && styles.placeholderLarge, style]}>
      <View style={styles.placeholderContent}>
        <MaterialIcons name="campaign" size={18} color={theme.textMuted} />
        <Text style={styles.placeholderText}>Advertisement</Text>
      </View>
      <View style={styles.adLabel}>
        <Text style={styles.adLabelText}>Ad</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: theme.radiusMedium,
    marginVertical: 8,
  },
  adLabel: {
    position: 'absolute',
    top: 4,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  adLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placeholder: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    height: 60,
    width: '100%',
  },
  placeholderLarge: {
    height: 250,
  },
  placeholderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placeholderText: {
    ...typography.small,
    color: theme.textMuted,
  },
});
