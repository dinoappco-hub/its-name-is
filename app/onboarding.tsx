import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, FlatList, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');

interface SampleName {
  id: string;
  name: string;
  votes: number;
  emoji: string;
}

interface OnboardingSlide {
  id: string;
  image: any;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  interactive?: 'snap' | 'vote' | 'leaderboard';
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    image: require('../assets/images/onboarding-1.png'),
    title: 'Snap Any Object',
    subtitle: 'Take a photo of anything around you and share it with the community.',
    icon: 'camera-alt',
    interactive: 'snap',
  },
  {
    id: '2',
    image: require('../assets/images/onboarding-2.png'),
    title: 'Name & Vote',
    subtitle: 'Give creative names and vote on the best ones. Try it now!',
    icon: 'how-to-vote',
    interactive: 'vote',
  },
  {
    id: '3',
    image: require('../assets/images/onboarding-3.png'),
    title: 'Rise to the Top',
    subtitle: 'Earn votes, climb the leaderboard, and become a top contributor.',
    icon: 'emoji-events',
    interactive: 'leaderboard',
  },
];

const INITIAL_NAMES: SampleName[] = [
  { id: '1', name: 'Sir Fluffington', votes: 12, emoji: '🧸' },
  { id: '2', name: 'Captain Wobbles', votes: 8, emoji: '🎩' },
  { id: '3', name: 'Professor Snuggles', votes: 5, emoji: '🎓' },
];

