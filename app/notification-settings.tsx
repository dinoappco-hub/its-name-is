import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationType } from '../services/notificationTypes';

interface NotifOption {
  type: NotificationType;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  title: string;
  description: string;
}

const NOTIF_OPTIONS: NotifOption[] = [
  { type: 'vote', icon: 'thumb-up', color: '#10B981', title: 'Votes', description: 'When someone upvotes or downvotes a name you suggested' },
  { type: 'name_suggestion', icon: 'chat-bubble', color: '#7C5CFC', title: 'Name Suggestions', description: 'When someone suggests a new name for your object' },
  { type: 'featured', icon: 'star', color: '#FFD700', title: 'Featured', description: 'When your object gets featured on the homepage' },
  { type: 'milestone', icon: 'emoji-events', color: '#F59E0B', title: 'Milestones', description: 'Achievements like reaching vote or submission goals' },
  { type: 'comment', icon: 'forum', color: '#3B82F6', title: 'Comments', description: 'When someone comments on your object or replies to you' },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t } = useAppTheme();
  const { preferences, updatePreference, masterEnabled, setMasterEnabled } = useNotifications();

  const handleMasterToggle = (value: boolean) => {
    Haptics.selectionAsync();
    setMasterEnabled(value);
  };

  const handleToggle = (type: NotificationType, value: boolean) => {
    Haptics.selectionAsync();
    updatePreference(type, value);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).duration(300)}>
          <View style={[styles.masterCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={styles.masterLeft}>
              <View style={[styles.masterIconWrap, { backgroundColor: `${t.accent}12` }]}>
                <MaterialIcons name="notifications-active" size={28} color={masterEnabled ? t.accent : t.textMuted} />
              </View>
              <View style={styles.masterText}>
                <Text style={[styles.masterTitle, { color: t.textPrimary }]}>Push Notifications</Text>
                <Text style={[styles.masterSubtitle, { color: t.textSecondary }]}>
                  {masterEnabled ? 'Notifications are enabled' : 'All notifications are paused'}
                </Text>
              </View>
            </View>
            <Switch
              value={masterEnabled}
              onValueChange={handleMasterToggle}
              trackColor={{ false: t.border, true: `${t.accent}80` }}
              thumbColor={masterEnabled ? t.accent : t.textMuted}
              ios_backgroundColor={t.border}
            />
          </View>
        </Animated.View>

        <View style={[styles.section, !masterEnabled && styles.sectionDisabled]}>
          <Text style={[styles.sectionLabel, { color: t.textMuted }]}>Notification Types</Text>
          <View style={[styles.sectionCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            {NOTIF_OPTIONS.map((option, index) => {
              const enabled = preferences[option.type] ?? true;
              return (
                <Animated.View key={option.type} entering={FadeInDown.delay(100 + index * 60).duration(300)}>
                  <View style={[styles.optionRow, index < NOTIF_OPTIONS.length - 1 && [styles.optionRowBorder, { borderBottomColor: t.border }]]}>
                    <View style={[styles.optionIcon, { backgroundColor: `${option.color}18` }]}>
                      <MaterialIcons name={option.icon} size={20} color={masterEnabled && enabled ? option.color : t.textMuted} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, { color: t.textPrimary }, (!masterEnabled || !enabled) && { color: t.textMuted }]}>{option.title}</Text>
                      <Text style={[styles.optionDesc, { color: t.textSecondary }]} numberOfLines={2}>{option.description}</Text>
                    </View>
                    <Switch
                      value={masterEnabled && enabled}
                      onValueChange={(val) => handleToggle(option.type, val)}
                      disabled={!masterEnabled}
                      trackColor={{ false: t.border, true: `${option.color}60` }}
                      thumbColor={masterEnabled && enabled ? option.color : t.textMuted}
                      ios_backgroundColor={t.border}
                    />
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <View style={[styles.infoCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <MaterialIcons name="info-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.textSecondary }]}>
              Notification preferences are saved locally. You can also manage system-level notifications in your device Settings app.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  masterCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1 },
  masterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  masterIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  masterText: { flex: 1 },
  masterTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  masterSubtitle: { fontSize: 12 },
  section: { marginBottom: 24 },
  sectionDisabled: { opacity: 0.45 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  optionRowBorder: { borderBottomWidth: 1 },
  optionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionContent: { flex: 1, marginRight: 8 },
  optionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  optionDesc: { fontSize: 11, lineHeight: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  infoText: { fontSize: 11, flex: 1, lineHeight: 17 },
});
