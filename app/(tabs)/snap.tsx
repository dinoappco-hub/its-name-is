import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { config, CATEGORIES } from '../../constants/config';
import { useApp } from '../../contexts/AppContext';
import { useRouter } from 'expo-router';

const { width: SCREEN_W } = Dimensions.get('window');

export default function SnapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addSubmission, submissionsToday } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('random');

  const selectableCategories = CATEGORIES.filter(c => c.key !== 'all');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useAlert();
  const canSubmit = submissionsToday < config.submissionsPerDay;
  const remaining = config.submissionsPerDay - submissionsToday;

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);

  const openCamera = async () => {
    // On web, use ImagePicker camera (browser webcam) since CameraView is native-only
    if (Platform.OS === 'web') {
      try {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          showAlert('Permission Needed', 'Camera access is required to snap objects. Please enable it in your browser settings.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
        if (!result.canceled && result.assets[0]) {
          setImageUri(result.assets[0].uri);
          setSubmitted(false);
          Haptics.selectionAsync();
        }
      } catch {
        showAlert('Camera Unavailable', 'Camera is not available in this browser. Please use the gallery upload or try on a real device.');
      }
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showAlert('Permission Needed', 'Camera access is required to snap objects. Please enable it in your device settings.');
        return;
      }
    }
    Haptics.selectionAsync();
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setImageUri(photo.uri);
        setShowCamera(false);
        setSubmitted(false);
      }
    } catch {
      showAlert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const toggleFacing = () => {
    Haptics.selectionAsync();
    setFacing(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert('Permission needed', 'Gallery access is required to upload objects.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setShowCamera(false);
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
    const { error } = await addSubmission(imageUri, name.trim(), description.trim() || 'Community submission', category);
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
    setCategory('random');
    setSubmitted(false);
  };

  // ─── Success Screen ───
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

  // ─── Live Camera View ───
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.cameraView}
          facing={facing}
        >
          {/* Top bar */}
          <SafeAreaView edges={['top']} style={styles.cameraTopBar}>
            <Pressable
              style={styles.cameraTopBtn}
              onPress={() => {
                Haptics.selectionAsync();
                setShowCamera(false);
              }}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </Pressable>
            <View style={styles.cameraLimitBadge}>
              <Text style={styles.cameraLimitText}>
                {remaining > 0 ? `${remaining} left today` : 'Limit reached'}
              </Text>
            </View>
            <Pressable style={styles.cameraTopBtn} onPress={toggleFacing}>
              <MaterialIcons name="flip-camera-ios" size={24} color="#fff" />
            </Pressable>
          </SafeAreaView>

          {/* Center guide frame */}
          <View style={styles.cameraGuide}>
            <View style={styles.cameraFrame}>
              <View style={[styles.cameraCorner, styles.cameraCornerTL]} />
              <View style={[styles.cameraCorner, styles.cameraCornerTR]} />
              <View style={[styles.cameraCorner, styles.cameraCornerBL]} />
              <View style={[styles.cameraCorner, styles.cameraCornerBR]} />
            </View>
            <Text style={styles.cameraHint}>Center your object</Text>
          </View>

          {/* Bottom controls */}
          <SafeAreaView edges={['bottom']} style={styles.cameraBottomBar}>
            <Pressable style={styles.cameraGalleryBtn} onPress={pickFromGallery}>
              <MaterialIcons name="photo-library" size={26} color="#fff" />
              <Text style={styles.cameraGalleryText}>Gallery</Text>
            </Pressable>

            <Pressable
              style={[styles.captureBtn, capturing && styles.captureBtnActive]}
              onPress={capturePhoto}
              disabled={capturing}
            >
              <View style={styles.captureBtnInner}>
                {capturing ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <View style={styles.captureBtnDot} />
                )}
              </View>
            </Pressable>

            <View style={styles.cameraGalleryBtn}>
              {/* Spacer for symmetry */}
              <MaterialIcons name="flip-camera-ios" size={26} color="transparent" />
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // ─── Main Form / Picker Screen ───
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
            <Animated.View entering={FadeIn.duration(400)}>
              {/* Camera Card */}
              <Pressable style={styles.cameraCard} onPress={openCamera}>
                <View style={styles.cameraCardIcon}>
                  <MaterialIcons name="camera-alt" size={48} color={theme.primary} />
                </View>
                <Text style={styles.cameraCardTitle}>Open Camera</Text>
                <Text style={styles.cameraCardSubtitle}>Use the live viewfinder to snap your object</Text>
                <View style={styles.cameraCardBadge}>
                  <MaterialIcons name="videocam" size={14} color={theme.primary} />
                  <Text style={styles.cameraCardBadgeText}>Live Preview</Text>
                </View>
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Gallery Card */}
              <Pressable style={styles.galleryCard} onPress={pickFromGallery}>
                <View style={styles.galleryCardIcon}>
                  <MaterialIcons name="photo-library" size={32} color={theme.accent} />
                </View>
                <View style={styles.galleryCardText}>
                  <Text style={styles.galleryCardTitle}>Upload from Gallery</Text>
                  <Text style={styles.galleryCardSubtitle}>Choose a photo from your library</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)}>
              <View style={styles.previewWrap}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
                <Pressable style={styles.removeBtn} onPress={() => { setImageUri(null); Haptics.selectionAsync(); }}>
                  <MaterialIcons name="close" size={20} color="#fff" />
                </Pressable>
                <Pressable
                  style={styles.retakeBtn}
                  onPress={() => {
                    setImageUri(null);
                    openCamera();
                  }}
                >
                  <MaterialIcons name="camera-alt" size={16} color="#fff" />
                  <Text style={styles.retakeBtnText}>Retake</Text>
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
                <Text style={styles.label}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {selectableCategories.map((cat) => {
                    const selected = category === cat.key;
                    return (
                      <Pressable
                        key={cat.key}
                        style={[styles.categoryChip, selected && { backgroundColor: cat.color, borderColor: cat.color }]}
                        onPress={() => { Haptics.selectionAsync(); setCategory(cat.key); }}
                      >
                        <MaterialIcons name={cat.icon} size={16} color={selected ? '#fff' : cat.color} />
                        <Text style={[styles.categoryChipText, selected && { color: '#fff' }]}>{cat.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
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
                  {submitting ? 'Uploading...' : canSubmit ? 'Submit to Community' : 'Limit Reached'}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const FRAME_SIZE = SCREEN_W * 0.65;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  pageTitle: { ...typography.subtitle },
  limitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radiusFull },
  limitText: { ...typography.small, color: theme.textSecondary },

  // Camera Card
  cameraCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.border,
    marginTop: 16,
  },
  cameraCardIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cameraCardTitle: { ...typography.subtitle, fontSize: 20, marginBottom: 6 },
  cameraCardSubtitle: { ...typography.caption, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  cameraCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: theme.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  cameraCardBadgeText: { ...typography.small, color: theme.primary, fontWeight: '700' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, paddingHorizontal: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { ...typography.caption, color: theme.textMuted, marginHorizontal: 16, fontSize: 13 },

  // Gallery Card
  galleryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14,
  },
  galleryCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(124,92,252,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCardText: { flex: 1 },
  galleryCardTitle: { ...typography.bodyBold, fontSize: 15, marginBottom: 2 },
  galleryCardSubtitle: { ...typography.small, color: theme.textSecondary },

  // Live Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraView: { flex: 1 },
  cameraTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  cameraTopBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLimitBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.radiusFull,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  cameraLimitText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Camera Guide
  cameraGuide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  cameraCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: 'rgba(255,215,0,0.8)',
  },
  cameraCornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cameraCornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cameraCornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cameraCornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  cameraHint: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom Controls
  cameraBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraGalleryBtn: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  cameraGalleryText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captureBtnActive: { opacity: 0.6 },
  captureBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
  },

  // Preview
  previewWrap: { borderRadius: theme.radiusLarge, overflow: 'hidden', marginBottom: 20 },
  previewImage: { width: '100%', aspectRatio: 1, borderRadius: theme.radiusLarge },
  removeBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  retakeBtn: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: theme.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retakeBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Form
  formGroup: { marginBottom: 16 },
  label: { ...typography.captionBold, marginBottom: 8 },
  input: { backgroundColor: theme.surface, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  charCount: { ...typography.small, textAlign: 'right', marginTop: 4 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, borderRadius: theme.radiusMedium, height: 52, marginTop: 8 },
  submitBtnDisabled: { opacity: 0.4 },
  categoryScroll: { gap: 8, paddingBottom: 4 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: theme.radiusFull,
    backgroundColor: theme.surface,
    borderWidth: 1.5, borderColor: theme.border,
  },
  categoryChipText: { ...typography.small, fontWeight: '600', color: theme.textSecondary },
  submitBtnText: { ...typography.button },

  // Success
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
