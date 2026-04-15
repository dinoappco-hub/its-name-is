import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '../components/SafeIcons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../hooks/useTheme';
import { config } from '../constants/config';

const EFFECTIVE_DATE = 'April 15, 2026';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t } = useAppTheme();

  const Section = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionNumber, { backgroundColor: `${t.accent}15` }]}>
          <Text style={[styles.sectionNumberText, { color: t.accent }]}>{number}</Text>
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
      <View style={[styles.bulletDot, { backgroundColor: t.accent }]} />
      <Text style={[styles.bulletText, { color: t.textSecondary }]}>{children}</Text>
    </View>
  );

  const SubHeading = ({ children }: { children: React.ReactNode }) => (
    <Text style={[styles.subHeading, { color: t.textPrimary }]}>{children}</Text>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.heroIconWrap, { backgroundColor: `${t.accent}12`, borderColor: `${t.accent}25` }]}>
            <MaterialIcons name="privacy-tip" size={32} color={t.accent} />
          </View>
          <Text style={[styles.heroTitle, { color: t.textPrimary }]}>Privacy Policy</Text>
          <Text style={[styles.heroDate, { color: t.textSecondary }]}>Effective: {EFFECTIVE_DATE}</Text>
        </View>

        <View style={[styles.introCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.introText, { color: t.textSecondary }]}>
            Your privacy matters to us. This Privacy Policy explains how <Text style={[styles.highlight, { color: t.primary }]}>{config.appName}</Text> collects, uses, and protects your personal information when you use our application.
          </Text>
        </View>

        <Section number="1" title="Information We Collect">
          <P>We collect the following types of information:</P>
          <SubHeading>Account Information</SubHeading>
          <Bullet>Email address (used for authentication and account recovery)</Bullet>
          <Bullet>Username and display name (chosen by you)</Bullet>
          <Bullet>Profile avatar (optional)</Bullet>
          <SubHeading>Content You Submit</SubHeading>
          <Bullet>Photos of objects you upload</Bullet>
          <Bullet>Object names and descriptions you create</Bullet>
          <Bullet>Name suggestions and votes you provide</Bullet>
          <SubHeading>Automatically Collected Data</SubHeading>
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
          <SubHeading>Community Visibility</SubHeading>
          <P>Your username, avatar, submissions, name suggestions, and votes are visible to other {config.appName} users as part of the community experience.</P>
          <SubHeading>Service Providers</SubHeading>
          <Bullet>Cloud hosting providers — for storing your data securely</Bullet>
          <SubHeading>Legal Requirements</SubHeading>
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

        <Section number="6" title="Photo and Video Permissions">
          <P>{config.appName} handles photos and camera access in accordance with Google Play's User Data policy. All user photos are treated as personal and sensitive data.</P>

          <SubHeading>Camera Permission</SubHeading>
          <P>{config.appName} uses the <Text style={[styles.highlight, { color: t.primary }]}>android.permission.CAMERA</Text> permission to allow you to photograph objects directly within the app for community sharing.</P>
          <Bullet>To let you take photos of real-world objects using the in-app live viewfinder</Bullet>
          <Bullet>Camera is the core feature — snapping objects is how the community discovers and names things</Bullet>
          <Bullet>The camera activates only when you open the Snap tab or tap "Open Camera"</Bullet>
          <Bullet>Photos are captured only when you press the shutter button — never automatically</Bullet>
          <Bullet>We do not access your camera in the background or when the app is closed</Bullet>
          <Bullet>Flash, zoom, and front/back camera controls are provided for your convenience</Bullet>

          <SubHeading>Photo Library Access — Android Photo Picker</SubHeading>
          <P>On devices running Android 13 (API level 33) and later, {config.appName} uses the <Text style={[styles.highlight, { color: t.primary }]}>Android Photo Picker</Text> (system-provided media picker) to allow you to select photos from your gallery. This means:</P>
          <Bullet>{config.appName} does <Text style={{ fontWeight: '700' }}>NOT</Text> request the READ_MEDIA_IMAGES or READ_MEDIA_VIDEO permissions</Bullet>
          <Bullet>The system photo picker grants access only to the specific photo(s) you select — we never have broad access to your media library</Bullet>
          <Bullet>We cannot browse, scan, index, or read any photos beyond what you explicitly choose to share</Bullet>
          <Bullet>No background access to your photo library occurs at any time</Bullet>
          <P>On older Android versions (below API 33), the system picker or READ_EXTERNAL_STORAGE permission may be used as needed, scoped only to the photos you select for upload.</P>

          <SubHeading>What Happens to Your Photos</SubHeading>
          <Bullet>Photos you submit are uploaded to our secure cloud storage</Bullet>
          <Bullet>Uploaded photos are publicly visible to other users within the app</Bullet>
          <Bullet>You can delete any photo you submitted at any time from your profile</Bullet>
          <Bullet>When you delete a submission, the photo is permanently removed from our servers</Bullet>
          <Bullet>We do not use your photos for advertising, profiling, or any purpose other than displaying them within the {config.appName} community</Bullet>

          <SubHeading>Denying Permissions</SubHeading>
          <P>Camera access is optional. If you deny the camera permission, you can still use the gallery photo picker to submit photos. You can change camera permissions at any time in your device settings.</P>
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
          <Pressable style={[styles.contactCard, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => Linking.openURL('https://discord.gg/2cda4rje')}>
            <MaterialIcons name="forum" size={18} color={t.accent} />
            <Text style={[styles.contactText, { color: t.accent }]}>discord.gg/2cda4rje</Text>
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
  subHeading: { fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, paddingRight: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  bulletText: { fontSize: 15, lineHeight: 24, flex: 1 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  contactText: { fontSize: 15, fontWeight: '600' },
  footer: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  footerText: { fontSize: 11 },
});
