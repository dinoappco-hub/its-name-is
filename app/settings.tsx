import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useAlert } from '@/template';
import { config } from '../constants/config';
import { useAppTheme } from '../hooks/useTheme';
import { useApp } from '../contexts/AppContext';
import { useMute } from '../hooks/useMute';

interface SettingsItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  showChevron?: boolean;
  badge?: string;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { logout } = useAuth();
  const { colors: t, typo, mode, isDark, toggleMode } = useAppTheme();
  const { currentUser } = useApp();
  const { mutedUserIds } = useMute();

  const handleResetOnboarding = async () => {
    await AsyncStorage.removeItem('snapname_onboarded');
    showAlert('Done', 'Onboarding will show next time you open the app.');
  };

  const handleClearData = () => {
    showAlert('Clear All Data?', 'This will reset the app to its default state. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          showAlert('Cleared', 'All local data has been removed.');
        },
      },
    ]);
  };

  const handleRateApp = () => {
    showAlert('Rate Us', 'Enjoying the app? Leave us a review on the App Store!', [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Rate', onPress: () => {} },
    ]);
  };

  const handleContact = () => {
    Linking.openURL('https://discord.gg/2cda4rje');
  };

  const sections: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'Appearance',
      items: [
        {
          icon: isDark ? 'dark-mode' : 'light-mode',
          label: isDark ? 'Dark Mode' : 'Light Mode',
          subtitle: `Tap to switch to ${isDark ? 'light' : 'dark'} mode`,
          onPress: () => {
            Haptics.selectionAsync();
            toggleMode();
          },
          color: isDark ? '#7C5CFC' : '#F59E0B',
          showChevron: false,
          badge: isDark ? 'DARK' : 'LIGHT',
        },
        {
          icon: 'palette',
          label: 'Customize Colors',
          subtitle: 'Choose your accent and primary colors',
          onPress: () => router.push('/customize-theme'),
          color: t.primary,
          showChevron: true,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'notifications',
          label: 'Notifications',
          subtitle: 'Manage notification preferences',
          onPress: () => router.push('/notification-settings'),
          showChevron: true,
        },
        {
          icon: 'volume-off',
          label: 'Muted Users',
          subtitle: `${mutedUserIds.length} muted user${mutedUserIds.length !== 1 ? 's' : ''}`,
          onPress: () => router.push('/muted-users'),
          showChevron: true,
          badge: mutedUserIds.length > 0 ? String(mutedUserIds.length) : undefined,
        },
        {
          icon: 'accessibility-new',
          label: 'Accessibility',
          subtitle: 'Text size, contrast, motion settings',
          onPress: () => router.push('/accessibility'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'auto-stories',
          label: 'Our Story',
          subtitle: 'Why I built this app',
          onPress: () => router.push('/our-story'),
          color: t.primary,
          showChevron: true,
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          icon: 'gavel',
          label: 'Community Guidelines',
          subtitle: 'Rules for naming and voting',
          onPress: () => router.push('/community-guidelines'),
          showChevron: true,
        },
        {
          icon: 'flag',
          label: 'Report a Problem',
          subtitle: 'Report bugs, issues, or feedback',
          onPress: () => router.push('/report-problem'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'star-rate',
          label: 'Rate App',
          subtitle: 'Leave a review',
          onPress: handleRateApp,
          showChevron: true,
        },
        {
          icon: 'forum',
          label: 'Contact Support',
          subtitle: 'Join our Discord',
          onPress: handleContact,
          showChevron: true,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: 'description',
          label: 'Terms of Service',
          onPress: () => router.push('/terms'),
          showChevron: true,
        },
        {
          icon: 'privacy-tip',
          label: 'Privacy Policy',
          onPress: () => router.push('/privacy'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Advanced',
      items: [
        ...(currentUser.isAdmin ? [{
          icon: 'shield' as keyof typeof MaterialIcons.glyphMap,
          label: 'Admin Panel',
          subtitle: 'Manage reports and moderate content',
          onPress: () => router.push('/admin'),
          color: t.error,
          showChevron: true,
          badge: 'MOD',
        }] : []),
        {
          icon: 'replay',
          label: 'Show Onboarding Again',
          onPress: handleResetOnboarding,
          showChevron: false,
        },
        {
          icon: 'delete-forever',
          label: 'Clear Local Data',
          subtitle: 'Reset app to default state',
          onPress: handleClearData,
          color: t.error,
          showChevron: false,
        },
        {
          icon: 'logout',
          label: 'Sign Out',
          subtitle: 'Log out of your account',
          onPress: () => {
            showAlert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  const { error } = await logout();
                  if (error) {
                    showAlert('Error', error);
                  } else {
                    router.replace('/');
                  }
                },
              },
            ]);
          },
          color: t.error,
          showChevron: false,
        },
      ],
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.textMuted }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.settingsRow,
                    idx < section.items.length - 1 && [styles.settingsRowBorder, { borderBottomColor: t.border }],
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    item.onPress();
                  }}
                >
                  <View style={[styles.settingsIcon, { backgroundColor: `${item.color || t.accent}15` }]}>
                    <MaterialIcons name={item.icon} size={20} color={item.color || t.accent} />
                  </View>
                  <View style={styles.settingsContent}>
                    <View style={styles.settingsLabelRow}>
                      <Text style={[styles.settingsLabel, { color: t.textPrimary }, item.color === t.error && { color: t.error }]}>
                        {item.label}
                      </Text>
                      {item.badge ? (
                        <View style={[styles.badge, { backgroundColor: t.primary }]}>
                          <Text style={[styles.badgeText, { color: t.background }]}>{item.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    {item.subtitle ? (
                      <Text style={[styles.settingsSubtitle, { color: t.textSecondary }]} numberOfLines={1}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                  {item.showChevron ? (
                    <MaterialIcons name="chevron-right" size={20} color={t.textMuted} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: t.primary }]}>{config.appName}</Text>
          <Text style={[styles.footerVersion, { color: t.textMuted }]}>Version {config.version} · Build 1</Text>
          <Text style={[styles.footerCopy, { color: t.textMuted }]}>Made with passion</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  settingsRowBorder: { borderBottomWidth: 1 },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsContent: { flex: 1 },
  settingsLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsLabel: { fontSize: 15, fontWeight: '600' },
  settingsSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  badge: { borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  footer: { alignItems: 'center', paddingVertical: 32 },
  footerText: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  footerVersion: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  footerCopy: { fontSize: 11, fontWeight: '500' },
});