const LEADERBOARD_DATA = [
  { rank: 1, name: 'DinoLover42', score: 342, emoji: '🥇' },
  { rank: 2, name: 'SnapQueen', score: 289, emoji: '🥈' },
  { rank: 3, name: 'NameWizard', score: 215, emoji: '🥉' },
  { rank: 4, name: 'You?', score: '???', emoji: '🌟' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Interactive voting state
  const [sampleNames, setSampleNames] = useState<SampleName[]>(INITIAL_NAMES);
  const [votedNames, setVotedNames] = useState<Set<string>>(new Set());
  const [snapTapped, setSnapTapped] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);

  const handleVoteName = useCallback((nameId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const alreadyVoted = votedNames.has(nameId);
    setSampleNames(prev => prev.map(n => {
      if (n.id !== nameId) return n;
      return { ...n, votes: alreadyVoted ? n.votes - 1 : n.votes + 1 };
    }).sort((a, b) => b.votes - a.votes));
    setVotedNames(prev => {
      const next = new Set(prev);
      if (alreadyVoted) { next.delete(nameId); } else { next.add(nameId); }
      return next;
    });
  }, [votedNames]);

  const handleSnapTap = useCallback(() => {
    if (snapTapped) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 200);
    setSnapTapped(true);
  }, [snapTapped]);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('snapname_onboarded', 'true');
    router.replace('/');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const renderSnapDemo = () => (
    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.demoContainer}>
      <Pressable onPress={handleSnapTap} style={[styles.snapDemoCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        {flashVisible ? (
          <Animated.View entering={ZoomIn.duration(150)} style={[StyleSheet.absoluteFill, styles.flashOverlay]} />
        ) : null}
        <View style={[styles.snapViewfinder, { backgroundColor: t.backgroundSecondary }]}>
          {snapTapped ? (
            <Animated.View entering={ZoomIn.duration(300)} style={styles.snapResult}>
              <MaterialIcons name="check-circle" size={36} color={t.primary} />
              <Text style={[styles.snapResultText, { color: t.primary }]}>Photo captured!</Text>
            </Animated.View>
          ) : (
            <View style={styles.snapPrompt}>
              <View style={[styles.snapCrosshair, { borderColor: `${t.primary}60` }]} />
              <MaterialIcons name="touch-app" size={28} color={t.primary} />
              <Text style={[styles.snapPromptText, { color: t.textSecondary }]}>Tap to snap</Text>
            </View>
          )}
        </View>
        {snapTapped ? (
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.snapCaption}>
            <MaterialIcons name="auto-awesome" size={14} color={t.primary} />
            <Text style={[styles.snapCaptionText, { color: t.textSecondary }]}>Now the community names it!</Text>
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );

  const renderVoteDemo = () => (
    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.demoContainer}>
      <View style={[styles.voteDemoCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.voteDemoHeader}>
          <View style={[styles.voteDemoImg, { backgroundColor: t.backgroundSecondary }]}>
            <Text style={styles.voteDemoEmoji}>🧸</Text>
          </View>
          <View style={styles.voteDemoInfo}>
            <Text style={[styles.voteDemoTitle, { color: t.textPrimary }]}>What is its name?</Text>
            <Text style={[styles.voteDemoSub, { color: t.textMuted }]}>Tap to vote on your favorite!</Text>
          </View>
        </View>
        {sampleNames.map((item, idx) => {
          const isVoted = votedNames.has(item.id);
          return (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(400 + idx * 100).duration(350)}
            >
              <Pressable
                style={[
                  styles.voteNameRow,
                  { backgroundColor: t.backgroundSecondary, borderColor: t.border },
                  isVoted && { backgroundColor: `${t.primary}12`, borderColor: `${t.primary}40` },
                ]}
                onPress={() => handleVoteName(item.id)}
              >
                <View style={styles.voteNameLeft}>
                  <Text style={styles.voteNameEmoji}>{item.emoji}</Text>
                  <Text style={[styles.voteNameText, { color: t.textPrimary }, isVoted && { color: t.primary, fontWeight: '700' }]}>{item.name}</Text>
                </View>
                <View style={styles.voteNameRight}>
                  <Animated.View
                    key={`vote-${item.id}-${item.votes}`}
                    entering={ZoomIn.duration(200)}
                  >
                    <Text style={[styles.voteCount, { color: isVoted ? t.primary : t.textSecondary }]}>{item.votes}</Text>
                  </Animated.View>
                  <MaterialIcons
                    name={isVoted ? 'thumb-up' : 'thumb-up-off-alt'}
                    size={20}
                    color={isVoted ? t.primary : t.textMuted}
                  />
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderLeaderboardDemo = () => (
    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.demoContainer}>
      <View style={[styles.leaderboardCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        {LEADERBOARD_DATA.map((entry, idx) => {
          const isYou = entry.rank === 4;
          return (
            <Animated.View
              key={entry.rank}
              entering={FadeInDown.delay(400 + idx * 120).duration(350)}
            >
              <View style={[
                styles.leaderRow,
                { borderBottomColor: t.border },
                idx === LEADERBOARD_DATA.length - 1 && { borderBottomWidth: 0 },
                isYou && { backgroundColor: `${t.primary}10` },
              ]}>
                <Text style={styles.leaderEmoji}>{entry.emoji}</Text>
                <View style={styles.leaderInfo}>
                  <Text style={[
                    styles.leaderName,
                    { color: isYou ? t.primary : t.textPrimary },
                    isYou && { fontWeight: '700', fontStyle: 'italic' },
                  ]}>{entry.name}</Text>
                  <Text style={[styles.leaderScore, { color: t.textMuted }]}>
                    {typeof entry.score === 'number' ? `${entry.score} votes` : entry.score}
                  </Text>
                </View>
                {entry.rank <= 3 ? (
                  <View style={[styles.leaderBadge, { backgroundColor: `${t.primary}15` }]}>
                    <Text style={[styles.leaderBadgeText, { color: t.primary }]}>#{entry.rank}</Text>
                  </View>
                ) : (
                  <View style={[styles.leaderBadge, { backgroundColor: `${t.primary}20` }]}>
                    <MaterialIcons name="arrow-upward" size={14} color={t.primary} />
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.slideImage} contentFit="cover" transition={300} />
        <View style={[styles.imageGradient, { backgroundColor: t.background }]} />
      </View>
      <View style={styles.slideContent}>
        <View style={[styles.iconCircle, { backgroundColor: `${t.primary}20` }]}>
          <MaterialIcons name={item.icon} size={28} color={t.primary} />
        </View>
        <Text style={[styles.slideTitle, { color: t.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.slideSubtitle, { color: t.textSecondary }]}>{item.subtitle}</Text>

        {item.interactive === 'snap' ? renderSnapDemo() : null}
        {item.interactive === 'vote' ? renderVoteDemo() : null}
        {item.interactive === 'leaderboard' ? renderLeaderboardDemo() : null}
      </View>
    </View>
  );

  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <SafeAreaView edges={['top']} style={styles.topBar}>
        {currentIndex > 0 ? (
          <Pressable
            style={[styles.navBtn, { backgroundColor: `${t.textSecondary}15` }]}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
              setCurrentIndex(currentIndex - 1);
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color={t.textSecondary} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: t.surfaceElevated },
                i === currentIndex && [styles.dotActive, { backgroundColor: t.primary }],
              ]}
            />
          ))}
        </View>
        {!isLast ? (
          <Pressable style={[styles.navBtn, { backgroundColor: `${t.textSecondary}15` }]} onPress={completeOnboarding}>
            <Text style={[styles.skipText, { color: t.textSecondary }]}>Skip</Text>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </SafeAreaView>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <Pressable
          style={[styles.nextBtn, { backgroundColor: t.primary }]}
          onPress={handleNext}
        >
          {isLast ? (
            <>
              <Text style={[styles.nextBtnText, { color: t.background }]}>Get Started</Text>
              <MaterialIcons name="arrow-forward" size={20} color={t.background} />
            </>
          ) : (
            <>
              <Text style={[styles.nextBtnText, { color: t.background }]}>Next</Text>
              <MaterialIcons name="arrow-forward" size={20} color={t.background} />
            </>
          )}
        </Pressable>
        {isLast ? (
          <Text style={[styles.termsText, { color: t.textMuted }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8,
  },
  navBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999,
    minWidth: 44, alignItems: 'center',
  },
  skipText: { fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  slide: { flex: 1 },
  imageContainer: { flex: 0.35 },
  slideImage: { width: '100%', height: '100%' },
  imageGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, opacity: 0.9,
  },
  slideContent: {
    flex: 0.65, paddingHorizontal: 24, paddingTop: 20, alignItems: 'center',
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  slideTitle: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  slideSubtitle: { fontSize: 14, fontWeight: '400', textAlign: 'center', lineHeight: 21, marginBottom: 6 },

  // Demo Container
  demoContainer: { width: '100%', marginTop: 12 },

  // Snap Demo
  snapDemoCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  snapViewfinder: {
    height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  flashOverlay: { backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 10, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  snapPrompt: { alignItems: 'center', gap: 6 },
  snapCrosshair: {
    position: 'absolute', width: 60, height: 60, borderWidth: 2, borderRadius: 4,
  },
  snapPromptText: { fontSize: 13, fontWeight: '600' },
  snapResult: { alignItems: 'center', gap: 6 },
  snapResultText: { fontSize: 15, fontWeight: '700' },
  snapCaption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  snapCaptionText: { fontSize: 13, fontWeight: '500' },

  // Vote Demo
  voteDemoCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  voteDemoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  voteDemoImg: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  voteDemoEmoji: { fontSize: 24 },
  voteDemoInfo: { flex: 1 },
  voteDemoTitle: { fontSize: 15, fontWeight: '700' },
  voteDemoSub: { fontSize: 11, fontWeight: '400', marginTop: 2 },
  voteNameRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  voteNameLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  voteNameEmoji: { fontSize: 18 },
  voteNameText: { fontSize: 14, fontWeight: '500' },
  voteNameRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voteCount: { fontSize: 15, fontWeight: '700', minWidth: 24, textAlign: 'right' },

  // Leaderboard Demo
  leaderboardCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, gap: 12,
  },
  leaderEmoji: { fontSize: 22 },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: '600' },
  leaderScore: { fontSize: 11, fontWeight: '400', marginTop: 2 },
  leaderBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
  },
  leaderBadgeText: { fontSize: 12, fontWeight: '700' },

  // Bottom
  bottomBar: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, height: 56,
  },
  nextBtnText: { fontSize: 17, fontWeight: '700' },
  termsText: {
    fontSize: 11, fontWeight: '500', textAlign: 'center', marginTop: 12, lineHeight: 16,
  },
});
