import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
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

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <MaterialIcons name="description" size={32} color={theme.primary} />
          </View>
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <Text style={styles.heroDate}>Effective: {EFFECTIVE_DATE}</Text>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Welcome to <Text style={styles.highlight}>{config.appName}</Text> These Terms of Service govern your use of our mobile application and services. By using {config.appName}, you agree to these terms.
          </Text>
        </View>

        <Section number="1" title="Acceptance of Terms">
          <P>By downloading, installing, or using the {config.appName} application, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the application.</P>
          <P>We reserve the right to update these terms at any time. Continued use of the app after changes constitutes acceptance of the updated terms.</P>
        </Section>

        <Section number="2" title="Account Registration">
          <P>To use {config.appName}, you must create an account by providing a valid email address and password. You are responsible for:</P>
          <Bullet>Maintaining the confidentiality of your account credentials</Bullet>
          <Bullet>All activities that occur under your account</Bullet>
          <Bullet>Notifying us immediately of any unauthorized use</Bullet>
          <P>You must be at least 13 years old to create an account. If you are under 18, you must have parental or guardian consent.</P>
        </Section>

        <Section number="3" title="User-Generated Content">
          <P>You retain ownership of photos and content you submit. By submitting content, you grant {config.appName} a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your content within the app.</P>
          <P>You agree not to submit content that is:</P>
          <Bullet>Offensive, obscene, or inappropriate</Bullet>
          <Bullet>Infringing on intellectual property rights of others</Bullet>
          <Bullet>Harmful, threatening, or harassing</Bullet>
          <Bullet>Spam, fraudulent, or misleading</Bullet>
          <P>We reserve the right to remove any content that violates these terms without prior notice.</P>
        </Section>

        <Section number="4" title="Naming and Voting">
          <P>The core feature of {config.appName} allows users to suggest names for objects and vote on suggestions. You agree to:</P>
          <Bullet>Submit creative, respectful, and appropriate names</Bullet>
          <Bullet>Not manipulate the voting system through fake accounts or automated tools</Bullet>
          <Bullet>Accept that votes and rankings reflect community preferences</Bullet>
          <P>We may moderate names and remove those that violate community guidelines.</P>
        </Section>

        <Section number="5" title="Usage Limits">
          <P>Users are limited to {config.submissionsPerDay} object submissions per day. This limit resets daily at midnight.</P>
        </Section>

        <Section number="6" title="Prohibited Conduct">
          <P>You agree not to:</P>
          <Bullet>Use the app for any illegal purpose</Bullet>
          <Bullet>Attempt to reverse-engineer, decompile, or hack the application</Bullet>
          <Bullet>Create multiple accounts to circumvent submission limits</Bullet>
          <Bullet>Harass, bully, or intimidate other users</Bullet>
          <Bullet>Use automated bots or scripts to interact with the service</Bullet>
          <Bullet>Interfere with the proper functioning of the app</Bullet>
        </Section>

        <Section number="7" title="Intellectual Property">
          <P>The {config.appName} app, including its design, logo, features, and underlying code, is the intellectual property of {config.appName} and is protected by copyright and trademark laws. You may not copy, modify, or distribute any part of the application without written permission.</P>
        </Section>

        <Section number="8" title="Termination">
          <P>We may suspend or terminate your account at any time if you violate these terms. Upon termination:</P>
          <Bullet>Your right to use the app ceases immediately</Bullet>
          <Bullet>Your submitted content may remain visible to other users</Bullet>
        </Section>

        <Section number="9" title="Disclaimer of Warranties">
          <P>The app is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the app will be uninterrupted, error-free, or free of harmful components.</P>
        </Section>

        <Section number="10" title="Limitation of Liability">
          <P>To the maximum extent permitted by law, {config.appName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the app.</P>
        </Section>

        <Section number="11" title="Contact Us">
          <P>If you have questions about these Terms of Service, please contact us at:</P>
          <View style={styles.contactCard}>
            <MaterialIcons name="mail" size={18} color={theme.primary} />
            <Text style={styles.contactText}>support@itsnameis.app</Text>
          </View>
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
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
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
    backgroundColor: 'rgba(255,215,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionNumberText: { fontSize: 13, fontWeight: '700', color: theme.primary },
  sectionTitle: { ...typography.bodyBold, fontSize: 16, flex: 1 },
  sectionBody: { paddingLeft: 40 },

  paragraph: {
    ...typography.body, color: theme.textSecondary,
    lineHeight: 24, marginBottom: 12,
  },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, paddingRight: 8 },
  bulletDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: theme.primary,
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
  contactText: { ...typography.bodyBold, color: theme.primary },

  footer: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  footerText: { ...typography.small, color: theme.textMuted },
});
