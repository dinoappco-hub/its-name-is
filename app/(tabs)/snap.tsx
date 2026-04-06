import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { config } from '../../constants/config';
import { useApp } from '../../contexts/AppContext';
import { useRouter } from 'expo-router';

export default function SnapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addSubmission, submissionsToday } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useAlert();
  const canSubmit = submissionsToday < config.submissionsPerDay;
  const remaining = config.submissionsPerDay - submissionsToday;

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          showAlert('Permission needed', 'Camera access is required to snap objects.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          showAlert('Permission needed', 'Gallery access is required to upload objects.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
      }
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setSubmitted(false);
        Haptics.selectionAsync();
      }
    } catch {
      showAlert('Error', 'Could not access your photos.');
    }
  };

  const handleSubmit = async () => {
    if (!imageUri || !name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert('Missing info', 'Please add a photo and a name.');
      return;
    }
    if (!canSubmit) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert('Limit Reached', 'You have reached your daily submission limit. Try again tomorrow!');
      return;
    }

    setSubmitting(true);
    const { error } = await addSubmission(imageUri, name.trim(), description.trim() || 'Community submission');
    setSubmitting(false);

    if (error) {
      showAlert('Upload Failed', error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  };

  const resetForm = () => {
    setImageUri(null);
    setName('');
    setDescription('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View entering={ZoomIn.duration(500)}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check-circle" size={80} color={theme.success} />
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInUp.delay(300)} style={styles.successTitle}>
            Submitted!
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(450)} style={styles.successSubtitle}>
            Your object is live. The community can now name it.
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(600)} style={styles.successActions}>
            <Pressable style={styles.primaryBtn} onPress={resetForm}>
              <MaterialIcons name="camera-alt" size={20} color={theme.background} />
              <Text style={styles.primaryBtnText}>Snap Another</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.navigate('/(tabs)')}>
              <Text style={styles.secondaryBtnText}>View Feed</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Snap It</Text>
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>
                {remaining > 0 ? `${remaining} left today` : 'Limit reached'}
              </Text>
            </View>
          </View>

          {!imageUri ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.pickSection}>
              <Pressable style={styles.pickOption} onPress={() => pickImage('camera')}>
                <View style={[styles.pickIconCircle, { backgroundColor: 'rgba(255,215,0,0.12)' }]}>
                  <MaterialIcons name="camera-alt" size={40} color={theme.primary} />
                </View>
                <Text style={styles.pickTitle}>Take Photo</Text>
                <Text style={styles.pickSubtitle}>Use your camera</Text>
              </Pressable>
              <Pressable style={styles.pickOption} onPress={() => pickImage('gallery')}>
                <View style={[styles.pickIconCircle, { backgroundColor: 'rgba(124,92,252,0.12)' }]}>
                  <MaterialIcons name="photo-library" size={40} color={theme.accent} />
                </View>
                <Text style={styles.pickTitle}>Upload</Text>
                <Text style={styles.pickSubtitle}>From gallery</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)}>
              <View style={styles.previewWrap}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
                <Pressable style={styles.removeBtn} onPress={() => { setImageUri(null); Haptics.selectionAsync(); }}>
                  <MaterialIcons name="close" size={20} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name this object *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Give it a creative name..."
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                />
                <Text style={styles.charCount}>{name.length}/50</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What is this object?"
                  placeholderTextColor={theme.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={150}
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.charCount}>{description.length}/150</Text>
              </View>

              <Pressable
                style={[styles.submitBtn, (!name.trim() || !canSubmit || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.background} />
                ) : (
                  <MaterialIcons name="send" size={20} color={theme.background} />
                )}
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Uploading...' : canSubmit ? 'Submit to Community' : 'Upgrade to Submit'}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  pageTitle: { ...typography.subtitle },
  limitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radiusFull },
  limitText: { ...typography.small, color: theme.textSecondary },
  pickSection: { flexDirection: 'row', gap: 12, marginTop: 40 },
  pickOption: { flex: 1, backgroundColor: theme.surface, borderRadius: theme.radiusLarge, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  pickIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  pickTitle: { ...typography.bodyBold, marginBottom: 4 },
  pickSubtitle: { ...typography.caption },
  previewWrap: { borderRadius: theme.radiusLarge, overflow: 'hidden', marginBottom: 20 },
  previewImage: { width: '100%', aspectRatio: 1, borderRadius: theme.radiusLarge },
  removeBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  formGroup: { marginBottom: 16 },
  label: { ...typography.captionBold, marginBottom: 8 },
  input: { backgroundColor: theme.surface, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  charCount: { ...typography.small, textAlign: 'right', marginTop: 4 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, borderRadius: theme.radiusMedium, height: 52, marginTop: 8 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { ...typography.button },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon: { marginBottom: 20 },
  successTitle: { ...typography.title, marginBottom: 8 },
  successSubtitle: { ...typography.body, color: theme.textSecondary, textAlign: 'center', marginBottom: 32 },
  successActions: { width: '100%', gap: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, borderRadius: theme.radiusMedium, height: 52 },
  primaryBtnText: { ...typography.button },
  secondaryBtn: { alignItems: 'center', justifyContent: 'center', borderRadius: theme.radiusMedium, height: 48, borderWidth: 1, borderColor: theme.border },
  secondaryBtnText: { ...typography.bodyBold, color: theme.textSecondary },
});
