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
  icon: keyof typeof MaterialIcons.glyphMap;
  children: React.ReactNode;
}

function Section({ number, title, icon, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <MaterialIcons name={icon} size={14} color={theme.primary} />
        </View>
        <Text style={styles.sectionTitle}>{number}. {title}</Text>
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

function DoDont({ type, items }: { type: 'do' | 'dont'; items: string[] }) {
  const isDo = type === 'do';
  return (
    <View style={[styles.doDontCard, isDo ? styles.doCard : styles.dontCard]}>
      <View style={styles.doDontHeader}>
        <MaterialIcons
          name={isDo ? 'check-circle' : 'cancel'}
          size={16}
          color={isDo ? theme.success : theme.error}
        />
        <Text style={[styles.doDontTitle, { color: isDo ? theme.success : theme.error }]}>
          {isDo ? 'Do' : "Don't"}
        </Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.doDontRow}>
          <Text style={styles.doDontIcon}>{isDo ? '✓' : '✗'}</Text>
          <Text style={styles.doDontText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function SeverityBadge({ level }: { level: 'low' | 'medium' | 'high' | 'severe' }) {
  const colors = {
    low: { bg: 'rgba(59,130,246,0.12)', text: theme.info },
    medium: { bg: 'rgba(245,158,11,0.12)', text: theme.warning },
    high: { bg: 'rgba(239,68,68,0.12)', text: theme.error },
    severe: { bg: 'rgba(239,68,68,0.2)', text: theme.error },
  };
  return (
    <View style={[styles.severityBadge, { backgroundColor: colors[level].bg }]}>
      <Text style={[styles.severityText, { color: colors[level].text }]}>
        {level.toUpperCase()}
      </Text>
    </View>
  );
}

export default function CommunityGuidelinesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Community Guidelines</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <MaterialIcons name="groups" size={32} color={theme.primary} />
          </View>
          <Text style={styles.heroTitle}>Community Guidelines</Text>
          <Text style={styles.heroDate}>Effective: {EFFECTIVE_DATE}</Text>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introText}>
            <Text style={styles.highlight}>{config.appName}</Text> is a creative, fun community where everyone names the things they love. These guidelines keep the experience enjoyable and safe for all members.
          </Text>
        </View>

        {/* Core Values */}
        <View style={styles.valuesRow}>
          {[
            { icon: 'favorite' as const, label: 'Be Kind' },
            { icon: 'palette' as const, label: 'Be Creative' },
            { icon: 'handshake' as const, label: 'Be Respectful' },
          ].map((v) => (
            <View key={v.label} style={styles.valueChip}>
              <MaterialIcons name={v.icon} size={16} color={theme.primary} />
              <Text style={styles.valueText}>{v.label}</Text>
            </View>
          ))}
        </View>

        {/* Section 1: Naming Objects */}
        <Section number="1" title="Naming Objects" icon="label">
          <P>
            Naming is the heart of {config.appName}. A great name is creative, funny, or meaningful — and always respectful.
          </P>

          <DoDont
            type="do"
            items={[
              'Give creative, fun, or descriptive names',
              'Use wordplay, puns, and clever references',
              'Name based on the object\'s appearance, personality, or vibe',
              'Suggest names in any language',
            ]}
          />

          <DoDont
            type="dont"
            items={[
              'Use slurs, profanity, or hateful language',
              'Submit sexually explicit or suggestive names',
              'Reference real people in a mocking or harmful way',
              'Spam the same name repeatedly across objects',
              'Use names designed purely to offend or troll',
            ]}
          />

          <P>
            Names that violate these rules will be removed. Repeated violations lead to escalating consequences (see Section 6).
          </P>
        </Section>

        {/* Section 2: Photo Submissions */}
        <Section number="2" title="Photo Submissions" icon="photo-camera">
          <P>Photos should showcase the objects you want the community to name. Keep submissions appropriate and genuine.</P>

          <Text style={styles.subHeading}>Acceptable Content</Text>
          <Bullet>Stuffed animals, toys, and collectibles</Bullet>
          <Bullet>Vehicles (cars, bikes, scooters) you have named or want named</Bullet>
          <Bullet>Household items (vacuums, appliances, tools)</Bullet>
          <Bullet>Plants, furniture, tech gadgets, musical instruments</Bullet>
          <Bullet>Pets and animals (keep it wholesome)</Bullet>

          <Text style={styles.subHeading}>Prohibited Content</Text>
          <Bullet>Nudity, sexually explicit, or graphic material</Bullet>
          <Bullet>Images depicting violence, weapons, or illegal activity</Bullet>
          <Bullet>Photos of other people without their consent</Bullet>
          <Bullet>Copyrighted images you do not own</Bullet>
          <Bullet>Spam, ads, or promotional material</Bullet>
          <Bullet>AI-generated or misleading images presented as real objects</Bullet>
        </Section>

        {/* Section 3: Voting Etiquette */}
        <Section number="3" title="Voting Etiquette" icon="thumb-up">
          <P>
            Voting helps the best names rise to the top. Vote honestly and fairly — your votes shape the community experience.
          </P>

          <DoDont
            type="do"
            items={[
              'Upvote names you genuinely find creative or fitting',
              'Downvote names that are low-effort or off-topic',
              'Consider the object when evaluating a name',
              'Vote on many objects to support the community',
            ]}
          />

          <DoDont
            type="dont"
            items={[
              'Create multiple accounts to manipulate votes',
              'Use bots or automated tools to vote',
              'Coordinate voting rings with other users',
              'Mass-downvote a specific user out of spite',
              'Sell or trade votes',
            ]}
          />

          <P>
            Vote manipulation is taken seriously and may result in immediate suspension.
          </P>
        </Section>

        {/* Section 4: Respectful Interaction */}
        <Section number="4" title="Respectful Interaction" icon="emoji-people">
          <P>Everyone in the {config.appName} community deserves respect, regardless of what they name or submit.</P>

          <Bullet>Treat every member with kindness and courtesy</Bullet>
          <Bullet>Do not harass, bully, or target other users</Bullet>
          <Bullet>Avoid discriminatory language based on race, gender, religion, orientation, or disability</Bullet>
          <Bullet>Do not share personal information about other users</Bullet>
          <Bullet>Disagreements over names are fine — personal attacks are not</Bullet>
          <Bullet>Do not impersonate other users, moderators, or staff</Bullet>

          <P>
            Remember: behind every submission is a real person who named their vacuum "Vacoom" — and that is beautiful.
          </P>
        </Section>

        {/* Section 5: Moderation & Enforcement */}
        <Section number="5" title="Moderation and Enforcement" icon="gavel">
          <P>
            Our moderation team reviews reports and flagged content to keep the community safe. Actions are proportional to the severity of the violation.
          </P>

          <View style={styles.enforcementCard}>
            <View style={styles.enforcementRow}>
              <SeverityBadge level="low" />
              <View style={styles.enforcementContent}>
                <Text style={styles.enforcementTitle}>Warning</Text>
                <Text style={styles.enforcementDesc}>First-time minor infractions (mildly inappropriate names, low-quality submissions)</Text>
              </View>
            </View>
            <View style={styles.enforcementDivider} />
            <View style={styles.enforcementRow}>
              <SeverityBadge level="medium" />
              <View style={styles.enforcementContent}>
                <Text style={styles.enforcementTitle}>Content Removal</Text>
                <Text style={styles.enforcementDesc}>Offensive names, prohibited photos, or repeated minor violations</Text>
              </View>
            </View>
            <View style={styles.enforcementDivider} />
            <View style={styles.enforcementRow}>
              <SeverityBadge level="high" />
              <View style={styles.enforcementContent}>
                <Text style={styles.enforcementTitle}>Temporary Suspension</Text>
                <Text style={styles.enforcementDesc}>Harassment, vote manipulation, repeated content violations (7–30 days)</Text>
              </View>
            </View>
            <View style={styles.enforcementDivider} />
            <View style={styles.enforcementRow}>
              <SeverityBadge level="severe" />
              <View style={styles.enforcementContent}>
                <Text style={styles.enforcementTitle}>Permanent Ban</Text>
                <Text style={styles.enforcementDesc}>Hate speech, illegal content, severe harassment, or repeated suspensions</Text>
              </View>
            </View>
          </View>

          <P>
            All enforcement decisions can be appealed by contacting our support team within 14 days.
          </P>
        </Section>

        {/* Section 6: Reporting */}
        <Section number="6" title="Reporting Violations" icon="flag">
          <P>
            If you see content that violates these guidelines, please report it. Your reports help us maintain a safe and creative community.
          </P>

          <Bullet>Use the in-app report feature on any submission or name</Bullet>
          <Bullet>Provide specific details about the violation</Bullet>
          <Bullet>Reports are reviewed within 24–48 hours</Bullet>
          <Bullet>All reports are confidential — the reported user will not know who filed the report</Bullet>
          <Bullet>False or malicious reports may result in action against the reporter</Bullet>
        </Section>

        {/* Section 7: Intellectual Property */}
        <Section number="7" title="Intellectual Property" icon="copyright">
          <P>Respect the intellectual property of others when submitting content:</P>

          <Bullet>Only submit photos you have taken yourself or have permission to use</Bullet>
          <Bullet>Do not submit trademarked logos or branded content as your own</Bullet>
          <Bullet>Fan art and creative interpretations are welcome if clearly labeled</Bullet>
          <Bullet>If your content is used without permission, contact us for a takedown request</Bullet>
        </Section>

        {/* Section 8: Updates */}
        <Section number="8" title="Guideline Updates" icon="update">
          <P>
            These guidelines may be updated as our community grows. We will notify users of significant changes through the app. Continued use of {config.appName} after updates constitutes acceptance of the revised guidelines.
          </P>
          <P>
            We welcome feedback on these guidelines. If you have suggestions for improvement, reach out to our team.
          </P>
        </Section>

        {/* Section 9: Contact */}
        <Section number="9" title="Questions or Concerns" icon="help-outline">
          <P>If you have questions about these guidelines or need to report an issue, contact us:</P>
          <Pressable style={styles.contactCard} onPress={() => Linking.openURL('https://discord.gg/2cda4rje')}>
            <MaterialIcons name="forum" size={18} color={theme.primary} />
            <Text style={styles.contactText}>discord.gg/2cda4rje</Text>
          </Pressable>
        </Section>

        {/* Closing */}
        <View style={styles.closingCard}>
          <MaterialIcons name="emoji-objects" size={28} color={theme.primary} />
          <Text style={styles.closingTitle}>Name Responsibly</Text>
          <Text style={styles.closingText}>
            Every object deserves a great name, and every person deserves a great community. Let us keep {config.appName} fun, creative, and welcoming for everyone.
          </Text>
        </View>

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
    marginBottom: 20,
    borderWidth: 1, borderColor: theme.border,
  },
  introText: { ...typography.body, color: theme.textSecondary, lineHeight: 24 },
  highlight: { color: theme.primary, fontWeight: '600' },

  valuesRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 10,
    marginBottom: 28,
  },
  valueChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: theme.radiusFull,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  valueText: { ...typography.captionBold, color: theme.primary },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  sectionNumber: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,215,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { ...typography.bodyBold, fontSize: 16, flex: 1 },
  sectionBody: { paddingLeft: 42 },

  subHeading: {
    ...typography.captionBold, color: theme.textPrimary,
    marginTop: 10, marginBottom: 8,
  },

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

  // Do / Don't cards
  doDontCard: {
    borderRadius: theme.radiusMedium,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  doCard: {
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderColor: 'rgba(16,185,129,0.15)',
  },
  dontCard: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderColor: 'rgba(239,68,68,0.15)',
  },
  doDontHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10,
  },
  doDontTitle: { ...typography.captionBold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  doDontRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  doDontIcon: { fontSize: 13, fontWeight: '700', color: theme.textSecondary, width: 16, textAlign: 'center', marginTop: 1 },
  doDontText: { ...typography.body, color: theme.textSecondary, lineHeight: 22, flex: 1, fontSize: 14 },

  // Enforcement
  enforcementCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1, borderColor: theme.border,
  },
  enforcementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  enforcementDivider: { height: 1, backgroundColor: theme.border },
  enforcementContent: { flex: 1 },
  enforcementTitle: { ...typography.bodyBold, fontSize: 14, marginBottom: 2 },
  enforcementDesc: { ...typography.caption, lineHeight: 18 },
  severityBadge: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2,
  },
  severityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Contact
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 14,
    borderWidth: 1, borderColor: theme.border,
  },
  contactText: { ...typography.bodyBold, color: theme.primary },

  // Closing
  closingCard: {
    backgroundColor: 'rgba(255,215,0,0.06)',
    borderRadius: theme.radiusLarge,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  closingTitle: { ...typography.subtitle, marginTop: 12, marginBottom: 8 },
  closingText: {
    ...typography.body, color: theme.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },

  footer: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  footerText: { ...typography.small, color: theme.textMuted },
});
