import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useAccessibility } from '../hooks/useAccessibility';

interface SettingItem {
  key: 'largeText' | 'highContrast' | 'reducedMotion' | 'hapticFeedback' | 'screenReaderHints' | 'boldText';
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description: string;
  color: string;
  preview?: string;
}

const VISUAL_SETTINGS: SettingItem[] = [
  {
    key: 'largeText',
    icon: 'format-size',
    label: 'Larger Text',
    description: 'Increase text size by 20% throughout the app',
    color: theme.info,
    preview: 'Aa → Aa',
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
    description: 'Brighter text colors for better visibility against dark backgrounds',
    color: theme.warning,
  },
];

const INTERACTION_SETTINGS: SettingItem[] = [
  {
    key: 'reducedMotion',
    icon: 'animation',
    label: 'Reduce Motion',
    description: 'Disable all entrance animations and transitions',
    color: theme.error,
  },
  {
    key: 'hapticFeedback',
    icon: 'vibration',
    label: 'Haptic Feedback',
    description: 'Vibration on button presses — turn off for silent use',
    color: theme.success,
  },
];

const ASSISTIVE_SETTINGS: SettingItem[] = [
  {
    key: 'screenReaderHints',
    icon: 'record-voice-over',
    label: 'Screen Reader Hints',
    description: 'Add extra descriptive hints for VoiceOver / TalkBack users',
    color: theme.primaryDark,
  },
];

