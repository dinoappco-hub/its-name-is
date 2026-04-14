import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '../components/SafeIcons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../hooks/useTheme';
import { useAccessibility } from '../hooks/useAccessibility';

interface SettingItem {
  key: 'largeText' | 'highContrast' | 'reducedMotion' | 'hapticFeedback' | 'screenReaderHints' | 'boldText';
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description: string;
  color: string;
}

const VISUAL_SETTINGS: SettingItem[] = [
  { key: 'largeText', icon: 'format-size', label: 'Larger Text', description: 'Increase text size by 20% throughout the app', color: '#3B82F6' },
  { key: 'boldText', icon: 'format-bold', label: 'Bold Text', description: 'Use heavier font weights for improved readability', color: '#7C5CFC' },
  { key: 'highContrast', icon: 'contrast', label: 'High Contrast', description: 'Brighter text colors for better visibility against dark backgrounds', color: '#F59E0B' },
];

const INTERACTION_SETTINGS: SettingItem[] = [
  { key: 'reducedMotion', icon: 'animation', label: 'Reduce Motion', description: 'Disable all entrance animations and transitions', color: '#EF4444' },
  { key: 'hapticFeedback', icon: 'vibration', label: 'Haptic Feedback', description: 'Vibration on button presses — turn off for silent use', color: '#10B981' },
];

const ASSISTIVE_SETTINGS: SettingItem[] = [
  { key: 'screenReaderHints', icon: 'record-voice-over', label: 'Screen Reader Hints', description: 'Add extra descriptive hints for VoiceOver / TalkBack users', color: '#6366F1' },
];

