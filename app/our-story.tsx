import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAppTheme } from '../hooks/useTheme';
import { config } from '../constants/config';

const { width: SCREEN_W } = Dimensions.get('window');

const KIDS = [
  { name: 'Steggy', description: 'Brown Stegosaurus', color: '#8B6914', emoji: '🦖', bgColor: '#8B691415' },
  { name: 'Dino', description: 'Pink Stegosaurus', color: '#E91E8C', emoji: '🦖', bgColor: '#E91E8C15' },
  { name: 'Branchy', description: 'Brown Brachiosaurus', color: '#A0522D', emoji: '🦕', bgColor: '#A0522D15' },
  { name: 'Cappy', description: 'Capybara', color: '#CD853F', emoji: '🐾', bgColor: '#CD853F15' },
  { name: 'Wallrey', description: 'Purple Walrus', color: '#7B2D8E', emoji: '🦭', bgColor: '#7B2D8E15' },
  { name: 'Barney', description: 'Purple Stegosaurus', color: '#9B59B6', emoji: '🦖', bgColor: '#9B59B615' },
];

export default function OurStoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t, typo } = useAppTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Our Story</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero image — contained to fit fully on screen */}
        <Animated.View entering={FadeInDown.duration(500)} style={[styles.heroWrap, { backgroundColor: t.surface }]}>
          <Image
            source={require('../assets/images/founder-kids.jpg')}
            style={styles.heroImage}
            contentFit="contain"
            transition={300}
          />
          <View style={[styles.heroCaption, { backgroundColor: `${t.primary}10` }]}>
            <MaterialIcons name="pets" size={14} color={t.primary} />
            <Text style={[styles.heroCaptionText, { color: t.primary }]}>Maria and the Kids</Text>
          </View>
        </Animated.View>

        <View style={styles.content}>
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={[styles.founderBadge, { backgroundColor: `${t.primary}15`, borderColor: `${t.primary}25` }]}>
            <MaterialIcons name="favorite" size={14} color={t.primary} />
            <Text style={[styles.founderBadgeText, { color: t.primary }]}>From the Creator</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <Text style={[styles.storyTitle, { color: t.textPrimary }]}>Hi! Thank you for downloading my app!</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={[styles.storyCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.quoteBar, { backgroundColor: t.primary }]} />
            <Text style={[styles.storyText, { color: t.textSecondary }]}>
              Its inspiration came from my dinosaurs that I call my kids (lol) I name everything, down to my vacuum named <Text style={[styles.highlight, { color: t.primary }]}>Vacoom</Text> and my car <Text style={[styles.highlight, { color: t.primary }]}>Stormy</Text>.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).duration(400)}>
            <Text style={[styles.storyText, { color: t.textSecondary }]}>
              I wanted people to see my things that I named and wanted people to do the same. Because I am sure people have named their stuffed animals and cars.
            </Text>
          </Animated.View>

          {/* Meet the Kids — labeled grid */}
          <Animated.View entering={FadeInUp.delay(600).duration(400)} style={[styles.kidsSection, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={styles.kidsSectionHeader}>
              <MaterialIcons name="pets" size={20} color={t.primary} />
              <Text style={[styles.kidsSectionTitle, { color: t.textPrimary }]}>Meet the Kids</Text>
            </View>
            <Text style={[styles.kidsIntro, { color: t.textSecondary }]}>
              The stuffed animals that inspired it all
            </Text>
            <View style={styles.kidsGrid}>
              {KIDS.map((kid, index) => (
                <Animated.View
                  key={kid.name}
                  entering={FadeInUp.delay(650 + index * 60).duration(350)}
                  style={[styles.kidCard, { backgroundColor: kid.bgColor, borderColor: `${kid.color}25` }]}
                >
                  <View style={[styles.kidEmojiWrap, { backgroundColor: `${kid.color}20` }]}>
                    <Text style={styles.kidEmoji}>{kid.emoji}</Text>
                  </View>
                  <Text style={[styles.kidName, { color: kid.color }]}>{kid.name}</Text>
                  <Text style={[styles.kidDesc, { color: t.textSecondary }]}>{kid.description}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700).duration(400)} style={[styles.storyCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.quoteBar, { backgroundColor: t.primary }]} />
            <Text style={[styles.quoteText, { color: t.textPrimary }]}>"Thank you and enjoy!"</Text>
            <Text style={[styles.quoteAuthor, { color: t.primary }]}>— Maria D</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(800).duration(400)} style={[styles.divider, { backgroundColor: t.border }]} />

          <Animated.View entering={FadeInUp.delay(850).duration(400)} style={[styles.founderSection, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.founderAvatar, { backgroundColor: `${t.primary}20` }]}>
              <Text style={[styles.founderAvatarText, { color: t.primary }]}>M</Text>
            </View>
            <View style={styles.founderInfo}>
              <View style={styles.founderNameRow}>
                <Text style={[styles.founderName, { color: t.textPrimary }]}>Maria D</Text>
                <View style={[styles.modBadge, { backgroundColor: t.accent }]}>
                  <MaterialIcons name="shield" size={10} color="#fff" />
                  <Text style={styles.modBadgeText}>MOD</Text>
                </View>
              </View>
              <Text style={[styles.founderRole, { color: t.textSecondary }]}>Creator & Moderator of {config.appName}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(900).duration(400)} style={[styles.missionCard, { backgroundColor: `${t.primary}08`, borderColor: `${t.primary}20` }]}>
            <MaterialIcons name="emoji-objects" size={28} color={t.primary} />
            <Text style={[styles.missionTitle, { color: t.textPrimary }]}>Our Mission</Text>
            <Text style={[styles.missionText, { color: t.textSecondary }]}>
              Because everything deserves a name. Your stuffed animals, your car, your vacuum — snap it, name it, and let the world vote.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(950).duration(400)} style={[styles.statsRow, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: t.primary }]}>1</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Creator</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: t.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: t.primary }]}>6</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Kids (stuffed)</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: t.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: t.primary }]}>You</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>The Community</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(1000).duration(400)}>
            <Pressable style={[styles.ctaBtn, { backgroundColor: t.primary }]} onPress={() => router.navigate('/(tabs)/snap')}>
              <MaterialIcons name="camera-alt" size={20} color={t.background} />
              <Text style={[styles.ctaBtnText, { color: t.background }]}>Start Naming Things</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    zIndex: 10,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },

  // Hero image — fully contained
  heroWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroCaption: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroCaptionText: { fontSize: 12, fontWeight: '700' },

  content: { paddingHorizontal: 20, paddingTop: 24 },
  founderBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16, borderWidth: 1 },
  founderBadgeText: { fontSize: 12, fontWeight: '700' },
  storyTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20, lineHeight: 32 },
  storyText: { fontSize: 16, fontWeight: '400', lineHeight: 26, marginBottom: 20 },
  highlight: { fontWeight: '600' },
  storyCard: { borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  quoteBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  quoteText: { fontSize: 17, fontWeight: '500', lineHeight: 26, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 13, fontWeight: '700', marginTop: 10 },

  // Kids section
  kidsSection: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1 },
  kidsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  kidsSectionTitle: { fontSize: 18, fontWeight: '700' },
  kidsIntro: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  kidsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kidCard: {
    width: (SCREEN_W - 40 - 40 - 24) / 4,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  kidEmojiWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kidEmoji: { fontSize: 18 },
  kidName: { fontSize: 11, fontWeight: '700', marginBottom: 1 },
  kidDesc: { fontSize: 9, fontWeight: '500', textAlign: 'center' },

  divider: { height: 1, marginVertical: 28 },
  founderSection: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  founderAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  founderAvatarText: { fontSize: 22, fontWeight: '700' },
  founderInfo: { flex: 1, marginLeft: 14 },
  founderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  founderName: { fontSize: 16, fontWeight: '600' },
  modBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 },
  modBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  founderRole: { fontSize: 12, marginTop: 2 },
  missionCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1 },
  missionTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  missionText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 20, marginBottom: 24, borderWidth: 1 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 11, textAlign: 'center' },
  statDivider: { width: 1, height: 36 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, height: 54, marginBottom: 20 },
  ctaBtnText: { fontSize: 16, fontWeight: '700' },
});
