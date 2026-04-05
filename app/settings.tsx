import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useAlert } from '@/template';
import { theme, typography } from '../constants/theme';
import { config } from '../constants/config';
import { useApp } from '../contexts/AppContext';


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
  const { isPremium, subscriptionEnd } = useApp();
  const { showAlert } = useAlert();
  const { logout } = useAuth();

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
    Linking.openURL('mailto:support@itsnameis.app?subject=its%20name%20is.%20Support');
  };

  const sections: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: 'workspace-premium',
          label: isPremium ? 'Premium Active' : 'Upgrade to Premium',
          subtitle: isPremium ? (subscriptionEnd ? `Renews ${new Date(subscriptionEnd).toLocaleDateString()}` : 'Manage your subscription') : `${config.premium.price}/${config.premium.period} — Unlimited everything`,
          onPress: () => router.push('/premium'),
          color: theme.primary,
          showChevron: true,
          badge: isPremium ? 'PRO' : undefined,
        },
        {
          icon: 'notifications',
          label: 'Notifications',
          subtitle: 'Manage notification preferences',
          onPress: () => router.push('/notification-settings'),
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
          color: theme.primary,
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
          subtitle: 'Report inappropriate content',
          onPress: handleContact,
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
          icon: 'mail',
          label: 'Contact Support',
          subtitle: 'support@itsnameis.app',
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
          color: theme.error,
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
                  if (error) showAlert('Error', error);
                },
              },
            ]);
          },
          color: theme.error,
          showChevron: false,
        },
      ],
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => {
          return (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.items.map((item, idx) => (
                  <Pressable
                    key={item.label}
                    style={[
                      styles.settingsRow,
                      idx < section.items.length - 1 && styles.settingsRowBorder,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      item.onPress();
                    }}
                  >
                    <View style={[styles.settingsIcon, { backgroundColor: `${item.color || theme.accent}15` }]}>
                      <MaterialIcons name={item.icon} size={20} color={item.color || theme.accent} />
                    </View>
                    <View style={styles.settingsContent}>
                      <View style={styles.settingsLabelRow}>
                        <Text style={[styles.settingsLabel, item.color === theme.error && { color: theme.error }]}>
                          {item.label}
                        </Text>
                        {item.badge ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      {item.subtitle ? (
                        <Text style={styles.settingsSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                      ) : null}
                    </View>
                    {item.showChevron ? (
                      <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{config.appName}</Text>
          <Text style={styles.footerVersion}>Version {config.version} · Build 1</Text>
          <Text style={styles.footerCopy}>Made with passion</Text>
        </View>
      </ScrollView>
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
  section: { marginBottom: 24 },
  sectionTitle: {
    ...typography.captionBold, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8, marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  settingsRowBorder: {
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  settingsIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsContent: { flex: 1 },
  settingsLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsLabel: { ...typography.bodyBold, fontSize: 15 },
  settingsSubtitle: { ...typography.small, color: theme.textSecondary, marginTop: 2 },
  badge: {
    backgroundColor: theme.primary, borderRadius: theme.radiusFull,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: theme.background },
  footer: { alignItems: 'center', paddingVertical: 32 },
  footerText: { ...typography.bodyBold, color: theme.primary, marginBottom: 4 },
  footerVersion: { ...typography.small, color: theme.textMuted, marginBottom: 4 },
  footerCopy: { ...typography.small, color: theme.textMuted },


});
