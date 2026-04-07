import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth, useAlert } from '@/template';
import { getSupabaseClient } from '@/template';
import { theme, typography } from '../constants/theme';

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
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!category) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert('Select a Category', 'Please select what type of problem you are experiencing.');
      return;
    }
    if (description.trim().length < 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.successIconWrap}>
              <MaterialIcons name="check-circle" size={72} color={theme.success} />
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(150).duration(400)} style={styles.successTitle}>
            Report Submitted
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(250).duration(400)} style={styles.successSubtitle}>
            Thank you for helping us improve. Our team will review your report and take action as needed.
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.successActions}>
            <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={18} color={theme.background} />
              <Text style={styles.primaryBtnText}>Back to Settings</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                setSubmitted(false);
                setCategory('');
                setDescription('');
              }}
            >
              <Text style={styles.secondaryBtnText}>Submit Another</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Report a Problem</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introCard}>
          <MaterialIcons name="feedback" size={22} color={theme.accent} />
          <Text style={styles.introText}>
            Let us know what went wrong. Your feedback helps us make the app better for everyone.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>What type of problem?</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat, index) => {
            const selected = category === cat.key;
            return (
              <Animated.View key={cat.key} entering={FadeInDown.delay(index * 50).duration(300)}>
                <Pressable
                  style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(cat.key);
                  }}
                >
                  <View style={[styles.categoryIconWrap, selected && styles.categoryIconWrapSelected]}>
                    <MaterialIcons
                      name={cat.icon}
                      size={22}
                      color={selected ? theme.background : theme.textMuted}
                    />
                  </View>
                  <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                    {cat.label}
                  </Text>
                  <Text style={[styles.categoryDesc, selected && styles.categoryDescSelected]} numberOfLines={2}>
                    {cat.desc}
                  </Text>
                  {selected ? (
                    <View style={styles.categoryCheck}>
                      <MaterialIcons name="check-circle" size={18} color={theme.accent} />
                    </View>
                  ) : null}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Describe the problem</Text>
        <View style={styles.textAreaWrap}>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us what happened, what you expected, and any steps to reproduce the issue..."
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/1000</Text>
        </View>

        <Pressable
          style={[styles.submitBtn, (!category || description.trim().length < 10 || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.background} />
          ) : (
            <MaterialIcons name="send" size={18} color={theme.background} />
          )}
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Reports are reviewed within 24–48 hours. For urgent issues, reach out on our Discord: discord.gg/2cda4rje
        </Text>
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

  introCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: `${theme.accent}10`,
    borderRadius: theme.radiusMedium,
    padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: `${theme.accent}20`,
  },
  introText: { ...typography.body, color: theme.textSecondary, flex: 1, lineHeight: 22 },

  sectionLabel: {
    ...typography.captionBold, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 12, marginLeft: 2,
  },

  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginBottom: 24,
  },
  categoryCard: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 14,
    borderWidth: 1, borderColor: theme.border,
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: theme.accent,
    backgroundColor: `${theme.accent}08`,
  },
  categoryIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: theme.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryIconWrapSelected: {
    backgroundColor: theme.accent,
  },
  categoryLabel: {
    ...typography.bodyBold, fontSize: 15,
    flex: 0,
  },
  categoryLabelSelected: { color: theme.accent },
  categoryDesc: {
    ...typography.small, color: theme.textMuted,
    flex: 1,
  },
  categoryDescSelected: { color: theme.textSecondary },
  categoryCheck: {
    position: 'absolute', top: 10, right: 10,
  },

  textAreaWrap: {
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 16,
    fontSize: 15, color: theme.textPrimary,
    borderWidth: 1, borderColor: theme.border,
    minHeight: 140,
    lineHeight: 22,
  },
  charCount: { ...typography.small, textAlign: 'right', marginTop: 6 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.accent,
    borderRadius: theme.radiusMedium,
    height: 52,
    marginBottom: 16,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { ...typography.button, color: '#fff', fontSize: 16 },

  disclaimer: {
    ...typography.small, color: theme.textMuted,
    textAlign: 'center', lineHeight: 18,
    paddingHorizontal: 16,
  },

  // Success state
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIconWrap: { marginBottom: 20 },
  successTitle: { ...typography.title, marginBottom: 10 },
  successSubtitle: {
    ...typography.body, color: theme.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  successActions: { width: '100%', gap: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: theme.accent,
    borderRadius: theme.radiusMedium, height: 52,
  },
  primaryBtnText: { ...typography.button, color: '#fff' },
  secondaryBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: theme.radiusMedium, height: 48,
    borderWidth: 1, borderColor: theme.border,
  },
  secondaryBtnText: { ...typography.bodyBold, color: theme.textSecondary },
});
