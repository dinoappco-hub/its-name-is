import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useApp } from '../contexts/AppContext';
import { theme, typography } from '../constants/theme';

const BANNER_AD_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/2934735716',
  android: 'ca-app-pub-3940256099942544/6300978111',
  default: 'ca-app-pub-3940256099942544/6300978111',
});

interface AdBannerProps {
  size?: 'banner' | 'large';
  style?: object;
}

export default function AdBanner({ size = 'banner', style }: AdBannerProps) {
  const { isPremium } = useApp();
  if (isPremium) return null;

  const adSize = size === 'large'
    ? BannerAdSize.MEDIUM_RECTANGLE
    : BannerAdSize.ANCHORED_ADAPTIVE_BANNER;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={BANNER_AD_ID!}
        size={adSize}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => {}}
      />
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
});