export default function AccessibilityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    settings,
    updateSetting,
    resetSettings,
    activeCount,
    scaledSize,
    fontWeight,
    triggerHaptic,
    shouldAnimate,
    subtleTextColor,
    mutedTextColor,
  } = useAccessibility();

  const renderSection = (title: string, items: SettingItem[], delay: number) => {
    const Wrapper = shouldAnimate ? Animated.View : View;
    const enterProps = shouldAnimate ? { entering: FadeInDown.delay(delay).duration(400) } : {};

    return (
      <Wrapper {...enterProps} style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: scaledSize(11) }]}>{title}</Text>
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
                <View style={styles.settingLabelRow}>
                  <Text style={[styles.settingLabel, {
                    fontSize: scaledSize(15),
                    fontWeight: fontWeight('600'),
                  }]}>
                    {item.label}
                  </Text>
                  {settings[item.key] ? (
                    <View style={[styles.activePill, { backgroundColor: `${item.color}25` }]}>
                      <Text style={[styles.activePillText, { color: item.color }]}>ON</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.settingDescription, {
                  fontSize: scaledSize(11),
                  color: subtleTextColor,
                }]}>
                  {item.description}
                </Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={(val) => {
                  triggerHaptic('selection');
                  updateSetting(item.key, val);
                }}
                trackColor={{ false: theme.surfaceElevated, true: `${item.color}60` }}
                thumbColor={settings[item.key] ? item.color : theme.textMuted}
                ios_backgroundColor={theme.surfaceElevated}
                {...(settings.screenReaderHints ? {
                  accessibilityLabel: item.label,
                  accessibilityHint: `Toggle ${item.label.toLowerCase()}. ${item.description}`,
                } : {})}
              />
            </View>
          ))}
        </View>
      </Wrapper>
    );
  };

  // Live preview card
  const PreviewWrapper = shouldAnimate ? Animated.View : View;
  const previewEnter = shouldAnimate ? { entering: FadeInDown.delay(50).duration(400) } : {};
  const summaryEnter = shouldAnimate ? { entering: FadeInDown.duration(400) } : {};
  const resetEnter = shouldAnimate ? { entering: FadeInDown.delay(400).duration(400) } : {};
  const infoEnter = shouldAnimate ? { entering: FadeInDown.delay(500).duration(400) } : {};

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          {...(settings.screenReaderHints ? { accessibilityLabel: 'Go back', accessibilityHint: 'Navigate to previous screen' } : {})}
        >
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontSize: scaledSize(17), fontWeight: fontWeight('600') }]}>
          Accessibility
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <PreviewWrapper {...summaryEnter} style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <MaterialIcons name="accessibility-new" size={28} color={theme.primary} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={[styles.summaryTitle, { fontSize: scaledSize(15), fontWeight: fontWeight('600') }]}>
              Personalize Your Experience
            </Text>
            <Text style={[styles.summarySubtitle, { fontSize: scaledSize(11), color: subtleTextColor }]}>
              Changes apply instantly across the entire app.
            </Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{activeCount} active</Text>
          </View>
        </PreviewWrapper>

        {/* Live Preview */}
        <PreviewWrapper {...previewEnter} style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <MaterialIcons name="preview" size={18} color={theme.accent} />
            <Text style={[styles.previewHeaderText, { fontSize: scaledSize(13), fontWeight: fontWeight('600') }]}>
              Live Preview
            </Text>
          </View>
          <View style={styles.previewBody}>
            <Text style={[styles.previewTitle, {
              fontSize: scaledSize(18),
              fontWeight: fontWeight('700'),
              color: settings.highContrast ? '#FFFFFF' : theme.textPrimary,
            }]}>
              Sample Heading
            </Text>
            <Text style={[styles.previewBodyText, {
              fontSize: scaledSize(15),
              fontWeight: fontWeight('400'),
              color: settings.highContrast ? '#C8C8D0' : theme.textSecondary,
            }]}>
              This is how body text will look with your current settings applied.
            </Text>
            <Text style={[styles.previewSmall, {
              fontSize: scaledSize(11),
              fontWeight: fontWeight('500'),
              color: settings.highContrast ? '#9A9AAF' : theme.textMuted,
            }]}>
              Caption text · 2h ago
            </Text>
          </View>
        </PreviewWrapper>

        {renderSection('Visual', VISUAL_SETTINGS, 100)}
        {renderSection('Interaction', INTERACTION_SETTINGS, 200)}
        {renderSection('Assistive', ASSISTIVE_SETTINGS, 300)}

        {/* Reset button */}
        <PreviewWrapper {...resetEnter}>
          <Pressable
            style={styles.resetBtn}
            onPress={() => {
              triggerHaptic('selection');
              resetSettings();
            }}
          >
            <MaterialIcons name="restart-alt" size={18} color={theme.textSecondary} />
            <Text style={[styles.resetBtnText, { fontSize: scaledSize(14) }]}>Reset to Defaults</Text>
          </Pressable>
        </PreviewWrapper>

        {/* Info */}
        <PreviewWrapper {...infoEnter} style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={18} color={mutedTextColor} />
          <Text style={[styles.infoText, { fontSize: scaledSize(11), color: mutedTextColor }]}>
            Settings are saved automatically and persist between app sessions. They complement your device system accessibility preferences.
          </Text>
        </PreviewWrapper>
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface, borderRadius: theme.radiusLarge,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: theme.border, gap: 12,
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

  // Live Preview
  previewCard: {
    backgroundColor: theme.surface, borderRadius: theme.radiusLarge,
    borderWidth: 1, borderColor: theme.border,
    marginBottom: 24, overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  previewHeaderText: { ...typography.captionBold, color: theme.accent },
  previewBody: { padding: 16, gap: 8 },
  previewTitle: { ...typography.subtitle, fontSize: 18 },
  previewBodyText: { ...typography.body, color: theme.textSecondary, lineHeight: 22 },
  previewSmall: { ...typography.small, color: theme.textMuted },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: {
    ...typography.captionBold, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8, marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: theme.surface, borderRadius: theme.radiusLarge,
    borderWidth: 1, borderColor: theme.border, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
  settingIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingContent: { flex: 1 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingLabel: { ...typography.bodyBold, fontSize: 15 },
  settingDescription: { ...typography.small, color: theme.textSecondary, marginTop: 2, lineHeight: 15 },
  activePill: {
    borderRadius: theme.radiusFull,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  activePillText: { fontSize: 9, fontWeight: '800' },

  // Reset
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
    borderRadius: theme.radiusMedium,
    backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border,
    marginBottom: 16,
  },
  resetBtnText: { ...typography.bodyBold, fontSize: 14, color: theme.textSecondary },

  // Info
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: theme.surface, borderRadius: theme.radiusMedium,
    padding: 14, borderWidth: 1, borderColor: theme.border,
  },
  infoText: { ...typography.small, color: theme.textMuted, flex: 1, lineHeight: 16 },
});
