import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme, typography } from '../constants/theme';
import { config } from '../constants/config';

const EFFECTIVE_DATE = 'April 3, 2026';

interface SectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

function Section({ number, title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>{number}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <MaterialIcons name="privacy-tip" size={32} color={theme.accent} />
          </View>
          <Text style={styles.heroTitle}>Privacy Policy</Text>
          <Text style={styles.heroDate}>Effective: {EFFECTIVE_DATE}</Text>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Your privacy matters to us. This Privacy Policy explains how <Text style={styles.highlight}>{config.appName}</Text> collects, uses, and protects your personal information when you use our application.
          </Text>
        </View>

        <Section number="1" title="Information We Collect">
          <P>We collect the following types of information:</P>
          <Text style={styles.subHeading}>Account Information</Text>
          <Bullet>Email address (used for authentication and account recovery)</Bullet>
          <Bullet>Username and display name (chosen by you)</Bullet>
          <Bullet>Profile avatar (optional)</Bullet>
          <Text style={styles.subHeading}>Content You Submit</Text>
          <Bullet>Photos of objects you upload</Bullet>
          <Bullet>Object names and descriptions you create</Bullet>
          <Bullet>Name suggestions and votes you provide</Bullet>
          <Text style={styles.subHeading}>Automatically Collected Data</Text>
          <Bullet>Device type and operating system</Bullet>
          <Bullet>App usage patterns and feature interactions</Bullet>
          <Bullet>Crash reports and performance data</Bullet>
        </Section>

        <Section number="2" title="How We Use Your Information">
          <P>We use the information we collect to:</P>
          <Bullet>Provide and operate the {config.appName} application</Bullet>
          <Bullet>Authenticate your identity and manage your account</Bullet>
          <Bullet>Display your submissions and activity to the community</Bullet>

          <Bullet>Send notifications about votes, name suggestions, and app updates</Bullet>
          <Bullet>Improve app performance and fix bugs</Bullet>
          <Bullet>Enforce our Terms of Service and Community Guidelines</Bullet>
        </Section>

        <Section number="3" title="Information Sharing">
          <P>We do not sell your personal information. We may share information in the following circumstances:</P>
          <Text style={styles.subHeading}>Community Visibility</Text>
          <P>Your username, avatar, submissions, name suggestions, and votes are visible to other {config.appName} users as part of the community experience.</P>
          <Text style={styles.subHeading}>Service Providers</Text>
          <Bullet>Cloud hosting providers — for storing your data securely</Bullet>
          <Text style={styles.subHeading}>Legal Requirements</Text>
          <P>We may disclose information if required by law, legal process, or to protect the rights and safety of our users.</P>
        </Section>

        <Section number="4" title="Data Storage and Security">
          <P>Your data is stored securely using industry-standard encryption and hosted on secure cloud infrastructure. We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, or destruction.</P>
          <P>While we strive to protect your data, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.</P>
        </Section>

        <Section number="5" title="Your Rights">
          <P>You have the right to:</P>
          <Bullet>Access your personal data stored in the app</Bullet>
          <Bullet>Update or correct your account information</Bullet>
          <Bullet>Delete your account and associated data</Bullet>
          <Bullet>Opt out of non-essential notifications</Bullet>
          <Bullet>Request a copy of your data</Bullet>
          <P>To exercise any of these rights, contact us on our Discord server.</P>
        </Section>

        <Section number="6" title="Camera and Photo Access">
          <P>{config.appName} requests access to your device camera and photo library solely for the purpose of capturing or selecting images of objects to submit to the community. We do not access your camera or photos for any other purpose.</P>
          <P>Photos are uploaded to our secure servers and made publicly viewable within the app. You can delete your submissions at any time.</P>
        </Section>

        <Section number="7" title="Notifications">
          <P>With your permission, we send push notifications about:</P>
          <Bullet>Votes on your submitted objects</Bullet>
          <Bullet>New name suggestions for your objects</Bullet>
          <Bullet>Objects being featured by the community</Bullet>
          <Bullet>Achievement milestones</Bullet>
          <P>You can manage notification preferences in the app settings at any time, including disabling all notifications.</P>
        </Section>

        <Section number="8" title="Children's Privacy">
          <P>{config.appName} is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us immediately so we can delete it.</P>
        </Section>

        <Section number="9" title="Data Retention">
          <P>We retain your data for as long as your account is active. When you delete your account:</P>
          <Bullet>Your profile information is permanently removed</Bullet>
          <Bullet>Your submitted content may be anonymized or removed</Bullet>
          <Bullet>Aggregated, non-identifiable data may be retained for analytics</Bullet>
          <P>Backup copies may persist for up to 30 days after deletion.</P>
        </Section>

        <Section number="10" title="Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email. Your continued use of the app after changes constitutes acceptance of the updated policy.</P>
        </Section>

        <Section number="11" title="Contact Us">
          <P>If you have questions or concerns about this Privacy Policy, please contact us:</P>
          <Pressable style={styles.contactCard} onPress={() => Linking.openURL('https://discord.gg/2cda4rje')}>
            <MaterialIcons name="forum" size={18} color={theme.accent} />
            <Text style={styles.contactText}>discord.gg/2cda4rje</Text>
          </Pressable>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: {EFFECTIVE_DATE}</Text>
          <Text style={styles.footerText}>{config.appName} · All rights reserved</Text>
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

  hero: { alignItems: 'center', paddingTop: 16, paddingBottom: 24 },
  heroIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(124,92,252,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(124,92,252,0.2)',
  },
  heroTitle: { ...typography.title, fontSize: 24, marginBottom: 6 },
  heroDate: { ...typography.caption },

  introCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1, borderColor: theme.border,
  },
  introText: { ...typography.body, color: theme.textSecondary, lineHeight: 24 },
  highlight: { color: theme.primary, fontWeight: '600' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(124,92,252,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionNumberText: { fontSize: 13, fontWeight: '700', color: theme.accent },
  sectionTitle: { ...typography.bodyBold, fontSize: 16, flex: 1 },
  sectionBody: { paddingLeft: 40 },

  subHeading: {
    ...typography.captionBold, color: theme.textPrimary,
    marginTop: 8, marginBottom: 8,
  },

  paragraph: {
    ...typography.body, color: theme.textSecondary,
    lineHeight: 24, marginBottom: 12,
  },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, paddingRight: 8 },
  bulletDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: theme.accent,
    marginTop: 9,
  },
  bulletText: { ...typography.body, color: theme.textSecondary, lineHeight: 24, flex: 1 },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 14,
    borderWidth: 1, borderColor: theme.border,
  },
  contactText: { ...typography.bodyBold, color: theme.accent },

  footer: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  footerText: { ...typography.small, color: theme.textMuted },
});
