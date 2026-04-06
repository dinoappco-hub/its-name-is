import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth, useAlert } from '@/template';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { showAlert } = useAlert();
  const { currentUser, updateProfile } = useApp();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [newAvatarLocal, setNewAvatarLocal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(currentUser.displayName || '');
    setUsername(currentUser.username || '');
    setAvatarUri(currentUser.avatar || '');
  }, [currentUser]);

  const displayAvatar = newAvatarLocal || avatarUri;

  const handlePickAvatar = async () => {
    Haptics.selectionAsync();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Please allow access to your photo library to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewAvatarLocal(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      showAlert('Required', 'Display name cannot be empty.');
      return;
    }
    if (!username.trim()) {
      showAlert('Required', 'Username cannot be empty.');
      return;
    }
    if (username.trim().length < 3) {
      showAlert('Too Short', 'Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      showAlert('Invalid Username', 'Username can only contain letters, numbers, and underscores.');
      return;
    }

    setSaving(true);
    const { error } = await updateProfile({
      displayName: displayName.trim(),
      username: username.trim(),
      avatarLocalUri: newAvatarLocal || undefined,
    });
    setSaving(false);

    if (error) {
      showAlert('Error', error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('Saved', 'Your profile has been updated.');
    router.back();
  };

  const hasChanges =
    displayName.trim() !== currentUser.displayName ||
    username.trim() !== currentUser.username ||
    newAvatarLocal !== null;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="close" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable
          style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.background} />
          ) : (
            <Text style={[styles.saveBtnText, (!hasChanges || saving) && styles.saveBtnTextDisabled]}>Save</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarSection}>
            <Pressable style={styles.avatarWrap} onPress={handlePickAvatar}>
              <Image source={{ uri: displayAvatar }} style={styles.avatar} contentFit="cover" transition={200} />
              <View style={styles.avatarOverlay}>
                <MaterialIcons name="camera-alt" size={22} color="#fff" />
              </View>
              {newAvatarLocal ? (
                <View style={styles.avatarChanged}>
                  <MaterialIcons name="check" size={12} color={theme.background} />
                </View>
              ) : null}
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </Animated.View>

          {/* Fields */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="person" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your display name"
                  placeholderTextColor={theme.textMuted}
                  maxLength={30}
                  autoCapitalize="words"
                />
                <Text style={styles.charCount}>{displayName.length}/30</Text>
              </View>
              <Text style={styles.fieldHint}>This is how your name appears on submissions and comments.</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Username</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="your_username"
                  placeholderTextColor={theme.textMuted}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.charCount}>{username.length}/20</Text>
              </View>
              <Text style={styles.fieldHint}>Letters, numbers, and underscores only. Minimum 3 characters.</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(400)}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputWrap, styles.inputDisabled]}>
                <MaterialIcons name="mail" size={18} color={theme.textMuted} />
                <Text style={styles.emailText}>{authUser?.email || ''}</Text>
                <MaterialIcons name="lock" size={14} color={theme.textMuted} />
              </View>
              <Text style={styles.fieldHint}>Email cannot be changed from here.</Text>
            </View>
          </Animated.View>

          {/* Preview Card */}
          <Animated.View entering={FadeInDown.delay(340).duration(400)}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewCard}>
              <Image source={{ uri: displayAvatar }} style={styles.previewAvatar} contentFit="cover" transition={200} />
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{displayName.trim() || 'Display Name'}</Text>
                <Text style={styles.previewUsername}>@{username.trim() || 'username'}</Text>
              </View>

            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  saveBtn: {
    backgroundColor: theme.primary,
    borderRadius: theme.radiusFull,
    paddingHorizontal: 20, paddingVertical: 10,
    minWidth: 70, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { ...typography.button, fontSize: 14 },
  saveBtnTextDisabled: { opacity: 0.6 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: theme.border },
  avatarOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: theme.background,
  },
  avatarChanged: {
    position: 'absolute', top: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: theme.success,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.background,
  },
  avatarHint: { ...typography.small, marginTop: 10 },

  fieldGroup: { marginBottom: 24 },
  fieldLabel: { ...typography.captionBold, color: theme.textSecondary, marginBottom: 8, marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: theme.border,
  },
  inputDisabled: { opacity: 0.5 },
  input: { flex: 1, fontSize: 16, color: theme.textPrimary, includeFontPadding: false },
  atSign: { fontSize: 16, fontWeight: '600', color: theme.textMuted },
  charCount: { ...typography.small, color: theme.textMuted },
  emailText: { flex: 1, fontSize: 15, color: theme.textSecondary },
  fieldHint: { ...typography.small, color: theme.textMuted, marginTop: 6, marginLeft: 2 },

  previewLabel: {
    ...typography.captionBold, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10, marginLeft: 2,
  },
  previewCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 16,
    borderWidth: 1, borderColor: theme.border,
  },
  previewAvatar: { width: 48, height: 48, borderRadius: 24 },
  previewInfo: { flex: 1, marginLeft: 12 },
  previewName: { ...typography.bodyBold, fontSize: 16 },
  previewUsername: { ...typography.caption, marginTop: 2 },

});