export default function AccessibilityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t } = useAppTheme();
  const {
    settings, updateSetting, resetSettings, activeCount,
    scaledSize, fontWeight, triggerHaptic, shouldAnimate,
    subtleTextColor, mutedTextColor,
  } = useAccessibility();

  const renderSection = (title: string, items: SettingItem[], delay: number) => {
    const Wrapper = shouldAnimate ? Animated.View : View;
    const enterProps = shouldAnimate ? { entering: FadeInDown.delay(delay).duration(400) } : {};

    return (
      <Wrapper {...enterProps} style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: scaledSize(11), color: t.textMuted }]}>{title}</Text>
        <View style={[styles.sectionCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          {items.map((item, idx) => (
            <View key={item.key} style={[styles.settingRow, idx < items.length - 1 && [styles.settingRowBorder, { borderBottomColor: t.border }]]}>
              <View style={[styles.settingIcon, { backgroundColor: `${item.color}15` }]}>
                <MaterialIcons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.settingContent}>
                <View style={styles.settingLabelRow}>
                  <Text style={[styles.settingLabel, { fontSize: scaledSize(15), fontWeight: fontWeight('600'), color: t.textPrimary }]}>{item.label}</Text>
                  {settings[item.key] ? (
                    <View style={[styles.activePill, { backgroundColor: `${item.color}25` }]}>
                      <Text style={[styles.activePillText, { color: item.color }]}>ON</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.settingDescription, { fontSize: scaledSize(11), color: subtleTextColor }]}>{item.description}</Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={(val) => { triggerHaptic('selection'); updateSetting(item.key, val); }}
                trackColor={{ false: t.surfaceElevated, true: `${item.color}60` }}
                thumbColor={settings[item.key] ? item.color : t.textMuted}
                ios_backgroundColor={t.surfaceElevated}
                {...(settings.screenReaderHints ? { accessibilityLabel: item.label, accessibilityHint: `Toggle ${item.label.toLowerCase()}. ${item.description}` } : {})}
              />
            </View>
          ))}
        </View>
      </Wrapper>
    );
  };

  const PreviewWrapper = shouldAnimate ? Animated.View : View;
  const previewEnter = shouldAnimate ? { entering: FadeInDown.delay(50).duration(400) } : {};
  const summaryEnter = shouldAnimate ? { entering: FadeInDown.duration(400) } : {};
  const resetEnter = shouldAnimate ? { entering: FadeInDown.delay(400).duration(400) } : {};
  const infoEnter = shouldAnimate ? { entering: FadeInDown.delay(500).duration(400) } : {};

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: t.surface }]}
          onPress={() => router.back()}
          {...(settings.screenReaderHints ? { accessibilityLabel: 'Go back', accessibilityHint: 'Navigate to previous screen' } : {})}
        >
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontSize: scaledSize(17), fontWeight: fontWeight('600'), color: t.textPrimary }]}>Accessibility</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <PreviewWrapper {...summaryEnter} style={[styles.summaryCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.summaryIconWrap, { backgroundColor: `${t.primary}15` }]}>
            <MaterialIcons name="accessibility-new" size={28} color={t.primary} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={[styles.summaryTitle, { fontSize: scaledSize(15), fontWeight: fontWeight('600'), color: t.textPrimary }]}>Personalize Your Experience</Text>
            <Text style={[styles.summarySubtitle, { fontSize: scaledSize(11), color: subtleTextColor }]}>Changes apply instantly across the entire app.</Text>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: `${t.primary}20` }]}>
            <Text style={[styles.summaryBadgeText, { color: t.primary }]}>{activeCount} active</Text>
          </View>
        </PreviewWrapper>

        <PreviewWrapper {...previewEnter} style={[styles.previewCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.previewHeader, { borderBottomColor: t.border }]}>
            <MaterialIcons name="preview" size={18} color={t.accent} />
            <Text style={[styles.previewHeaderText, { fontSize: scaledSize(13), fontWeight: fontWeight('600'), color: t.accent }]}>Live Preview</Text>
          </View>
          <View style={styles.previewBody}>
            <Text style={[styles.previewTitle, { fontSize: scaledSize(18), fontWeight: fontWeight('700'), color: settings.highContrast ? '#FFFFFF' : t.textPrimary }]}>Sample Heading</Text>
            <Text style={[styles.previewBodyText, { fontSize: scaledSize(15), fontWeight: fontWeight('400'), color: settings.highContrast ? '#C8C8D0' : t.textSecondary }]}>This is how body text will look with your current settings applied.</Text>
            <Text style={[styles.previewSmall, { fontSize: scaledSize(11), fontWeight: fontWeight('500'), color: settings.highContrast ? '#9A9AAF' : t.textMuted }]}>Caption text · 2h ago</Text>
          </View>
        </PreviewWrapper>

        {renderSection('Visual', VISUAL_SETTINGS, 100)}
        {renderSection('Interaction', INTERACTION_SETTINGS, 200)}
        {renderSection('Assistive', ASSISTIVE_SETTINGS, 300)}

        <PreviewWrapper {...resetEnter}>
          <Pressable style={[styles.resetBtn, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => { triggerHaptic('selection'); resetSettings(); }}>
            <MaterialIcons name="restart-alt" size={18} color={t.textSecondary} />
            <Text style={[styles.resetBtnText, { fontSize: scaledSize(14), color: t.textSecondary }]}>Reset to Defaults</Text>
          </Pressable>
        </PreviewWrapper>

        <PreviewWrapper {...infoEnter} style={[styles.infoCard, { backgroundColor: t.surface, borderColor: t.border }]}>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  summaryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, gap: 12 },
  summaryIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  summaryContent: { flex: 1 },
  summaryTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  summarySubtitle: { fontSize: 11, lineHeight: 16 },
  summaryBadge: { borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  summaryBadgeText: { fontSize: 11, fontWeight: '700' },
  previewCard: { borderRadius: 16, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  previewHeaderText: { fontSize: 13, fontWeight: '600' },
  previewBody: { padding: 16, gap: 8 },
  previewTitle: { fontSize: 18, fontWeight: '700' },
  previewBodyText: { fontSize: 15, lineHeight: 22 },
  previewSmall: { fontSize: 11 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  settingRowBorder: { borderBottomWidth: 1 },
  settingIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingContent: { flex: 1 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingDescription: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  activePill: { borderRadius: 9999, paddingHorizontal: 7, paddingVertical: 2 },
  activePillText: { fontSize: 9, fontWeight: '800' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  resetBtnText: { fontSize: 14, fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  infoText: { fontSize: 11, flex: 1, lineHeight: 16 },
});
