import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Dimensions, Image as RNImage, LayoutChangeEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useAlert } from '@/template';
import { CATEGORIES } from '../../constants/config';
import { useApp } from '../../contexts/AppContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppTheme } from '../../hooks/useTheme';
import CropOverlay from '../../components/CropOverlay';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function SnapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t, typo } = useAppTheme();
  const { addSubmission } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('random');

  const selectableCategories = CATEGORIES.filter(c => c.key !== 'all');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useAlert();


  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermDenied, setCameraPermDenied] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);

  // Crop/Edit state
  const [rawImageUri, setRawImageUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerLayout, setContainerLayout] = useState<{ width: number; height: number } | null>(null);

  // Get natural image dimensions when rawImageUri changes
  useEffect(() => {
    if (rawImageUri) {
      RNImage.getSize(
        rawImageUri,
        (w, h) => setImageNaturalSize({ width: w, height: h }),
        () => setImageNaturalSize({ width: 1080, height: 1080 })
      );
    } else {
      setImageNaturalSize(null);
    }
  }, [rawImageUri]);

  // Calculate where the image is actually displayed (contentFit="contain")
  const imageRect = useMemo(() => {
    if (!imageNaturalSize || !containerLayout) return null;
    const cw = containerLayout.width;
    const ch = containerLayout.height;
    const iw = imageNaturalSize.width;
    const ih = imageNaturalSize.height;
    const containerAspect = cw / ch;
    const imageAspect = iw / ih;
    let dw: number, dh: number, dx: number, dy: number;
    if (imageAspect > containerAspect) {
      dw = cw;
      dh = cw / imageAspect;
      dx = 0;
      dy = (ch - dh) / 2;
    } else {
      dh = ch;
      dw = ch * imageAspect;
      dx = (cw - dw) / 2;
      dy = 0;
    }
    return { x: dx, y: dy, width: Math.max(1, dw), height: Math.max(1, dh) };
  }, [imageNaturalSize, containerLayout]);

  const openCamera = async (silent = false) => {
    if (Platform.OS === 'web') {
      try {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          setCameraPermDenied(true);
          if (!silent) showAlert('Permission Needed', 'Camera access is required to snap objects. Please enable it in your browser settings.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
        if (!result.canceled && result.assets[0]) {
          setImageUri(result.assets[0].uri);
          setSubmitted(false);
          Haptics.selectionAsync();
        }
      } catch {
        setCameraPermDenied(true);
        if (!silent) showAlert('Camera Unavailable', 'Camera is not available in this browser. Please use the gallery upload or try on a real device.');
      }
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setCameraPermDenied(true);
        if (!silent) showAlert('Permission Needed', 'Camera access is required to snap objects. Please enable it in your device settings.');
        return;
      }
    }
    setCameraPermDenied(false);
    Haptics.selectionAsync();
    setShowCamera(true);
  };

  // Auto-open camera when tab is focused and no image is selected
  const autoOpenRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!imageUri && !rawImageUri && !submitted && !showCamera && !cameraPermDenied) {
        autoOpenRef.current = true;
      }
      return () => { autoOpenRef.current = false; };
    }, [imageUri, rawImageUri, submitted, showCamera, cameraPermDenied])
  );

  useEffect(() => {
    if (autoOpenRef.current && !imageUri && !rawImageUri && !submitted && !showCamera && !cameraPermDenied) {
      autoOpenRef.current = false;
      openCamera(true);
    }
  }, [imageUri, rawImageUri, submitted, showCamera, cameraPermDenied]);

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRawImageUri(photo.uri);
        setShowCamera(false);
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
        setRawImageUri(result.assets[0].uri);
        setShowCamera(false);
        setSubmitted(false);
        Haptics.selectionAsync();
      }
    } catch {
      showAlert('Error', 'Could not access your photos.');
    }
  };

  // Crop actions
  const handleCropConfirm = async () => {
    if (!rawImageUri) return;
    setProcessing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        rawImageUri,
        [{ resize: { width: 1080 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(result.uri);
      setRawImageUri(null);
      setSubmitted(false);
    } catch {
      showAlert('Error', 'Failed to process image. Please try again.');
    }
    setProcessing(false);
  };

  const handleCropRetake = () => {
    setRawImageUri(null);
    openCamera();
  };

  const handleCropRegion = async (region: { x: number; y: number; w: number; h: number }) => {
    if (!rawImageUri || !imageNaturalSize || !imageRect) return;
    setProcessing(true);
    setCropMode(false);
    try {
      const scaleX = imageNaturalSize.width / imageRect.width;
      const scaleY = imageNaturalSize.height / imageRect.height;
      const originX = Math.max(0, Math.round(region.x * scaleX));
      const originY = Math.max(0, Math.round(region.y * scaleY));
      const width = Math.min(imageNaturalSize.width - originX, Math.round(region.w * scaleX));
      const height = Math.min(imageNaturalSize.height - originY, Math.round(region.h * scaleY));

      const result = await ImageManipulator.manipulateAsync(
        rawImageUri,
        [{ crop: { originX, originY, width: Math.max(1, width), height: Math.max(1, height) } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      setRawImageUri(result.uri);
    } catch {
      showAlert('Error', 'Failed to crop image.');
    }
    setProcessing(false);
  };

  const handleCropRotate = async () => {
    if (!rawImageUri) return;
    setProcessing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        rawImageUri,
        [{ rotate: 90 }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setRawImageUri(result.uri);
    } catch {
      showAlert('Error', 'Failed to rotate image.');
    }
    setProcessing(false);
  };

  const handleSubmit = async () => {
    if (!imageUri || !name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert('Missing info', 'Please add a photo and a name.');
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
    setRawImageUri(null);
    setName('');
    setDescription('');
    setCategory('random');
    setSubmitted(false);
    setCameraPermDenied(false);
    // Trigger auto-open on next render
    autoOpenRef.current = true;
  };

  const styles = useMemo(() => createStyles(t, typo), [t, typo]);
  const FRAME_SIZE = SCREEN_W * 0.65;

  // ─── Success Screen ───
  if (submitted) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.successContainer}>
          <Animated.View entering={ZoomIn.duration(500)}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check-circle" size={80} color={t.success} />
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInUp.delay(300)} style={[styles.successTitle, { color: t.textPrimary }]}>
            Submitted!
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(450)} style={[styles.successSubtitle, { color: t.textSecondary }]}>
            Your object is live. The community can now name it.
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(600)} style={styles.successActions}>
            <Pressable style={[styles.primaryBtn, { backgroundColor: t.primary }]} onPress={resetForm}>
              <MaterialIcons name="camera-alt" size={20} color={t.background} />
              <Text style={[styles.primaryBtnText, { color: t.background }]}>Snap Another</Text>
            </Pressable>
            <Pressable style={[styles.secondaryBtn, { borderColor: t.border }]} onPress={() => router.navigate('/(tabs)')}>
              <Text style={[styles.secondaryBtnText, { color: t.textSecondary }]}>View Feed</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Crop/Edit Screen ───
  if (rawImageUri) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <SafeAreaView edges={['top']} style={styles.cropTopBar}>
          <Pressable
            style={styles.cropTopBtn}
            onPress={() => { Haptics.selectionAsync(); setRawImageUri(null); }}
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.cropTitle}>Adjust Photo</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        <View
          style={styles.cropImageContainer}
          onLayout={(e: LayoutChangeEvent) => {
            const { width: lw, height: lh } = e.nativeEvent.layout;
            setContainerLayout({ width: lw, height: lh });
          }}
        >
          <Image
            source={{ uri: rawImageUri }}
            style={styles.cropImage}
            contentFit="contain"
            transition={200}
          />
          {processing ? (
            <View style={styles.cropProcessingOverlay}>
              <ActivityIndicator size="large" color={t.primary} />
            </View>
          ) : null}
          {cropMode && imageRect ? (
            <CropOverlay
              imageRect={imageRect}
              onConfirm={handleCropRegion}
              onCancel={() => setCropMode(false)}
              primaryColor={t.primary}
            />
          ) : null}
        </View>

        {/* Edit Tools */}
        {!cropMode ? (
        <View style={styles.cropToolBar}>
          <Pressable style={styles.cropToolBtn} onPress={() => { if (!processing && imageRect) setCropMode(true); }} disabled={processing || !imageRect}>
            <MaterialIcons name="crop" size={24} color="#fff" />
            <Text style={styles.cropToolText}>Crop</Text>
          </Pressable>
          <Pressable style={styles.cropToolBtn} onPress={handleCropRotate} disabled={processing}>
            <MaterialIcons name="rotate-right" size={24} color="#fff" />
            <Text style={styles.cropToolText}>Rotate</Text>
          </Pressable>
          <Pressable
            style={styles.cropToolBtn}
            onPress={handleCropRetake}
            disabled={processing}
          >
            <MaterialIcons name="camera-alt" size={24} color="#fff" />
            <Text style={styles.cropToolText}>Retake</Text>
          </Pressable>
          <Pressable
            style={styles.cropToolBtn}
            onPress={async () => {
              if (!rawImageUri) return;
              setProcessing(true);
              try {
                const result = await ImageManipulator.manipulateAsync(
                  rawImageUri,
                  [{ flip: ImageManipulator.FlipType.Horizontal }],
                  { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
                );
                setRawImageUri(result.uri);
              } catch {}
              setProcessing(false);
            }}
            disabled={processing}
          >
            <MaterialIcons name="flip" size={24} color="#fff" />
            <Text style={styles.cropToolText}>Flip</Text>
          </Pressable>
        </View>
        ) : null}

        {!cropMode ? (
        <SafeAreaView edges={['bottom']} style={styles.cropBottomBar}>
          <Pressable
            style={[styles.cropConfirmBtn, processing && { opacity: 0.5 }]}
            onPress={handleCropConfirm}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color={t.background} />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color={t.background} />
                <Text style={[styles.cropConfirmText, { color: t.background }]}>Use This Photo</Text>
              </>
            )}
          </Pressable>
        </SafeAreaView>
        ) : null}
      </View>
    );
  }

  // ─── Live Camera View ───
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.cameraView} facing={facing}>
          <SafeAreaView edges={['top']} style={styles.cameraTopBar}>
            <Pressable style={styles.cameraTopBtn} onPress={() => { Haptics.selectionAsync(); setShowCamera(false); }}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </Pressable>
