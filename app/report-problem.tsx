import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '../components/SafeIcons';
import { useRouter } from 'expo-router';
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth, useAlert } from '@/template';
import { getSupabaseClient } from '@/template';
import { useAppTheme } from '../hooks/useTheme';

const CATEGORIES = [
  { key: 'bug', icon: 'bug-report' as const, label: 'Bug / Crash', desc: 'Something is broken or not working' },
  { key: 'account', icon: 'person-off' as const, label: 'Account Issue', desc: 'Login, profile, or settings problem' },
  { key: 'content', icon: 'report' as const, label: 'Content Issue', desc: 'Inappropriate or missing content' },
  { key: 'feature', icon: 'lightbulb' as const, label: 'Feature Request', desc: 'Suggest a new feature or improvement' },
  { key: 'performance', icon: 'speed' as const, label: 'Performance', desc: 'Slow loading, lag, or battery drain' },
  { key: 'other', icon: 'help-outline' as const, label: 'Other', desc: 'Something else not listed above' },
];

export default function ReportProblemScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { colors: t } = useAppTheme();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!category) {
      Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Warning);
      showAlert('Select a Category', 'Please select what type of problem you are experiencing.');
      return;
    }
    if (description.trim().length < 10) {
      Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Warning);
      showAlert('More Details Needed', 'Please describe the problem in at least 10 characters so we can help.');
      return;
    }
    if (!user?.id) return;

    setSubmitting(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('problem_reports').insert({
      user_id: user.id,
      category,
      description: description.trim(),
    });
    setSubmitting(false);

    if (error) {
      showAlert('Error', 'Could not submit your report. Please try again.');
      return;
    }

    Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Success);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.successContainer}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.successIconWrap}>
              <MaterialIcons name="check-circle" size={72} color={t.success} />
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(150).duration(400)} style={[styles.successTitle, { color: t.textPrimary }]}>
            Report Submitted
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(250).duration(400)} style={[styles.successSubtitle, { color: t.textSecondary }]}>
            Thank you for helping us improve. Our team will review your report and take action as needed.
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.successActions}>
            <Pressable style={[styles.primaryBtn, { backgroundColor: t.accent }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={18} color={t.background} />
              <Text style={[styles.primaryBtnText, { color: t.background }]}>Back to Settings</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: t.border }]}
              onPress={() => { setSubmitted(false); setCategory(''); setDescription(''); }}
            >
              <Text style={[styles.secondaryBtnText, { color: t.textSecondary }]}>Submit Another</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Report a Problem</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.introCard, { backgroundColor: `${t.accent}10`, borderColor: `${t.accent}20` }]}>
          <MaterialIcons name="feedback" size={22} color={t.accent} />
          <Text style={[styles.introText, { color: t.textSecondary }]}>
            Let us know what went wrong. Your feedback helps us make the app better for everyone.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: t.textMuted }]}>What type of problem?</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat, index) => {
            const selected = category === cat.key;
            return (
              <Animated.View key={cat.key} entering={FadeInDown.delay(index * 50).duration(300)}>
                <Pressable
                  style={[
                    styles.categoryCard,
                    { backgroundColor: t.surface, borderColor: t.border },
                    selected && { borderColor: t.accent, backgroundColor: `${t.accent}08` },
                  ]}
                  onPress={() => { Haptics?.selectionAsync(); setCategory(cat.key); }}
                >
                  <View style={[styles.categoryIconWrap, { backgroundColor: t.surfaceElevated }, selected && { backgroundColor: t.accent }]}>
                    <MaterialIcons name={cat.icon} size={22} color={selected ? t.background : t.textMuted} />
                  </View>
                  <Text style={[styles.categoryLabel, { color: t.textPrimary }, selected && { color: t.accent }]}>{cat.label}</Text>
                  <Text style={[styles.categoryDesc, { color: t.textMuted }, selected && { color: t.textSecondary }]} numberOfLines={2}>{cat.desc}</Text>
                  {selected ? (
                    <View style={styles.categoryCheck}>
                      <MaterialIcons name="check-circle" size={18} color={t.accent} />
                    </View>
                  ) : null}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: t.textMuted }]}>Describe the problem</Text>
        <View style={styles.textAreaWrap}>
          <TextInput
            style={[styles.textArea, { backgroundColor: t.surface, color: t.textPrimary, borderColor: t.border }]}
            placeholder="Tell us what happened, what you expected, and any steps to reproduce the issue..."
            placeholderTextColor={t.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: t.textMuted }]}>{description.length}/1000</Text>
        </View>

        <Pressable
          style={[styles.submitBtn, { backgroundColor: t.accent }, (!category || description.trim().length < 10 || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={t.background} />
          ) : (
            <MaterialIcons name="send" size={18} color={t.background} />
          )}
          <Text style={[styles.submitBtnText, { color: t.background }]}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
        </Pressable>

        <Text style={[styles.disclaimer, { color: t.textMuted }]}>
          Reports are reviewed within 24–48 hours. For urgent issues, reach out on our Discord: discord.gg/2cda4rje
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  introCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1 },
  introText: { fontSize: 15, flex: 1, lineHeight: 22 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  categoryCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1, position: 'relative' },
  categoryIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 15, fontWeight: '600', flex: 0 },
  categoryDesc: { fontSize: 11, flex: 1 },
  categoryCheck: { position: 'absolute', top: 10, right: 10 },
  textAreaWrap: { marginBottom: 20 },
  textArea: { borderRadius: 12, padding: 16, fontSize: 15, borderWidth: 1, minHeight: 140, lineHeight: 22 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, height: 52, marginBottom: 16 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIconWrap: { marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  successSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  successActions: { width: '100%', gap: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, height: 52 },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: { alignItems: 'center', justifyContent: 'center', borderRadius: 12, height: 48, borderWidth: 1 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
});
