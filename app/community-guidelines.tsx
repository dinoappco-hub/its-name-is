import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../hooks/useTheme';
import { config } from '../constants/config';

const EFFECTIVE_DATE = 'April 3, 2026';

export default function CommunityGuidelinesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t } = useAppTheme();

  const Section = ({ number, title, icon, children }: { number: string; title: string; icon: keyof typeof MaterialIcons.glyphMap; children: React.ReactNode }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionNumber, { backgroundColor: `${t.primary}15` }]}>
          <MaterialIcons name={icon} size={14} color={t.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>{number}. {title}</Text>
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

  const DoDont = ({ type, items }: { type: 'do' | 'dont'; items: string[] }) => {
    const isDo = type === 'do';
    return (
      <View style={[styles.doDontCard, isDo ? { backgroundColor: `${t.success}08`, borderColor: `${t.success}20` } : { backgroundColor: `${t.error}08`, borderColor: `${t.error}20` }]}>
        <View style={styles.doDontHeader}>
          <MaterialIcons name={isDo ? 'check-circle' : 'cancel'} size={16} color={isDo ? t.success : t.error} />
          <Text style={[styles.doDontTitle, { color: isDo ? t.success : t.error }]}>{isDo ? 'Do' : "Don't"}</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={styles.doDontRow}>
            <Text style={[styles.doDontIcon, { color: t.textSecondary }]}>{isDo ? '✓' : '✗'}</Text>
            <Text style={[styles.doDontText, { color: t.textSecondary }]}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const SeverityBadge = ({ level }: { level: 'low' | 'medium' | 'high' | 'severe' }) => {
    const colors: Record<string, { bg: string; text: string }> = {
      low: { bg: `${t.info}15`, text: t.info },
      medium: { bg: `${t.warning}15`, text: t.warning },
      high: { bg: `${t.error}15`, text: t.error },
      severe: { bg: `${t.error}25`, text: t.error },
    };
    return (
      <View style={[styles.severityBadge, { backgroundColor: colors[level].bg }]}>
        <Text style={[styles.severityText, { color: colors[level].text }]}>{level.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Community Guidelines</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.heroIconWrap, { backgroundColor: `${t.primary}12`, borderColor: `${t.primary}25` }]}>
            <MaterialIcons name="groups" size={32} color={t.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: t.textPrimary }]}>Community Guidelines</Text>
          <Text style={[styles.heroDate, { color: t.textSecondary }]}>Effective: {EFFECTIVE_DATE}</Text>
        </View>

        <View style={[styles.introCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.introText, { color: t.textSecondary }]}>
            <Text style={[styles.highlight, { color: t.primary }]}>{config.appName}</Text> is a creative, fun community where everyone names the things they love. These guidelines keep the experience enjoyable and safe for all members.
          </Text>
        </View>

        <View style={styles.valuesRow}>
          {[
            { icon: 'favorite' as const, label: 'Be Kind' },
            { icon: 'palette' as const, label: 'Be Creative' },
            { icon: 'handshake' as const, label: 'Be Respectful' },
          ].map((v) => (
            <View key={v.label} style={[styles.valueChip, { backgroundColor: `${t.primary}10`, borderColor: `${t.primary}20` }]}>
              <MaterialIcons name={v.icon} size={16} color={t.primary} />
              <Text style={[styles.valueText, { color: t.primary }]}>{v.label}</Text>
            </View>
          ))}
        </View>

        <Section number="1" title="Naming Objects" icon="label">
          <P>Naming is the heart of {config.appName}. A great name is creative, funny, or meaningful — and always respectful.</P>
          <DoDont type="do" items={['Give creative, fun, or descriptive names', 'Use wordplay, puns, and clever references', "Name based on the object's appearance, personality, or vibe", 'Suggest names in any language']} />
          <DoDont type="dont" items={['Use slurs, profanity, or hateful language', 'Submit sexually explicit or suggestive names', 'Reference real people in a mocking or harmful way', 'Spam the same name repeatedly across objects', 'Use names designed purely to offend or troll']} />
          <P>Names that violate these rules will be removed. Repeated violations lead to escalating consequences (see Section 6).</P>
        </Section>

        <Section number="2" title="Photo Submissions" icon="photo-camera">
          <P>Photos should showcase the objects you want the community to name. Keep submissions appropriate and genuine.</P>
          <Text style={[styles.subHeading, { color: t.textPrimary }]}>Acceptable Content</Text>
          <Bullet>Stuffed animals, toys, and collectibles</Bullet>
          <Bullet>Vehicles (cars, bikes, scooters) you have named or want named</Bullet>
          <Bullet>Household items (vacuums, appliances, tools)</Bullet>
          <Bullet>Plants, furniture, tech gadgets, musical instruments</Bullet>
          <Bullet>Pets and animals (keep it wholesome)</Bullet>
          <Text style={[styles.subHeading, { color: t.textPrimary }]}>Prohibited Content</Text>
          <Bullet>Nudity, sexually explicit, or graphic material</Bullet>
          <Bullet>Images depicting violence, weapons, or illegal activity</Bullet>
          <Bullet>Photos of other people without their consent</Bullet>
          <Bullet>Copyrighted images you do not own</Bullet>
          <Bullet>Spam, ads, or promotional material</Bullet>
          <Bullet>AI-generated or misleading images presented as real objects</Bullet>
        </Section>

        <Section number="3" title="Voting Etiquette" icon="thumb-up">
          <P>Voting helps the best names rise to the top. Vote honestly and fairly — your votes shape the community experience.</P>
          <DoDont type="do" items={['Upvote names you genuinely find creative or fitting', 'Downvote names that are low-effort or off-topic', 'Consider the object when evaluating a name', 'Vote on many objects to support the community']} />
          <DoDont type="dont" items={['Create multiple accounts to manipulate votes', 'Use bots or automated tools to vote', 'Coordinate voting rings with other users', 'Mass-downvote a specific user out of spite', 'Sell or trade votes']} />
          <P>Vote manipulation is taken seriously and may result in immediate suspension.</P>
        </Section>

        <Section number="4" title="Respectful Interaction" icon="emoji-people">
          <P>Everyone in the {config.appName} community deserves respect, regardless of what they name or submit.</P>
          <Bullet>Treat every member with kindness and courtesy</Bullet>
          <Bullet>Do not harass, bully, or target other users</Bullet>
          <Bullet>Avoid discriminatory language based on race, gender, religion, orientation, or disability</Bullet>
          <Bullet>Do not share personal information about other users</Bullet>
          <Bullet>Disagreements over names are fine — personal attacks are not</Bullet>
          <Bullet>Do not impersonate other users, moderators, or staff</Bullet>
          <P>Remember: behind every submission is a real person who named their vacuum "Vacoom" — and that is beautiful.</P>
        </Section>

        <Section number="5" title="Moderation and Enforcement" icon="gavel">
          <P>Our moderation team reviews reports and flagged content to keep the community safe. Actions are proportional to the severity of the violation.</P>
          <View style={[styles.enforcementCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            {[
              { level: 'low' as const, title: 'Warning', desc: 'First-time minor infractions (mildly inappropriate names, low-quality submissions)' },
              { level: 'medium' as const, title: 'Content Removal', desc: 'Offensive names, prohibited photos, or repeated minor violations' },
              { level: 'high' as const, title: 'Temporary Suspension', desc: 'Harassment, vote manipulation, repeated content violations (7–30 days)' },
              { level: 'severe' as const, title: 'Permanent Ban', desc: 'Hate speech, illegal content, severe harassment, or repeated suspensions' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.level + i}>
                <View style={styles.enforcementRow}>
                  <SeverityBadge level={item.level} />
                  <View style={styles.enforcementContent}>
                    <Text style={[styles.enforcementTitle, { color: t.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.enforcementDesc, { color: t.textSecondary }]}>{item.desc}</Text>
                  </View>
                </View>
                {i < arr.length - 1 ? <View style={[styles.enforcementDivider, { backgroundColor: t.border }]} /> : null}
              </React.Fragment>
            ))}
          </View>
          <P>All enforcement decisions can be appealed by contacting our support team within 14 days.</P>
        </Section>

        <Section number="6" title="Reporting Violations" icon="flag">
          <P>If you see content that violates these guidelines, please report it. Your reports help us maintain a safe and creative community.</P>
          <Bullet>Use the in-app report feature on any submission or name</Bullet>
          <Bullet>Provide specific details about the violation</Bullet>
          <Bullet>Reports are reviewed within 24–48 hours</Bullet>
          <Bullet>All reports are confidential — the reported user will not know who filed the report</Bullet>
          <Bullet>False or malicious reports may result in action against the reporter</Bullet>
        </Section>

        <Section number="7" title="Intellectual Property" icon="copyright">
          <P>Respect the intellectual property of others when submitting content:</P>
          <Bullet>Only submit photos you have taken yourself or have permission to use</Bullet>
          <Bullet>Do not submit trademarked logos or branded content as your own</Bullet>
          <Bullet>Fan art and creative interpretations are welcome if clearly labeled</Bullet>
          <Bullet>If your content is used without permission, contact us for a takedown request</Bullet>
        </Section>

        <Section number="8" title="Guideline Updates" icon="update">
          <P>These guidelines may be updated as our community grows. We will notify users of significant changes through the app. Continued use of {config.appName} after updates constitutes acceptance of the revised guidelines.</P>
          <P>We welcome feedback on these guidelines. If you have suggestions for improvement, reach out to our team.</P>
        </Section>

        <Section number="9" title="Questions or Concerns" icon="help-outline">
          <P>If you have questions about these guidelines or need to report an issue, contact us:</P>
          <Pressable style={[styles.contactCard, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => Linking.openURL('https://discord.gg/2cda4rje')}>
            <MaterialIcons name="forum" size={18} color={t.primary} />
            <Text style={[styles.contactText, { color: t.primary }]}>discord.gg/2cda4rje</Text>
          </Pressable>
        </Section>

        <View style={[styles.closingCard, { backgroundColor: `${t.primary}08`, borderColor: `${t.primary}20` }]}>
          <MaterialIcons name="emoji-objects" size={28} color={t.primary} />
          <Text style={[styles.closingTitle, { color: t.textPrimary }]}>Name Responsibly</Text>
          <Text style={[styles.closingText, { color: t.textSecondary }]}>
            Every object deserves a great name, and every person deserves a great community. Let us keep {config.appName} fun, creative, and welcoming for everyone.
          </Text>
        </View>

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
  introCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1 },
  introText: { fontSize: 15, lineHeight: 24 },
  highlight: { fontWeight: '600' },
  valuesRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28 },
  valueChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  valueText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  sectionNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  sectionBody: { paddingLeft: 42 },
  subHeading: { fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 8 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, paddingRight: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  bulletText: { fontSize: 15, lineHeight: 24, flex: 1 },
  doDontCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  doDontHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  doDontTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  doDontRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  doDontIcon: { fontSize: 13, fontWeight: '700', width: 16, textAlign: 'center', marginTop: 1 },
  doDontText: { fontSize: 14, lineHeight: 22, flex: 1 },
  enforcementCard: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  enforcementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  enforcementDivider: { height: 1 },
  enforcementContent: { flex: 1 },
  enforcementTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  enforcementDesc: { fontSize: 12, lineHeight: 18 },
  severityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  severityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  contactText: { fontSize: 15, fontWeight: '600' },
  closingCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 8, marginBottom: 8, borderWidth: 1 },
  closingTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  closingText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  footer: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  footerText: { fontSize: 11 },
});