<View style={{ width: 44 }} />
            <Pressable style={styles.cameraTopBtn} onPress={toggleFacing}>
              <MaterialIcons name="flip-camera-ios" size={24} color="#fff" />
            </Pressable>
          </SafeAreaView>

          <View style={styles.cameraGuide}>
            <View style={[styles.cameraFrame, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
              <View style={[styles.cameraCorner, styles.cameraCornerTL]} />
              <View style={[styles.cameraCorner, styles.cameraCornerTR]} />
              <View style={[styles.cameraCorner, styles.cameraCornerBL]} />
              <View style={[styles.cameraCorner, styles.cameraCornerBR]} />
            </View>
            <Text style={styles.cameraHint}>Center your object</Text>
          </View>

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
                  <ActivityIndicator size="small" color={t.primary} />
                ) : (
                  <View style={styles.captureBtnDot} />
                )}
              </View>
            </Pressable>

            <View style={styles.cameraGalleryBtn}>
              <MaterialIcons name="flip-camera-ios" size={26} color="transparent" />
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // ─── Main Form / Picker Screen ───
  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.pageTitle, { color: t.textPrimary }]}>Snap It</Text>

          </View>

          {!imageUri ? (
            <Animated.View entering={FadeIn.duration(400)}>
              <Pressable style={[styles.cameraCard, { backgroundColor: t.surface, borderColor: t.border }]} onPress={openCamera}>
                <View style={styles.cameraCardIcon}>
                  <MaterialIcons name="camera-alt" size={48} color={t.primary} />
                </View>
                <Text style={[styles.cameraCardTitle, { color: t.textPrimary }]}>Open Camera</Text>
                <Text style={[styles.cameraCardSubtitle, { color: t.textSecondary }]}>Use the live viewfinder to snap your object</Text>
                <View style={styles.cameraCardBadge}>
                  <MaterialIcons name="videocam" size={14} color={t.primary} />
                  <Text style={[styles.cameraCardBadgeText, { color: t.primary }]}>Live Preview</Text>
                </View>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
                <Text style={[styles.dividerText, { color: t.textMuted }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
              </View>

              <Pressable style={[styles.galleryCard, { backgroundColor: t.surface, borderColor: t.border }]} onPress={pickFromGallery}>
                <View style={styles.galleryCardIcon}>
                  <MaterialIcons name="photo-library" size={32} color={t.accent} />
                </View>
                <View style={styles.galleryCardText}>
                  <Text style={[styles.galleryCardTitle, { color: t.textPrimary }]}>Upload from Gallery</Text>
                  <Text style={[styles.galleryCardSubtitle, { color: t.textSecondary }]}>Choose a photo from your library</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={t.textMuted} />
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)}>
              <View style={styles.previewWrap}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
                <Pressable style={styles.removeBtn} onPress={() => { setImageUri(null); Haptics.selectionAsync(); }}>
                  <MaterialIcons name="close" size={20} color="#fff" />
                </Pressable>
                <Pressable style={styles.retakeBtn} onPress={() => { setImageUri(null); openCamera(); }}>
                  <MaterialIcons name="camera-alt" size={16} color="#fff" />
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: t.textSecondary }]}>Name this object *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: t.surface, color: t.textPrimary, borderColor: t.border }]}
                  placeholder="Give it a creative name..."
                  placeholderTextColor={t.textMuted}
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                />
                <Text style={[styles.charCount, { color: t.textMuted }]}>{name.length}/50</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: t.textSecondary }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  {selectableCategories.map((cat) => {
                    const selected = category === cat.key;
                    return (
                      <Pressable
                        key={cat.key}
                        style={[styles.categoryChip, { backgroundColor: t.surface, borderColor: t.border }, selected && { backgroundColor: cat.color, borderColor: cat.color }]}
                        onPress={() => { Haptics.selectionAsync(); setCategory(cat.key); }}
                      >
                        <MaterialIcons name={cat.icon} size={16} color={selected ? '#fff' : cat.color} />
                        <Text style={[styles.categoryChipText, { color: t.textSecondary }, selected && { color: '#fff' }]}>{cat.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: t.textSecondary }]}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: t.surface, color: t.textPrimary, borderColor: t.border }]}
                  placeholder="What is this object?"
                  placeholderTextColor={t.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={150}
                  multiline
                  numberOfLines={3}
                />
                <Text style={[styles.charCount, { color: t.textMuted }]}>{description.length}/150</Text>
              </View>

              <Pressable
                style={[styles.submitBtn, { backgroundColor: t.primary }, (!name.trim() || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={t.background} />
                ) : (
                  <MaterialIcons name="send" size={20} color={t.background} />
                )}
                <Text style={[styles.submitBtnText, { color: t.background }]}>
                  {submitting ? 'Uploading...' : 'Submit to Community'}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(t: any, typo: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    pageTitle: { ...typo.subtitle },

    cameraCard: { borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1.5, marginTop: 16 },
    cameraCardIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    cameraCardTitle: { ...typo.subtitle, fontSize: 20, marginBottom: 6 },
    cameraCardSubtitle: { ...typo.caption, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
    cameraCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
    cameraCardBadgeText: { ...typo.small, fontWeight: '700' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, paddingHorizontal: 20 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { ...typo.caption, marginHorizontal: 16, fontSize: 13 },

    galleryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18, borderWidth: 1, gap: 14 },
    galleryCardIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(124,92,252,0.1)', alignItems: 'center', justifyContent: 'center' },
    galleryCardText: { flex: 1 },
    galleryCardTitle: { ...typo.bodyBold, fontSize: 15, marginBottom: 2 },
    galleryCardSubtitle: { ...typo.small },

    // Crop/Edit Screen
    cropTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    cropTopBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    cropTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
    cropImageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
    cropImage: { width: '100%', height: '100%', borderRadius: 12 },
    cropProcessingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    cropToolBar: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingVertical: 16 },
    cropToolBtn: { alignItems: 'center', gap: 4 },
    cropToolText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
    cropBottomBar: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
    cropConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: t.primary, borderRadius: 12, height: 56 },
    cropConfirmText: { fontSize: 17, fontWeight: '700' },

    // Camera
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    cameraView: { flex: 1 },
    cameraTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    cameraTopBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

    cameraGuide: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cameraFrame: { position: 'relative' },
    cameraCorner: { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,215,0,0.8)' },
    cameraCornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
    cameraCornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
    cameraCornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
    cameraCornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
    cameraHint: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    cameraBottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 32, paddingTop: 16, paddingBottom: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
    cameraGalleryBtn: { alignItems: 'center', gap: 4, width: 60 },
    cameraGalleryText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
    captureBtn: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
    captureBtnActive: { opacity: 0.6 },
    captureBtnInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    captureBtnDot: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff' },

    previewWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
    previewImage: { width: '100%', aspectRatio: 1, borderRadius: 16 },
    removeBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    retakeBtn: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 8 },
    retakeBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

    formGroup: { marginBottom: 16 },
    label: { ...typo.captionBold, marginBottom: 8 },
    input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, borderWidth: 1 },
    textArea: { height: 80, textAlignVertical: 'top' },
    charCount: { ...typo.small, textAlign: 'right', marginTop: 4 },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, height: 52, marginTop: 8 },
    submitBtnDisabled: { opacity: 0.4 },
    categoryScroll: { gap: 8, paddingBottom: 4 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9999, borderWidth: 1.5 },
    categoryChipText: { ...typo.small, fontWeight: '600' },
    submitBtnText: { ...typo.button, fontSize: 16 },

    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    successIcon: { marginBottom: 20 },
    successTitle: { ...typo.title, marginBottom: 8 },
    successSubtitle: { ...typo.body, textAlign: 'center', marginBottom: 32 },
    successActions: { width: '100%', gap: 12 },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, height: 52 },
    primaryBtnText: { ...typo.button },
    secondaryBtn: { alignItems: 'center', justifyContent: 'center', borderRadius: 12, height: 48, borderWidth: 1 },
    secondaryBtnText: { ...typo.bodyBold },
  });
}
