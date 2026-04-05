import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { config } from '../constants/config';

export default function OurStoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Our Story</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image — the kids */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <Image
            source={require('../assets/images/founder-kids.jpg')}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.heroGradient} />
        </Animated.View>

        <View style={styles.content}>
          {/* Founder Badge */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.founderBadge}>
            <MaterialIcons name="favorite" size={14} color={theme.primary} />
            <Text style={styles.founderBadgeText}>From the Creator</Text>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <Text style={styles.storyTitle}>Hi! Thank you for downloading my app!</Text>
          </Animated.View>

          {/* Story - Maria's words */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.storyCard}>
            <View style={styles.quoteBar} />
            <Text style={styles.storyText}>
              Its inspiration came from my dinosaurs that I call my kids (lol) I name everything, down to my vacuum named <Text style={styles.highlight}>Vacoom</Text> and my car <Text style={styles.highlight}>Stormy</Text>.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).duration(400)}>
            <Text style={styles.storyText}>
              I wanted people to see my things that I named and wanted people to do the same. Because I am sure people have named their stuffed animals and cars.
            </Text>
          </Animated.View>

          {/* Meet the kids section */}
          <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.kidsSection}>
            <Text style={styles.kidsSectionTitle}>Meet the Kids</Text>
            <View style={styles.kidsGrid}>
              {[
                { name: 'Steggy', emoji: '🦕' },
                { name: 'Cappy', emoji: '🧸' },
                { name: 'Wallery', emoji: '🦭' },
                { name: 'Dino', emoji: '🦖' },
                { name: 'Branchy', emoji: '🌿' },
              ].map((kid, i) => (
                <View key={kid.name} style={styles.kidChip}>
                  <Text style={styles.kidEmoji}>{kid.emoji}</Text>
                  <Text style={styles.kidName}>{kid.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.storyCard}>
            <View style={styles.quoteBar} />
            <Text style={styles.quoteText}>
              "Thank you and enjoy!"
            </Text>
            <Text style={styles.quoteAuthor}>— Maria D</Text>
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeInUp.delay(800).duration(400)} style={styles.divider} />

          {/* Founder Info */}
          <Animated.View entering={FadeInUp.delay(850).duration(400)} style={styles.founderSection}>
            <View style={styles.founderAvatar}>
              <Text style={styles.founderAvatarText}>M</Text>
            </View>
            <View style={styles.founderInfo}>
              <View style={styles.founderNameRow}>
                <Text style={styles.founderName}>Maria D</Text>
                <View style={styles.modBadge}>
                  <MaterialIcons name="shield" size={10} color={theme.background} />
                  <Text style={styles.modBadgeText}>MOD</Text>
                </View>
              </View>
              <Text style={styles.founderRole}>Creator & Moderator of {config.appName}</Text>
            </View>
          </Animated.View>

          {/* Mission Card */}
          <Animated.View entering={FadeInUp.delay(900).duration(400)} style={styles.missionCard}>
            <MaterialIcons name="emoji-objects" size={28} color={theme.primary} />
            <Text style={styles.missionTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              Because everything deserves a name. Your stuffed animals, your car, your vacuum — snap it, name it, and let the world vote.
            </Text>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInUp.delay(950).duration(400)} style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Creator</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Kids (stuffed)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>You</Text>
              <Text style={styles.statLabel}>The Community</Text>
            </View>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(1000).duration(400)}>
            <Pressable
              style={styles.ctaBtn}
              onPress={() => router.navigate('/(tabs)/snap')}
            >
              <MaterialIcons name="camera-alt" size={20} color={theme.background} />
              <Text style={styles.ctaBtnText}>Start Naming Things</Text>
            </Pressable>
          </Animated.View>
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
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(10,10,15,0.6)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 44,
  },
  headerTitle: {
    ...typography.bodyBold, fontSize: 17,
    marginTop: 44,
  },

  // Hero
  heroImage: {
    width: '100%', height: 340,
  },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Founder badge
  founderBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: theme.radiusFull,
    paddingHorizontal: 14, paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  founderBadgeText: {
    ...typography.captionBold, color: theme.primary,
  },

  // Title
  storyTitle: {
    fontSize: 24, fontWeight: '700', color: theme.textPrimary,
    marginBottom: 20, lineHeight: 32,
  },

  // Story text
  storyText: {
    fontSize: 16, fontWeight: '400', color: theme.textSecondary,
    lineHeight: 26, marginBottom: 20,
  },
  highlight: {
    color: theme.primary, fontWeight: '600',
  },

  // Quote card
  storyCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    position: 'relative',
    overflow: 'hidden',
  },
  quoteBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    backgroundColor: theme.primary,
  },
  quoteText: {
    fontSize: 17, fontWeight: '500', color: theme.textPrimary,
    lineHeight: 26, fontStyle: 'italic',
  },
  quoteAuthor: {
    ...typography.captionBold, color: theme.primary, marginTop: 10,
  },

  // Meet the kids
  kidsSection: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  kidsSectionTitle: {
    ...typography.bodyBold, fontSize: 16, marginBottom: 14,
  },
  kidsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  kidChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: theme.radiusFull,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  kidEmoji: { fontSize: 16 },
  kidName: { ...typography.captionBold, color: theme.primary },

  // Divider
  divider: {
    height: 1, backgroundColor: theme.border,
    marginVertical: 28,
  },

  // Founder section
  founderSection: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  founderAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,215,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  founderAvatarText: {
    fontSize: 22, fontWeight: '700', color: theme.primary,
  },
  founderInfo: { flex: 1, marginLeft: 14 },
  founderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  founderName: { ...typography.bodyBold, fontSize: 16 },
  modBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: theme.accent,
    borderRadius: theme.radiusFull,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  modBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  founderRole: { ...typography.caption, marginTop: 2 },

  // Mission
  missionCard: {
    backgroundColor: 'rgba(255,215,0,0.06)',
    borderRadius: theme.radiusLarge,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  missionTitle: {
    ...typography.subtitle, marginTop: 12, marginBottom: 8,
  },
  missionText: {
    ...typography.body, color: theme.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700', color: theme.primary, marginBottom: 4 },
  statLabel: { ...typography.small, textAlign: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: theme.border },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    borderRadius: theme.radiusMedium,
    height: 54,
    marginBottom: 20,
  },
  ctaBtnText: { ...typography.button, fontSize: 16 },
});
