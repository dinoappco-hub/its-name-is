import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';

const STORAGE_KEY = 'accessibility_settings';

interface AccessibilitySettings {
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

interface SettingItem {
  key: keyof AccessibilitySettings;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description: string;
  color: string;
}

const VISUAL_SETTINGS: SettingItem[] = [
  {
    key: 'largeText',
    icon: 'format-size',
    label: 'Larger Text',
    description: 'Increase text size throughout the app for easier reading',
    color: theme.info,
  },
  {
    key: 'boldText',
    icon: 'format-bold',
    label: 'Bold Text',
    description: 'Use heavier font weights for improved readability',
    color: theme.accent,
  },
  {
    key: 'highContrast',
    icon: 'contrast',
    label: 'High Contrast',
    description: 'Increase color contrast for better visibility',
    color: theme.warning,
  },
];

const INTERACTION_SETTINGS: SettingItem[] = [
  {
    key: 'reducedMotion',
    icon: 'animation',
    label: 'Reduce Motion',
    description: 'Minimize animations and transitions throughout the app',
    color: theme.error,
  },
  {
    key: 'hapticFeedback',
    icon: 'vibration',
    label: 'Haptic Feedback',
    description: 'Vibration feedback on button presses and interactions',
    color: theme.success,
  },
];

const ASSISTIVE_SETTINGS: SettingItem[] = [
  {
    key: 'screenReaderHints',
    icon: 'record-voice-over',
    label: 'Screen Reader Hints',
    description: 'Provide additional hints for screen reader users',
    color: theme.primaryDark,
  },
];

export default function AccessibilityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  const updateSetting = useCallback(async (key: keyof AccessibilitySettings, value: boolean) => {
    Haptics.selectionAsync();
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }, [settings]);

  const activeCount = Object.values(settings).filter(Boolean).length;

  const renderSection = (title: string, items: SettingItem[], delay: number) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, idx) => (
          <View
            key={item.key}
            style={[styles.settingRow, idx < items.length - 1 && styles.settingRowBorder]}
          >
            <View style={[styles.settingIcon, { backgroundColor: `${item.color}15` }]}>
              <MaterialIcons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingDescription}>{item.description}</Text>
            </View>
            <Switch
              value={settings[item.key]}
              onValueChange={(val) => updateSetting(item.key, val)}
              trackColor={{ false: theme.surfaceElevated, true: `${item.color}60` }}
              thumbColor={settings[item.key] ? item.color : theme.textMuted}
              ios_backgroundColor={theme.surfaceElevated}
            />
          </View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Accessibility</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <MaterialIcons name="accessibility-new" size={28} color={theme.primary} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>Personalize Your Experience</Text>
            <Text style={styles.summarySubtitle}>
              Adjust these settings to make the app more comfortable for you.
            </Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{activeCount} active</Text>
          </View>
        </Animated.View>

        {renderSection('Visual', VISUAL_SETTINGS, 100)}
        {renderSection('Interaction', INTERACTION_SETTINGS, 200)}
        {renderSection('Assistive', ASSISTIVE_SETTINGS, 300)}

        {/* Reset button */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Pressable
            style={styles.resetBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setSettings(DEFAULT_SETTINGS);
              AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
            }}
          >
            <MaterialIcons name="restart-alt" size={18} color={theme.textSecondary} />
            <Text style={styles.resetBtnText}>Reset to Defaults</Text>
          </Pressable>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={18} color={theme.textMuted} />
          <Text style={styles.infoText}>
            Some settings may also be controlled through your device system settings. App-level settings here complement your system preferences.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.bodyBold, fontSize: 17 },

  // Summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  summaryIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: `${theme.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryContent: { flex: 1 },
  summaryTitle: { ...typography.bodyBold, fontSize: 15, marginBottom: 2 },
  summarySubtitle: { ...typography.small, color: theme.textSecondary, lineHeight: 16 },
  summaryBadge: {
    backgroundColor: `${theme.primary}20`,
    borderRadius: theme.radiusFull,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  summaryBadgeText: { ...typography.small, color: theme.primary, fontWeight: '700', fontSize: 11 },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: {
    ...typography.captionBold, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8, marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  settingIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingContent: { flex: 1 },
  settingLabel: { ...typography.bodyBold, fontSize: 15 },
  settingDescription: { ...typography.small, color: theme.textSecondary, marginTop: 2, lineHeight: 15 },

  // Reset
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: theme.radiusMedium,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  resetBtnText: { ...typography.bodyBold, fontSize: 14, color: theme.textSecondary },

  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoText: {
    ...typography.small,
    color: theme.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
