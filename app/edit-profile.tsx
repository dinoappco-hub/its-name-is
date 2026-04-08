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
import { useApp } from '../contexts/AppContext';
import { useAppTheme } from '../hooks/useTheme';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { showAlert } = useAlert();
  const { colors: t, typo } = useAppTheme();
  const { currentUser, updateProfile } = useApp();

  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [newAvatarLocal, setNewAvatarLocal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(currentUser.username || '');
    setAvatarUri(currentUser.avatar || '');
  }, [currentUser]);

  const displayAvatar = newAvatarLocal || avatarUri;

  const handlePickAvatar = async () => {
    Haptics.selectionAsync();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('Permission Required', 'Please allow access to your photo library to change your avatar.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setNewAvatarLocal(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!username.trim()) { showAlert('Required', 'Username cannot be empty.'); return; }
    setSaving(true);
    const { error } = await updateProfile({ displayName: username.trim(), username: username.trim(), avatarLocalUri: newAvatarLocal || undefined });
    setSaving(false);
    if (error) { showAlert('Error', error); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const hasChanges = username.trim() !== currentUser.username || newAvatarLocal !== null;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="close" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Edit Profile</Text>
        <Pressable style={[styles.saveBtn, { backgroundColor: t.primary }, (!hasChanges || saving) && styles.saveBtnDisabled]} onPress={handleSave} disabled={!hasChanges || saving}>
          {saving ? <ActivityIndicator size="small" color={t.background} /> : <Text style={[styles.saveBtnText, { color: t.background }]}>Save</Text>}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarSection}>
            <Pressable style={styles.avatarWrap} onPress={handlePickAvatar}>
              <Image source={{ uri: displayAvatar }} style={[styles.avatar, { borderColor: t.border }]} contentFit="cover" transition={200} />
              <View style={[styles.avatarOverlay, { backgroundColor: t.primary, borderColor: t.background }]}><MaterialIcons name="camera-alt" size={22} color="#fff" /></View>
              {newAvatarLocal ? <View style={[styles.avatarChanged, { borderColor: t.background }]}><MaterialIcons name="check" size={12} color={t.background} /></View> : null}
            </Pressable>
            <Text style={[styles.avatarHint, { color: t.textMuted }]}>Tap to change photo</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Username</Text>
              <View style={[styles.inputWrap, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Text style={[styles.atSign, { color: t.textMuted }]}>@</Text>
                <TextInput style={[styles.input, { color: t.textPrimary }]} value={username} onChangeText={setUsername} placeholder="your username" placeholderTextColor={t.textMuted} autoCorrect={false} />

              </View>
              <Text style={[styles.fieldHint, { color: t.textMuted }]}>Use any characters you like — letters, symbols, spaces, emojis.</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Email</Text>
              <View style={[styles.inputWrap, styles.inputDisabled, { backgroundColor: t.surface, borderColor: t.border }]}>
                <MaterialIcons name="mail" size={18} color={t.textMuted} />
                <Text style={[styles.emailText, { color: t.textSecondary }]}>{authUser?.email || ''}</Text>
                <MaterialIcons name="lock" size={14} color={t.textMuted} />
              </View>
              <Text style={[styles.fieldHint, { color: t.textMuted }]}>Email cannot be changed from here.</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(400)}>
            <Text style={[styles.previewLabel, { color: t.textMuted }]}>Preview</Text>
            <View style={[styles.previewCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Image source={{ uri: displayAvatar }} style={styles.previewAvatar} contentFit="cover" transition={200} />
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, { color: t.textPrimary }]}>@{username.trim() || 'username'}</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  saveBtn: { borderRadius: 9999, paddingHorizontal: 20, paddingVertical: 10, minWidth: 70, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 14, fontWeight: '700' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3 },
  avatarOverlay: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  avatarChanged: { position: 'absolute', top: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarHint: { fontSize: 11, fontWeight: '500', marginTop: 10 },
  fieldGroup: { marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, height: 52, borderWidth: 1 },
  inputDisabled: { opacity: 0.5 },
  input: { flex: 1, fontSize: 16, includeFontPadding: false },
  atSign: { fontSize: 16, fontWeight: '600' },
  charCount: { fontSize: 11, fontWeight: '500' },
  emailText: { flex: 1, fontSize: 15 },
  fieldHint: { fontSize: 11, fontWeight: '500', marginTop: 6, marginLeft: 2 },
  previewLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 2 },
  previewCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 1 },
  previewAvatar: { width: 48, height: 48, borderRadius: 24 },
  previewInfo: { flex: 1, marginLeft: 12 },
  previewName: { fontSize: 16, fontWeight: '600' },
});
