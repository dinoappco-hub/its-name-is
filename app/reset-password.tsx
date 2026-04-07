import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSupabaseClient } from '@/template';
import { useAlert } from '@/template';
import { useAppTheme } from '../hooks/useTheme';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors: t } = useAppTheme();
  const { showAlert } = useAlert();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Supabase auto-processes the recovery token from the deep link URL
    // and establishes a session. We just need to verify we have a valid session.
    const checkSession = async () => {
      try {
        const supabase = getSupabaseClient();

        // Listen for the PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            setSessionReady(true);
            setChecking(false);
          }
        });

        // Also check if there is already a valid session (token was already processed)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
          setChecking(false);
        } else {
          // Give Supabase a moment to process the deep link token
          setTimeout(() => {
            setChecking(false);
          }, 3000);
        }

        return () => subscription.unsubscribe();
      } catch {
        setChecking(false);
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      showAlert('Missing Password', 'Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    Haptics.selectionAsync();

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        showAlert('Error', error.message);
        setLoading(false);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Password Updated', 'Your password has been successfully reset. You are now signed in.', [
        {
          text: 'Continue',
          onPress: () => {
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch {
      showAlert('Error', 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={[styles.checkingText, { color: t.textSecondary }]}>Verifying reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionReady) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.centerContent}>
          <MaterialIcons name="error-outline" size={48} color={t.error} />
          <Text style={[styles.errorTitle, { color: t.textPrimary }]}>Link Expired</Text>
          <Text style={[styles.errorSubtitle, { color: t.textSecondary }]}>
            This password reset link is invalid or has expired. Please request a new one from the login screen.
          </Text>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: t.primary }]}
            onPress={() => router.replace('/login')}
          >
            <Text style={[styles.primaryBtnText, { color: t.background }]}>Back to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: t.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(500)} style={styles.headerSection}>
            <View style={[styles.iconCircle, { backgroundColor: t.primary + '20' }]}>
              <MaterialIcons name="lock-reset" size={40} color={t.primary} />
            </View>
            <Text style={[styles.pageTitle, { color: t.textPrimary }]}>Reset Password</Text>
            <Text style={[styles.pageSubtitle, { color: t.textSecondary }]}>
              Enter your new password below
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={[styles.formCard, { backgroundColor: t.surface, borderColor: t.border }]}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>New Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: t.backgroundSecondary, borderColor: t.border }]}>
                <MaterialIcons name="lock" size={18} color={t.textMuted} />
                <TextInput
                  style={[styles.input, { color: t.textPrimary }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={t.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  selectionColor={t.primary}
                  autoFocus
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={18}
                    color={t.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Confirm New Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: t.backgroundSecondary, borderColor: t.border }]}>
                <MaterialIcons name="lock-outline" size={18} color={t.textMuted} />
                <TextInput
                  style={[styles.input, { color: t.textPrimary }]}
                  placeholder="Re-enter new password"
                  placeholderTextColor={t.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  selectionColor={t.primary}
                />
              </View>
            </View>

            {newPassword.length > 0 ? (
              <View style={styles.strengthRow}>
                <View style={[styles.strengthBar, { backgroundColor: t.border }]}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${Math.min(100, (newPassword.length / 12) * 100)}%`,
                        backgroundColor:
                          newPassword.length < 6
                            ? t.error
                            : newPassword.length < 10
                            ? t.warning
                            : t.success,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    {
                      color:
                        newPassword.length < 6
                          ? t.error
                          : newPassword.length < 10
                          ? t.warning
                          : t.success,
                    },
                  ]}
                >
                  {newPassword.length < 6 ? 'Too short' : newPassword.length < 10 ? 'Fair' : 'Strong'}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.primaryBtn,
                { backgroundColor: t.primary },
                loading && styles.primaryBtnDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={t.background} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: t.background }]}>Update Password</Text>
              )}
            </Pressable>
          </Animated.View>

          <Pressable style={styles.backLink} onPress={() => router.replace('/login')}>
            <MaterialIcons name="arrow-back" size={16} color={t.textSecondary} />
            <Text style={[styles.backLinkText, { color: t.textSecondary }]}>Back to Login</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  checkingText: { fontSize: 14, fontWeight: '500', marginTop: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  errorSubtitle: { fontSize: 14, fontWeight: '400', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  scrollContent: { paddingHorizontal: 24, flexGrow: 1, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  pageSubtitle: { fontSize: 14, fontWeight: '400' },
  formCard: { borderRadius: 16, padding: 24, borderWidth: 1, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    paddingHorizontal: 16, height: 58, gap: 12, borderWidth: 1,
  },
  input: { flex: 1, fontSize: 17, includeFontPadding: false },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 60 },
  primaryBtn: { borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  backLinkText: { fontSize: 13, fontWeight: '500' },
});
