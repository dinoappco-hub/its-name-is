import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, TextInput, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '../components/SafeIcons';
import { useRouter } from 'expo-router';
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
import Animated, { FadeInDown } from '../components/SafeAnimated';
import { useAppTheme } from '../hooks/useTheme';
import { COLOR_PRESETS, FONT_PRESETS, buildThemeColors, isValidHex, hslToHex, hexToHsl } from '../constants/theme';
import { useAccessibility } from '../hooks/useAccessibility';
import { Image } from 'expo-image';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 10;
const PRESET_CARD_W = (SCREEN_W - 32 - GRID_GAP) / 2;

type TabMode = 'presets' | 'custom';

export default function CustomizeThemeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t, isDark, mode, colorPreset, setColorPreset, customColors, setCustomColors, fontPreset, setFontPreset } = useAppTheme();
  const { scaledSize, fontWeight: fw, triggerHaptic, shouldAnimate } = useAccessibility();

  const [tab, setTab] = useState<TabMode>(colorPreset === 'custom' ? 'custom' : 'presets');

  const handleSelectFont = (key: string) => {
    triggerHaptic('selection');
    setFontPreset(key);
  };

  // Custom color state
  const [primaryHex, setPrimaryHex] = useState(customColors?.primary || '#FF6B6B');
  const [accentHex, setAccentHex] = useState(customColors?.accent || '#4ECDC4');
  const [primaryHsl, setPrimaryHsl] = useState(() => hexToHsl(customColors?.primary || '#FF6B6B'));
  const [accentHsl, setAccentHsl] = useState(() => hexToHsl(customColors?.accent || '#4ECDC4'));
  const [editingField, setEditingField] = useState<'primary' | 'accent' | null>(null);

  const updatePrimaryFromHsl = useCallback((h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    setPrimaryHex(hex);
    setPrimaryHsl({ h, s, l });
  }, []);

  const updateAccentFromHsl = useCallback((h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    setAccentHex(hex);
    setAccentHsl({ h, s, l });
  }, []);

  const handlePrimaryHexInput = (text: string) => {
    const cleaned = text.startsWith('#') ? text : `#${text}`;
    setPrimaryHex(cleaned);
    if (isValidHex(cleaned)) {
      setPrimaryHsl(hexToHsl(cleaned));
    }
  };

  const handleAccentHexInput = (text: string) => {
    const cleaned = text.startsWith('#') ? text : `#${text}`;
    setAccentHex(cleaned);
    if (isValidHex(cleaned)) {
      setAccentHsl(hexToHsl(cleaned));
    }
  };

  const applyCustomColors = () => {
    if (!isValidHex(primaryHex) || !isValidHex(accentHex)) return;
    triggerHaptic('success');
    setCustomColors({ primary: primaryHex, accent: accentHex });
  };

  const isCustomApplied = colorPreset === 'custom' && customColors?.primary === primaryHex && customColors?.accent === accentHex;
  const canApply = isValidHex(primaryHex) && isValidHex(accentHex) && !isCustomApplied;

  const handleSelectPreset = (key: string) => {
    triggerHaptic('selection');
    setColorPreset(key);
  };

  // Hue bar colors for sliders
  const hueColors = useMemo(() => {
    const colors = [];
    for (let i = 0; i <= 360; i += 30) {
      colors.push(hslToHex(i, 80, 50));
    }
    return colors;
  }, []);

  const renderHueSlider = (
    label: string,
    hsl: { h: number; s: number; l: number },
    onChangeH: (h: number) => void,
    onChangeS: (s: number) => void,
    onChangeL: (l: number) => void,
    currentHex: string,
  ) => (
    <View style={styles.sliderGroup}>
      <View style={styles.sliderLabelRow}>
        <Text style={[styles.sliderLabel, { color: t.textSecondary }]}>{label}</Text>
        <View style={[styles.colorDot, { backgroundColor: currentHex }]} />
      </View>

      {/* Hue */}
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderName, { color: t.textMuted }]}>H</Text>
        <View style={[styles.sliderTrack, { borderColor: t.border }]}>
          <View style={styles.hueGradient}>
            {hueColors.map((c, i) => (
              <View key={i} style={[styles.hueSegment, { backgroundColor: c }]} />
            ))}
          </View>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={(e) => {
              const x = (e as any).nativeEvent?.locationX || 0;
              const trackWidth = SCREEN_W - 32 - 70;
              const h = Math.round(Math.max(0, Math.min(360, (x / trackWidth) * 360)));
              onChangeH(h);
            }}
          >
            <View style={[styles.sliderThumb, { left: `${(hsl.h / 360) * 100}%`, backgroundColor: currentHex, borderColor: t.background }]} />
          </Pressable>
        </View>
        <Text style={[styles.sliderValue, { color: t.textMuted }]}>{hsl.h}°</Text>
      </View>

      {/* Saturation */}
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderName, { color: t.textMuted }]}>S</Text>
        <View style={[styles.sliderTrack, { borderColor: t.border }]}>
          <View style={[styles.satGradient, { backgroundColor: `hsl(${hsl.h}, 0%, ${hsl.l}%)` }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: `hsl(${hsl.h}, 100%, ${hsl.l}%)`, opacity: 1, borderRadius: 6 }]} />
          </View>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={(e) => {
              const x = (e as any).nativeEvent?.locationX || 0;
              const trackWidth = SCREEN_W - 32 - 70;
              const s = Math.round(Math.max(0, Math.min(100, (x / trackWidth) * 100)));
              onChangeS(s);
            }}
          >
            <View style={[styles.sliderThumb, { left: `${hsl.s}%`, backgroundColor: currentHex, borderColor: t.background }]} />
          </Pressable>
        </View>
        <Text style={[styles.sliderValue, { color: t.textMuted }]}>{hsl.s}%</Text>
      </View>

      {/* Lightness */}
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderName, { color: t.textMuted }]}>L</Text>
        <View style={[styles.sliderTrack, { borderColor: t.border }]}>
          <View style={[styles.lightGradient, { backgroundColor: '#000' }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: 1, borderRadius: 6 }]} />
          </View>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={(e) => {
              const x = (e as any).nativeEvent?.locationX || 0;
              const trackWidth = SCREEN_W - 32 - 70;
              const l = Math.round(Math.max(0, Math.min(100, (x / trackWidth) * 100)));
              onChangeL(l);
            }}
          >
            <View style={[styles.sliderThumb, { left: `${hsl.l}%`, backgroundColor: currentHex, borderColor: t.background }]} />
          </Pressable>
        </View>
        <Text style={[styles.sliderValue, { color: t.textMuted }]}>{hsl.l}%</Text>
      </View>
    </View>
  );

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
        {/* Live Preview Cards */}
        <Animated.View entering={shouldAnimate ? FadeInDown.duration(400) : undefined}>
          <Text style={[styles.sectionLabel, { color: t.textMuted }]}>LIVE PREVIEW</Text>
          <View style={styles.previewCardsRow}>
            {/* Feed Card Preview */}
            <View style={[styles.previewMiniCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={[styles.previewImgPlaceholder, { backgroundColor: t.backgroundSecondary }]}>
                <MaterialIcons name="image" size={24} color={t.textMuted} />
              </View>
              <View style={styles.previewMiniContent}>
                <Text style={[styles.previewMiniTitle, { color: t.textPrimary }]} numberOfLines={1}>Mr. Whiskers</Text>
                <View style={styles.previewMiniMeta}>
                  <MaterialIcons name="arrow-upward" size={10} color={t.primary} />
                  <Text style={[styles.previewMiniMetaText, { color: t.primary }]}>24</Text>
                  <MaterialIcons name="chat-bubble-outline" size={10} color={t.textMuted} style={{ marginLeft: 6 }} />
                  <Text style={[styles.previewMiniMetaText, { color: t.textMuted }]}>5</Text>
                </View>
              </View>
            </View>

            {/* Profile Card Preview */}
            <View style={[styles.previewMiniCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.previewProfileContent}>
                <View style={[styles.previewAvatar, { backgroundColor: t.primary }]}>
                  <MaterialIcons name="person" size={18} color={isDark ? '#000' : '#fff'} />
                </View>
                <Text style={[styles.previewProfileName, { color: t.textPrimary }]}>Username</Text>
                <Text style={[styles.previewProfileSub, { color: t.textSecondary }]}>12 objects</Text>
              </View>
              <Pressable style={[styles.previewFollowBtn, { backgroundColor: t.primary }]}>
                <Text style={[styles.previewFollowText, { color: isDark ? '#000' : '#fff' }]}>Follow</Text>
              </Pressable>
            </View>
          </View>

          {/* Button / Badge Preview */}
          <View style={[styles.previewActionCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={styles.previewActionRow}>
              <Pressable style={[styles.previewPrimaryBtn, { backgroundColor: t.primary }]}>
                <Text style={[styles.previewBtnLabel, { color: isDark ? '#000' : '#fff' }]}>Primary</Text>
              </Pressable>
              <Pressable style={[styles.previewAccentBtn, { borderColor: t.accent }]}>
                <Text style={[styles.previewBtnLabel, { color: t.accent }]}>Accent</Text>
              </Pressable>
              <View style={[styles.previewBadge, { backgroundColor: `${t.primary}20` }]}>
                <MaterialIcons name="star" size={12} color={t.primary} />
                <Text style={[styles.previewBadgeText, { color: t.primary }]}>Featured</Text>
              </View>
            </View>
            <View style={styles.previewSwatchRow}>
              <View style={[styles.swatchLg, { backgroundColor: t.primary }]} />
              <View style={[styles.swatchLg, { backgroundColor: t.primaryLight }]} />
              <View style={[styles.swatchLg, { backgroundColor: t.accent }]} />
              <View style={[styles.swatchLg, { backgroundColor: t.accentLight }]} />
              <View style={[styles.swatchLg, { backgroundColor: t.background }]} />
              <View style={[styles.swatchLg, { backgroundColor: t.surface }]} />
            </View>
          </View>
        </Animated.View>

        {/* Tab Switcher */}
        <View style={[styles.tabBar, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Pressable
            style={[styles.tabItem, tab === 'presets' && { backgroundColor: t.primary }]}
            onPress={() => { triggerHaptic('selection'); setTab('presets'); }}
          >
            <MaterialIcons name="palette" size={16} color={tab === 'presets' ? (isDark ? '#000' : '#fff') : t.textSecondary} />
            <Text style={[styles.tabText, { color: tab === 'presets' ? (isDark ? '#000' : '#fff') : t.textSecondary }]}>Presets</Text>
          </Pressable>
          <Pressable
            style={[styles.tabItem, tab === 'custom' && { backgroundColor: t.primary }]}
            onPress={() => { triggerHaptic('selection'); setTab('custom'); }}
          >
            <MaterialIcons name="tune" size={16} color={tab === 'custom' ? (isDark ? '#000' : '#fff') : t.textSecondary} />
            <Text style={[styles.tabText, { color: tab === 'custom' ? (isDark ? '#000' : '#fff') : t.textSecondary }]}>Custom</Text>
          </Pressable>
        </View>

        {tab === 'presets' ? (
          <>
            <Text style={[styles.sectionLabel, { color: t.textMuted }]}>COLOR THEMES</Text>
            <View style={styles.presetsGrid}>
              {COLOR_PRESETS.map((preset, idx) => {
                const isSelected = colorPreset === preset.key;
                const previewColors = buildThemeColors(mode, preset.key);
                return (
                  <Animated.View
                    key={preset.key}
                    entering={shouldAnimate ? FadeInDown.delay(idx * 50).duration(350) : undefined}
                    style={{ width: PRESET_CARD_W }}
                  >
                    <Pressable
                      style={[
                        styles.presetCard,
                        { backgroundColor: t.surface, borderColor: t.border },
                        isSelected && { borderColor: previewColors.primary, borderWidth: 2.5 },
                      ]}
                      onPress={() => handleSelectPreset(preset.key)}
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
                      <Text style={styles.presetEmoji}>{preset.emoji}</Text>
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
          </>
        ) : (
          <Animated.View entering={shouldAnimate ? FadeInDown.duration(400) : undefined}>
            <Text style={[styles.sectionLabel, { color: t.textMuted }]}>CUSTOM COLORS</Text>

            {/* Primary Color Picker */}
            <View style={[styles.colorPickerCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.hexInputRow}>
                <View style={[styles.colorPreviewCircle, { backgroundColor: isValidHex(primaryHex) ? primaryHex : '#999' }]} />
                <View style={styles.hexInputWrap}>
                  <Text style={[styles.hexLabel, { color: t.textSecondary }]}>Primary Color</Text>
                  <TextInput
                    style={[styles.hexInput, { color: t.textPrimary, backgroundColor: t.backgroundSecondary, borderColor: editingField === 'primary' ? t.primary : t.border }]}
                    value={primaryHex}
                    onChangeText={handlePrimaryHexInput}
                    onFocus={() => setEditingField('primary')}
                    onBlur={() => setEditingField(null)}
                    placeholder="#FF6B6B"
                    placeholderTextColor={t.textMuted}
                    maxLength={7}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              {renderHueSlider(
                'Primary',
                primaryHsl,
                (h) => updatePrimaryFromHsl(h, primaryHsl.s, primaryHsl.l),
                (s) => updatePrimaryFromHsl(primaryHsl.h, s, primaryHsl.l),
                (l) => updatePrimaryFromHsl(primaryHsl.h, primaryHsl.s, l),
                isValidHex(primaryHex) ? primaryHex : '#999',
              )}
            </View>

            {/* Accent Color Picker */}
            <View style={[styles.colorPickerCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.hexInputRow}>
                <View style={[styles.colorPreviewCircle, { backgroundColor: isValidHex(accentHex) ? accentHex : '#999' }]} />
                <View style={styles.hexInputWrap}>
                  <Text style={[styles.hexLabel, { color: t.textSecondary }]}>Accent Color</Text>
                  <TextInput
                    style={[styles.hexInput, { color: t.textPrimary, backgroundColor: t.backgroundSecondary, borderColor: editingField === 'accent' ? t.accent : t.border }]}
                    value={accentHex}
                    onChangeText={handleAccentHexInput}
                    onFocus={() => setEditingField('accent')}
                    onBlur={() => setEditingField(null)}
                    placeholder="#4ECDC4"
                    placeholderTextColor={t.textMuted}
                    maxLength={7}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              {renderHueSlider(
                'Accent',
                accentHsl,
                (h) => updateAccentFromHsl(h, accentHsl.s, accentHsl.l),
                (s) => updateAccentFromHsl(accentHsl.h, s, accentHsl.l),
                (l) => updateAccentFromHsl(accentHsl.h, accentHsl.s, l),
                isValidHex(accentHex) ? accentHex : '#999',
              )}
            </View>

            {/* Apply Button */}
            <Pressable
              style={[
                styles.applyBtn,
                { backgroundColor: canApply ? (isValidHex(primaryHex) ? primaryHex : t.primary) : t.surfaceElevated },
              ]}
              onPress={applyCustomColors}
              disabled={!canApply}
            >
              <MaterialIcons name={isCustomApplied ? 'check-circle' : 'brush'} size={18} color={canApply ? '#fff' : t.textMuted} />
              <Text style={[styles.applyBtnText, { color: canApply ? '#fff' : t.textMuted }]}>
                {isCustomApplied ? 'Applied' : 'Apply Custom Colors'}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={[styles.tipCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <MaterialIcons name="lightbulb-outline" size={20} color={t.primary} />
          <Text style={[styles.tipText, { color: t.textSecondary }]}>
            {tab === 'presets'
              ? 'Each theme has optimized colors for both dark and light modes.'
              : 'Enter a hex code directly or use the sliders to find your perfect color. Tap Apply to save.'}
          </Text>
        </View>

        {/* Font Family Picker */}
        <Text style={[styles.sectionLabel, { color: t.textMuted, marginTop: 4 }]}>TYPOGRAPHY STYLE</Text>
        <View style={styles.fontGrid}>
          {FONT_PRESETS.map((fp, idx) => {
            const isSelected = fontPreset === fp.key;
            const previewFF = fp.fontFamily.bold || fp.fontFamily.regular;
            return (
              <Animated.View
                key={fp.key}
                entering={shouldAnimate ? FadeInDown.delay(idx * 60).duration(350) : undefined}
              >
                <Pressable
                  style={[
                    styles.fontCard,
                    { backgroundColor: t.surface, borderColor: t.border },
                    isSelected && { borderColor: t.primary, borderWidth: 2.5 },
                  ]}
                  onPress={() => handleSelectFont(fp.key)}
                >
                  <View style={styles.fontCardTop}>
                    <Text style={styles.fontEmoji}>{fp.emoji}</Text>
                    {isSelected ? (
                      <View style={[styles.fontSelectedBadge, { backgroundColor: t.primary }]}>
                        <MaterialIcons name="check" size={12} color={isDark ? '#000' : '#fff'} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.fontPreviewText, { color: t.textPrimary }, previewFF ? { fontFamily: previewFF } : {}]}>Aa Bb Cc</Text>
                  <Text style={[styles.fontName, { color: t.textPrimary }]}>{fp.name}</Text>
                  <Text style={[styles.fontDesc, { color: t.textMuted }]}>{fp.description}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View style={[styles.tipCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <MaterialIcons name="text-fields" size={20} color={t.primary} />
          <Text style={[styles.tipText, { color: t.textSecondary }]}>
            Font style applies to all text across the app. Preview updates instantly.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: 10, marginLeft: 4, marginTop: 8,
  },

  // Preview Cards
  previewCardsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  previewMiniCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, overflow: 'hidden',
  },
  previewImgPlaceholder: {
    height: 60, alignItems: 'center', justifyContent: 'center',
  },
  previewMiniContent: { padding: 10 },
  previewMiniTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  previewMiniMeta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  previewMiniMetaText: { fontSize: 10, fontWeight: '600' },
  previewProfileContent: { alignItems: 'center', padding: 12, gap: 4 },
  previewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  previewProfileName: { fontSize: 13, fontWeight: '600' },
  previewProfileSub: { fontSize: 10, fontWeight: '400' },
  previewFollowBtn: {
    marginHorizontal: 10, marginBottom: 10, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  previewFollowText: { fontSize: 11, fontWeight: '700' },
  previewActionCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16, gap: 12,
  },
  previewActionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewPrimaryBtn: {
    height: 34, paddingHorizontal: 16, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  previewAccentBtn: {
    height: 34, paddingHorizontal: 16, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  previewBtnLabel: { fontSize: 12, fontWeight: '700' },
  previewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999,
  },
  previewBadgeText: { fontSize: 11, fontWeight: '600' },
  previewSwatchRow: { flexDirection: 'row', gap: 6 },
  swatchLg: { flex: 1, height: 20, borderRadius: 6 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 16, marginTop: 4,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 40, borderRadius: 9,
  },
  tabText: { fontSize: 14, fontWeight: '600' },

  // Preset Grid
  presetsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, marginBottom: 20,
  },
  presetCard: {
    borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center',
    gap: 6, position: 'relative', overflow: 'hidden',
  },
  selectedBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  presetColors: { flexDirection: 'row', alignItems: 'center', gap: -8, marginBottom: 2 },
  colorCircle: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 }, default: {},
    }),
  },
  colorCircleLarge: { width: 34, height: 34, borderRadius: 17, zIndex: 1 },
  colorCircleSmall: { width: 26, height: 26, borderRadius: 13, marginLeft: -8 },
  presetEmoji: { fontSize: 18 },
  presetName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  presetSwatches: { flexDirection: 'row', gap: 4, marginTop: 2 },
  swatch: { width: 14, height: 14, borderRadius: 4 },

  // Custom Color Picker
  colorPickerCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14,
  },
  hexInputRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  colorPreviewCircle: {
    width: 48, height: 48, borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 4 }, default: {},
    }),
  },
  hexInputWrap: { flex: 1 },
  hexLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  hexInput: {
    height: 42, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12,
    fontSize: 15, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // HSL Sliders
  sliderGroup: { gap: 8 },
  sliderLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  sliderLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderName: { fontSize: 11, fontWeight: '700', width: 14 },
  sliderTrack: {
    flex: 1, height: 24, borderRadius: 6, overflow: 'hidden', borderWidth: 1, position: 'relative',
  },
  hueGradient: { flex: 1, flexDirection: 'row', borderRadius: 6 },
  hueSegment: { flex: 1 },
  satGradient: { flex: 1, borderRadius: 6 },
  lightGradient: { flex: 1, borderRadius: 6 },
  sliderThumb: {
    position: 'absolute', top: 0, width: 24, height: 22, borderRadius: 6,
    borderWidth: 3, marginLeft: -12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3 },
      android: { elevation: 4 }, default: {},
    }),
  },
  sliderValue: { fontSize: 10, fontWeight: '600', width: 30, textAlign: 'right' },

  // Apply Button
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52, borderRadius: 14, marginBottom: 16, marginTop: 4,
  },
  applyBtnText: { fontSize: 16, fontWeight: '700' },

  // Tip
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 20,
  },
  tipText: { flex: 1, fontSize: 13, fontWeight: '400', lineHeight: 19 },

  // Font Picker
  fontGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, marginBottom: 16,
  },
  fontCard: {
    width: PRESET_CARD_W, borderRadius: 14, borderWidth: 1, padding: 14,
    alignItems: 'center', gap: 4, position: 'relative',
  },
  fontCardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginBottom: 4,
  },
  fontEmoji: { fontSize: 20 },
  fontSelectedBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  fontPreviewText: { fontSize: 22, fontWeight: '600', marginBottom: 4, letterSpacing: 0.5 },
  fontName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  fontDesc: { fontSize: 10, fontWeight: '400', textAlign: 'center' },
});
