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
import { useAuth, useAlert, getSupabaseClient } from '@/template';
import { useAppTheme } from '../hooks/useTheme';

type AuthMode = 'login' | 'signup';
type SignupStep = 'form' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t, typo } = useAppTheme();
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<AuthMode>('login');
  const [signupStep, setSignupStep] = useState<SignupStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const resetForm = () => { setEmail(''); setPassword(''); setConfirmPassword(''); setOtp(['', '', '', '']); setSignupStep('form'); };
  const switchMode = (newMode: AuthMode) => { Haptics.selectionAsync(); setMode(newMode); resetForm(); };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { showAlert('Missing Fields', 'Please enter your email and password.'); return; }
    Haptics.selectionAsync();
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) showAlert('Login Failed', 'Incorrect email or password. If you forgot your credentials, tap "Forgot Password?" below.');
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { showAlert('Enter Your Email', 'Please enter your email address first, then tap Forgot Password.'); return; }
    setSendingReset(true);
    try {
      const supabase = getSupabaseClient();
      const { data: profile } = await supabase.from('user_profiles').select('username').eq('email', email.trim().toLowerCase()).maybeSingle();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: 'itsnameis://reset-password' });
      if (error) { showAlert('Error', error.message); setSendingReset(false); return; }
      const usernameMsg = profile?.username ? `Your username is: @${profile.username}\n\n` : '';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Recovery Email Sent', `${usernameMsg}A password reset link has been sent to ${email.trim()}. Check your inbox (and spam folder) to set a new password.`);
    } catch { showAlert('Error', 'Something went wrong. Please try again.'); }
    setSendingReset(false);
  };

  const handleSendOTP = async () => {
    if (!email.trim()) { showAlert('Missing Email', 'Please enter your email address.'); return; }
    if (password.length < 6) { showAlert('Weak Password', 'Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { showAlert('Password Mismatch', 'Passwords do not match.'); return; }
    Haptics.selectionAsync();
    const { error } = await sendOTP(email.trim());
    if (error) { showAlert('Error', error); return; }
    setSignupStep('otp');
    showAlert('Code Sent', 'A 4-digit verification code has been sent to your email.');
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const newOtp = [...otp]; newOtp[index - 1] = ''; setOtp(newOtp);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 4) { showAlert('Incomplete Code', 'Please enter the full 4-digit code.'); return; }
    Haptics.selectionAsync();
    const { error } = await verifyOTPAndLogin(email.trim(), code, { password });
    if (error) showAlert('Verification Failed', error);
  };

  const handleResendOTP = async () => {
    Haptics.selectionAsync();
    const { error } = await sendOTP(email.trim());
    if (error) { showAlert('Error', error); } else { showAlert('Code Resent', 'A new verification code has been sent.'); setOtp(['', '', '', '']); }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: t.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(500)} style={styles.logoSection}>
            <Image source={require('../assets/images/icon.png')} style={styles.logo} contentFit="contain" />
            <Text style={[styles.appName, { color: t.primary }]}>its name is.</Text>
            <Text style={[styles.appTagline, { color: t.textSecondary }]}>Snap. Name. Vote.</Text>
          </Animated.View>

          {mode === 'signup' && signupStep === 'otp' ? (
            <Animated.View entering={FadeInUp.duration(400)} style={[styles.formCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.otpHeader}>
                <Pressable onPress={() => setSignupStep('form')} style={[styles.otpBackBtn, { backgroundColor: t.backgroundSecondary }]}>
                  <MaterialIcons name="arrow-back" size={20} color={t.textSecondary} />
                </Pressable>
                <Text style={[styles.formTitle, { color: t.textPrimary }]}>Verify Email</Text>
                <View style={{ width: 36 }} />
              </View>
              <Text style={[styles.otpSubtitle, { color: t.textSecondary }]}>
                Enter the 4-digit code sent to{'\n'}<Text style={{ color: t.primary, fontWeight: '600' }}>{email}</Text>
              </Text>
              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput key={i} ref={(ref) => { otpRefs.current[i] = ref; }}
                    style={[styles.otpInput, { backgroundColor: t.backgroundSecondary, borderColor: t.border, color: t.textPrimary }, digit ? { borderColor: t.primary } : null]}
                    value={digit} onChangeText={(val) => handleOtpChange(val.replace(/[^0-9]/g, ''), i)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad" maxLength={1} selectionColor={t.primary} />
                ))}
              </View>
              <Pressable style={[styles.primaryBtn, { backgroundColor: t.primary }, operationLoading && styles.primaryBtnDisabled]} onPress={handleVerifyOTP} disabled={operationLoading}>
                <Text style={[styles.primaryBtnText, { color: t.background }]}>{operationLoading ? 'Verifying...' : 'Create Account'}</Text>
              </Pressable>
              <Pressable onPress={handleResendOTP} disabled={operationLoading} style={styles.resendBtn}>
                <Text style={[styles.resendText, { color: t.textSecondary }]}>Did not receive a code? </Text>
                <Text style={[styles.resendLink, { color: t.primary }]}>Resend</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={[styles.formCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.formTitle, { color: t.textPrimary }]}>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
              <Text style={[styles.formSubtitle, { color: t.textSecondary }]}>{mode === 'login' ? 'Sign in to continue naming objects' : 'Join the community and start snapping'}</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Email</Text>
                <View style={[styles.inputWrap, { backgroundColor: t.backgroundSecondary, borderColor: t.border }]}>
                  <MaterialIcons name="email" size={18} color={t.textMuted} />
                  <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="you@example.com" placeholderTextColor={t.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} selectionColor={t.primary} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Password</Text>
                <View style={[styles.inputWrap, { backgroundColor: t.backgroundSecondary, borderColor: t.border }]}>
                  <MaterialIcons name="lock" size={18} color={t.textMuted} />
                  <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="Min. 6 characters" placeholderTextColor={t.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} selectionColor={t.primary} />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}><MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={18} color={t.textMuted} /></Pressable>
                </View>
              </View>

              {mode === 'signup' ? (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Confirm Password</Text>
                  <View style={[styles.inputWrap, { backgroundColor: t.backgroundSecondary, borderColor: t.border }]}>
                    <MaterialIcons name="lock-outline" size={18} color={t.textMuted} />
                    <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="Re-enter password" placeholderTextColor={t.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} selectionColor={t.primary} />
                  </View>
                </View>
              ) : null}

              <Pressable style={[styles.primaryBtn, { backgroundColor: t.primary }, operationLoading && styles.primaryBtnDisabled]} onPress={mode === 'login' ? handleLogin : handleSendOTP} disabled={operationLoading}>
                <Text style={[styles.primaryBtnText, { color: t.background }]}>{operationLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Continue'}</Text>
              </Pressable>

              {mode === 'login' ? (
                <Pressable style={styles.forgotBtn} onPress={handleForgotPassword} disabled={sendingReset || operationLoading}>
                  <MaterialIcons name="help-outline" size={14} color={t.accent} />
                  <Text style={[styles.forgotText, { color: t.accent }, sendingReset && { opacity: 0.5 }]}>{sendingReset ? 'Sending...' : 'Forgot Password?'}</Text>
                </Pressable>
              ) : null}

              <View style={styles.switchRow}>
                <Text style={[styles.switchText, { color: t.textSecondary }]}>{mode === 'login' ? 'New here? ' : 'Already have an account? '}</Text>
                <Pressable onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                  <Text style={[styles.switchLink, { color: t.primary }]}>{mode === 'login' ? 'Create Account' : 'Sign In'}</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(400).duration(300)} style={styles.footerRow}>
            <Text style={[styles.footer, { color: t.textMuted }]}>By continuing, you agree to our </Text>
            <Pressable onPress={() => router.push('/terms')}><Text style={[styles.footerLink, { color: t.primary }]}>Terms of Service</Text></Pressable>
            <Text style={[styles.footer, { color: t.textMuted }]}> and </Text>
            <Pressable onPress={() => router.push('/privacy')}><Text style={[styles.footerLink, { color: t.primary }]}>Privacy Policy</Text></Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, flexGrow: 1, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 80, height: 80, borderRadius: 20, marginBottom: 16 },
  appName: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  appTagline: { fontSize: 14, fontWeight: '400' },
  formCard: { borderRadius: 16, padding: 24, borderWidth: 1, marginBottom: 20 },
  formTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  formSubtitle: { fontSize: 13, fontWeight: '400', textAlign: 'center', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, height: 50, gap: 10, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, includeFontPadding: false },
  primaryBtn: { borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { fontSize: 13, fontWeight: '400' },
  switchLink: { fontSize: 13, fontWeight: '600' },
  otpHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  otpBackBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  otpSubtitle: { fontSize: 13, fontWeight: '400', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  otpInput: { width: 56, height: 60, borderRadius: 12, borderWidth: 2, textAlign: 'center', fontSize: 24, fontWeight: '700', includeFontPadding: false },
  resendBtn: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  resendText: { fontSize: 13, fontWeight: '400' },
  resendLink: { fontSize: 13, fontWeight: '600' },
  forgotBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 6 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  footer: { fontSize: 11, fontWeight: '500', lineHeight: 18 },
  footerLink: { fontSize: 11, fontWeight: '600', lineHeight: 18 },
});
