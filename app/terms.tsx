import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '../components/SafeIcons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../hooks/useTheme';
import { config } from '../constants/config';

const EFFECTIVE_DATE = 'April 3, 2026';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t } = useAppTheme();

  const Section = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionNumber, { backgroundColor: `${t.primary}15` }]}>
          <Text style={[styles.sectionNumberText, { color: t.primary }]}>{number}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );

  const P = ({ children }: { children: React.ReactNode }) => (
    <Text style={[styles.paragraph, { color: t.textSecondary }]}>{children}</Text>
  );

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: t.primary }]} />
      <Text style={[styles.bulletText, { color: t.textSecondary }]}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.heroIconWrap, { backgroundColor: `${t.primary}12`, borderColor: `${t.primary}25` }]}>
            <MaterialIcons name="description" size={32} color={t.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: t.textPrimary }]}>Terms of Service</Text>
          <Text style={[styles.heroDate, { color: t.textSecondary }]}>Effective: {EFFECTIVE_DATE}</Text>
        </View>

        <View style={[styles.introCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.introText, { color: t.textSecondary }]}>
            Welcome to <Text style={[styles.highlight, { color: t.primary }]}>{config.appName}</Text> These Terms of Service govern your use of our mobile application and services. By using {config.appName}, you agree to these terms.
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
          <Pressable style={[styles.contactCard, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => Linking.openURL('https://discord.gg/2cda4rje')}>
            <MaterialIcons name="forum" size={18} color={t.primary} />
            <Text style={[styles.contactText, { color: t.primary }]}>discord.gg/2cda4rje</Text>
          </Pressable>
        </Section>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: t.textMuted }]}>Last updated: {EFFECTIVE_DATE}</Text>
          <Text style={[styles.footerText, { color: t.textMuted }]}>{config.appName} · All rights reserved</Text>
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
  hero: { alignItems: 'center', paddingTop: 16, paddingBottom: 24 },
  heroIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1 },
  heroTitle: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  heroDate: { fontSize: 12 },
  introCard: { borderRadius: 16, padding: 20, marginBottom: 28, borderWidth: 1 },
  introText: { fontSize: 15, lineHeight: 24 },
  highlight: { fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionNumberText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  sectionBody: { paddingLeft: 40 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, paddingRight: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  bulletText: { fontSize: 15, lineHeight: 24, flex: 1 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  contactText: { fontSize: 15, fontWeight: '600' },
  footer: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  footerText: { fontSize: 11 },
});
