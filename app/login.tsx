import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth, useAlert } from '@/template';
import { theme, typography } from '../constants/theme';

type AuthMode = 'login' | 'signup';
type SignupStep = 'form' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<AuthMode>('login');
  const [signupStep, setSignupStep] = useState<SignupStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp(['', '', '', '']);
    setSignupStep('form');
  };

  const switchMode = (newMode: AuthMode) => {
    Haptics.selectionAsync();
    setMode(newMode);
    resetForm();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    Haptics.selectionAsync();
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      showAlert('Login Failed', error);
    }
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      showAlert('Missing Email', 'Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    Haptics.selectionAsync();
    const { error } = await sendOTP(email.trim());
    if (error) {
      showAlert('Error', error);
      return;
    }
    setSignupStep('otp');
    showAlert('Code Sent', 'A 4-digit verification code has been sent to your email.');
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 4) {
      showAlert('Incomplete Code', 'Please enter the full 4-digit code.');
      return;
    }
    Haptics.selectionAsync();
    const { error } = await verifyOTPAndLogin(email.trim(), code, { password });
    if (error) {
      showAlert('Verification Failed', error);
    }
  };

  const handleResendOTP = async () => {
    Haptics.selectionAsync();
    const { error } = await sendOTP(email.trim());
    if (error) {
      showAlert('Error', error);
    } else {
      showAlert('Code Resent', 'A new verification code has been sent.');
      setOtp(['', '', '', '']);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.logoSection}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.appName}>its name is.</Text>
            <Text style={styles.appTagline}>Snap. Name. Vote.</Text>
          </Animated.View>

          {/* Sign-up OTP Step */}
          {mode === 'signup' && signupStep === 'otp' ? (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.formCard}>
              <View style={styles.otpHeader}>
                <Pressable onPress={() => setSignupStep('form')} style={styles.otpBackBtn}>
                  <MaterialIcons name="arrow-back" size={20} color={theme.textSecondary} />
                </Pressable>
                <Text style={styles.formTitle}>Verify Email</Text>
                <View style={{ width: 36 }} />
              </View>
              <Text style={styles.otpSubtitle}>
                Enter the 4-digit code sent to{'\n'}
                <Text style={styles.otpEmail}>{email}</Text>
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { otpRefs.current[i] = ref; }}
                    style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                    value={digit}
                    onChangeText={(val) => handleOtpChange(val.replace(/[^0-9]/g, ''), i)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectionColor={theme.primary}
                    placeholderTextColor={theme.textMuted}
                  />
                ))}
              </View>

              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.primaryBtnDisabled]}
                onPress={handleVerifyOTP}
                disabled={operationLoading}
              >
                <Text style={styles.primaryBtnText}>
                  {operationLoading ? 'Verifying...' : 'Create Account'}
                </Text>
              </Pressable>

              <Pressable onPress={handleResendOTP} disabled={operationLoading} style={styles.resendBtn}>
                <Text style={styles.resendText}>Did not receive a code? </Text>
                <Text style={styles.resendLink}>Resend</Text>
              </Pressable>
            </Animated.View>
          ) : (
            /* Login / Sign-up Form */
            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.formCard}>
              <Text style={styles.formTitle}>
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={styles.formSubtitle}>
                {mode === 'login'
                  ? 'Sign in to continue naming objects'
                  : 'Join the community and start snapping'}
              </Text>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="email" size={18} color={theme.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={theme.primary}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="lock" size={18} color={theme.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={theme.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    selectionColor={theme.primary}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={18}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password (signup only) */}
              {mode === 'signup' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputWrap}>
                    <MaterialIcons name="lock-outline" size={18} color={theme.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      placeholderTextColor={theme.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      selectionColor={theme.primary}
                    />
                  </View>
                </View>
              ) : null}

              {/* Primary Action */}
              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.primaryBtnDisabled]}
                onPress={mode === 'login' ? handleLogin : handleSendOTP}
                disabled={operationLoading}
              >
                <Text style={styles.primaryBtnText}>
                  {operationLoading
                    ? 'Please wait...'
                    : mode === 'login'
                      ? 'Sign In'
                      : 'Continue'}
                </Text>
              </Pressable>

              {/* Switch mode */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {mode === 'login' ? 'New here? ' : 'Already have an account? '}
                </Text>
                <Pressable onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                  <Text style={styles.switchLink}>
                    {mode === 'login' ? 'Create Account' : 'Sign In'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Footer */}
          <Animated.View entering={FadeInUp.delay(400).duration(300)} style={styles.footerRow}>
            <Text style={styles.footer}>By continuing, you agree to our </Text>
            <Pressable onPress={() => router.push('/terms')}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.footer}> and </Text>
            <Pressable onPress={() => router.push('/privacy')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingHorizontal: 24, flexGrow: 1, justifyContent: 'center' },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 80, height: 80, borderRadius: 20, marginBottom: 16 },
  appName: { fontSize: 28, fontWeight: '700', color: theme.primary, marginBottom: 4 },
  appTagline: { ...typography.caption, fontSize: 14 },

  // Form Card
  formCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  formTitle: { ...typography.subtitle, textAlign: 'center', marginBottom: 4 },
  formSubtitle: { ...typography.caption, textAlign: 'center', marginBottom: 24 },

  // Inputs
  inputGroup: { marginBottom: 16 },
  inputLabel: { ...typography.captionBold, color: theme.textSecondary, marginBottom: 6, marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.radiusMedium,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.textPrimary,
    includeFontPadding: false,
  },

  // Primary Button
  primaryBtn: {
    backgroundColor: theme.primary,
    borderRadius: theme.radiusMedium,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...typography.button, fontSize: 16 },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { ...typography.caption },
  switchLink: { ...typography.captionBold, color: theme.primary },

  // OTP
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  otpBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  otpSubtitle: { ...typography.caption, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  otpEmail: { color: theme.primary, fontWeight: '600' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  otpInput: {
    width: 56, height: 60, borderRadius: theme.radiusMedium,
    backgroundColor: theme.backgroundSecondary,
    borderWidth: 2, borderColor: theme.border,
    textAlign: 'center', fontSize: 24, fontWeight: '700',
    color: theme.textPrimary,
    includeFontPadding: false,
  },
  otpInputFilled: { borderColor: theme.primary },
  resendBtn: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  resendText: { ...typography.caption },
  resendLink: { ...typography.captionBold, color: theme.primary },

  // Footer
  footerRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    ...typography.small,
    color: theme.textMuted,
    lineHeight: 18,
  },
  footerLink: {
    ...typography.small,
    color: theme.primary,
    fontWeight: '600',
    lineHeight: 18,
  },
});
