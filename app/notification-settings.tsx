import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
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
  {
    type: 'vote',
    icon: 'thumb-up',
    color: '#10B981',
    title: 'Votes',
    description: 'When someone upvotes or downvotes a name you suggested',
  },
  {
    type: 'name_suggestion',
    icon: 'chat-bubble',
    color: '#7C5CFC',
    title: 'Name Suggestions',
    description: 'When someone suggests a new name for your object',
  },
  {
    type: 'featured',
    icon: 'star',
    color: '#FFD700',
    title: 'Featured',
    description: 'When your object gets featured on the homepage',
  },
  {
    type: 'milestone',
    icon: 'emoji-events',
    color: '#F59E0B',
    title: 'Milestones',
    description: 'Achievements like reaching vote or submission goals',
  },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Toggle */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)}>
          <View style={styles.masterCard}>
            <View style={styles.masterLeft}>
              <View style={[styles.masterIconWrap]}>
                <MaterialIcons
                  name="notifications-active"
                  size={28}
                  color={masterEnabled ? theme.accent : theme.textMuted}
                />
              </View>
              <View style={styles.masterText}>
                <Text style={styles.masterTitle}>Push Notifications</Text>
                <Text style={styles.masterSubtitle}>
                  {masterEnabled ? 'Notifications are enabled' : 'All notifications are paused'}
                </Text>
              </View>
            </View>
            <Switch
              value={masterEnabled}
              onValueChange={handleMasterToggle}
              trackColor={{ false: theme.border, true: `${theme.accent}80` }}
              thumbColor={masterEnabled ? theme.accent : theme.textMuted}
              ios_backgroundColor={theme.border}
            />
          </View>
        </Animated.View>

        {/* Category Toggles */}
        <View style={[styles.section, !masterEnabled && styles.sectionDisabled]}>
          <Text style={styles.sectionLabel}>Notification Types</Text>
          <View style={styles.sectionCard}>
            {NOTIF_OPTIONS.map((option, index) => {
              const enabled = preferences[option.type] ?? true;
              return (
                <Animated.View
                  key={option.type}
                  entering={FadeInDown.delay(100 + index * 60).duration(300)}
                >
                  <View
                    style={[
                      styles.optionRow,
                      index < NOTIF_OPTIONS.length - 1 && styles.optionRowBorder,
                    ]}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: `${option.color}18` }]}>
                      <MaterialIcons
                        name={option.icon}
                        size={20}
                        color={masterEnabled && enabled ? option.color : theme.textMuted}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionTitle,
                          (!masterEnabled || !enabled) && styles.optionTitleDisabled,
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text style={styles.optionDesc} numberOfLines={2}>
                        {option.description}
                      </Text>
                    </View>
                    <Switch
                      value={masterEnabled && enabled}
                      onValueChange={(val) => handleToggle(option.type, val)}
                      disabled={!masterEnabled}
                      trackColor={{ false: theme.border, true: `${option.color}60` }}
                      thumbColor={masterEnabled && enabled ? option.color : theme.textMuted}
                      ios_backgroundColor={theme.border}
                    />
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Info Footer */}
        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={18} color={theme.textMuted} />
            <Text style={styles.infoText}>
              Notification preferences are saved locally. You can also manage system-level
              notifications in your device Settings app.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.bodyBold, fontSize: 17 },

  // Master toggle card
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  masterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  masterIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${theme.accent}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterText: { flex: 1 },
  masterTitle: { ...typography.bodyBold, fontSize: 16, marginBottom: 2 },
  masterSubtitle: { ...typography.caption },

  // Section
  section: { marginBottom: 24 },
  sectionDisabled: { opacity: 0.45 },
  sectionLabel: {
    ...typography.captionBold,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },

  // Option rows
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  optionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: { flex: 1, marginRight: 8 },
  optionTitle: { ...typography.bodyBold, fontSize: 15, marginBottom: 2 },
  optionTitleDisabled: { color: theme.textMuted },
  optionDesc: { ...typography.small, color: theme.textSecondary, lineHeight: 16 },

  // Info footer
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoText: { ...typography.small, color: theme.textSecondary, flex: 1, lineHeight: 17 },
});
