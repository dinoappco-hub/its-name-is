import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../hooks/useTheme';
import { COLOR_PRESETS, buildThemeColors, createTypography } from '../constants/theme';
import { useAccessibility } from '../hooks/useAccessibility';

export default function CustomizeThemeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t, isDark, mode, colorPreset, setColorPreset } = useAppTheme();
  const { scaledSize, fontWeight: fw, triggerHaptic, shouldAnimate } = useAccessibility();

  const handleSelect = (key: string) => {
    triggerHaptic('selection');
    setColorPreset(key);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Customize Colors</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Preview */}
        <Animated.View entering={shouldAnimate ? FadeInDown.duration(400) : undefined}>
          <View style={[styles.previewCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.previewLabel, { color: t.textMuted }]}>LIVE PREVIEW</Text>
            <View style={styles.previewContent}>
              <View style={styles.previewRow}>
                <View style={[styles.previewDot, { backgroundColor: t.primary, width: 40, height: 40, borderRadius: 20 }]}>
                  <MaterialIcons name="star" size={20} color={isDark ? '#000' : '#fff'} />
                </View>
                <View style={styles.previewTexts}>
                  <Text style={[styles.previewTitle, { color: t.textPrimary, fontSize: scaledSize(16), fontWeight: fw('700') }]}>Primary Color</Text>
                  <Text style={[styles.previewSubtitle, { color: t.textSecondary }]}>Used for buttons, titles, badges</Text>
                </View>
              </View>
              <View style={styles.previewRow}>
                <View style={[styles.previewDot, { backgroundColor: t.accent, width: 40, height: 40, borderRadius: 20 }]}>
                  <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                </View>
                <View style={styles.previewTexts}>
                  <Text style={[styles.previewTitle, { color: t.textPrimary, fontSize: scaledSize(16), fontWeight: fw('700') }]}>Accent Color</Text>
                  <Text style={[styles.previewSubtitle, { color: t.textSecondary }]}>Used for highlights, icons</Text>
                </View>
              </View>
              <View style={styles.previewButtons}>
                <Pressable style={[styles.previewBtn, { backgroundColor: t.primary }]}>
                  <Text style={[styles.previewBtnText, { color: isDark ? '#000' : '#fff' }]}>Primary Button</Text>
                </Pressable>
                <Pressable style={[styles.previewBtnOutline, { borderColor: t.accent }]}>
                  <Text style={[styles.previewBtnOutlineText, { color: t.accent }]}>Accent</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Color Presets */}
        <Text style={[styles.sectionTitle, { color: t.textMuted }]}>COLOR THEMES</Text>
        <View style={styles.presetsGrid}>
          {COLOR_PRESETS.map((preset, idx) => {
            const isSelected = colorPreset === preset.key;
            const previewColors = buildThemeColors(mode, preset.key);
            return (
              <Animated.View
                key={preset.key}
                entering={shouldAnimate ? FadeInDown.delay(idx * 60).duration(400) : undefined}
              >
                <Pressable
                  style={[
                    styles.presetCard,
                    { backgroundColor: t.surface, borderColor: t.border },
                    isSelected && { borderColor: previewColors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => handleSelect(preset.key)}
                >
                  {isSelected ? (
                    <View style={[styles.selectedBadge, { backgroundColor: previewColors.primary }]}>
                      <MaterialIcons name="check" size={12} color={isDark ? '#000' : '#fff'} />
                    </View>
                  ) : null}
                  <View style={styles.presetColors}>
                    <View style={[styles.colorCircle, styles.colorCircleLarge, { backgroundColor: previewColors.primary }]} />
                    <View style={[styles.colorCircle, styles.colorCircleSmall, { backgroundColor: previewColors.accent }]} />
                  </View>
                  <Text style={[styles.presetEmoji]}>{preset.emoji}</Text>
                  <Text style={[styles.presetName, { color: t.textPrimary, fontSize: scaledSize(13), fontWeight: fw('600') }]}>{preset.name}</Text>
                  <View style={styles.presetSwatches}>
                    <View style={[styles.swatch, { backgroundColor: previewColors.primary }]} />
                    <View style={[styles.swatch, { backgroundColor: previewColors.primaryLight }]} />
                    <View style={[styles.swatch, { backgroundColor: previewColors.accent }]} />
                    <View style={[styles.swatch, { backgroundColor: previewColors.accentLight }]} />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View style={[styles.tipCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <MaterialIcons name="lightbulb-outline" size={20} color={t.primary} />
          <Text style={[styles.tipText, { color: t.textSecondary }]}>
            Your color theme applies to both dark and light modes. Each theme has optimized colors for both appearances.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 14,
  },
  previewContent: { gap: 14 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewDot: { alignItems: 'center', justifyContent: 'center' },
  previewTexts: { flex: 1 },
  previewTitle: { fontSize: 16, fontWeight: '700' },
  previewSubtitle: { fontSize: 12, fontWeight: '400', marginTop: 2 },
  previewButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  previewBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnText: { fontSize: 14, fontWeight: '700' },
  previewBtnOutline: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnOutlineText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  presetCard: {
    width: '100%',
    minWidth: 155,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetColors: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -8,
    marginBottom: 2,
  },
  colorCircle: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  colorCircleLarge: { width: 36, height: 36, borderRadius: 18, zIndex: 1 },
  colorCircleSmall: { width: 28, height: 28, borderRadius: 14, marginLeft: -8 },
  presetEmoji: { fontSize: 20 },
  presetName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  presetSwatches: { flexDirection: 'row', gap: 4, marginTop: 4 },
  swatch: { width: 16, height: 16, borderRadius: 4 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  tipText: { flex: 1, fontSize: 13, fontWeight: '400', lineHeight: 19 },
});
