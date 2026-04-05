import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, FlatList, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  image: any;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    image: require('../assets/images/onboarding-1.png'),
    title: 'Snap Any Object',
    subtitle: 'Take a photo of anything around you and share it with the community. Use your camera or pick from your gallery.',
    icon: 'camera-alt',
  },
  {
    id: '2',
    image: require('../assets/images/onboarding-2.png'),
    title: 'Name & Vote',
    subtitle: 'Give creative names to objects and vote on the best ones. The community decides which names rise to the top.',
    icon: 'how-to-vote',
  },
  {
    id: '3',
    image: require('../assets/images/onboarding-3.png'),
    title: 'Rise to the Top',
    subtitle: 'Earn votes, climb the leaderboard, and go Premium for unlimited submissions and exclusive features.',
    icon: 'emoji-events',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

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

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.slideImage} contentFit="cover" transition={300} />
        <View style={styles.imageOverlay} />
      </View>
      <View style={styles.slideContent}>
        <View style={styles.iconCircle}>
          <MaterialIcons name={item.icon} size={28} color={theme.primary} />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.topBar}>
        {currentIndex > 0 ? (
          <Pressable
            style={styles.skipBtn}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
              setCurrentIndex(currentIndex - 1);
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.textSecondary} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
        {!isLast ? (
          <Pressable style={styles.skipBtn} onPress={completeOnboarding}>
            <Text style={styles.skipText}>Skip</Text>
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
          style={[styles.nextBtn, isLast && styles.nextBtnFinal]}
          onPress={handleNext}
        >
          {isLast ? (
            <Text style={styles.nextBtnText}>Get Started</Text>
          ) : (
            <>
              <Text style={styles.nextBtnText}>Next</Text>
              <MaterialIcons name="arrow-forward" size={20} color={theme.background} />
            </>
          )}
        </Pressable>
        {isLast && (
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radiusFull,
    backgroundColor: 'rgba(255,255,255,0.08)',
    minWidth: 44,
    alignItems: 'center',
  },
  skipText: { ...typography.captionBold, color: theme.textSecondary },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.surfaceElevated,
  },
  dotActive: { width: 24, backgroundColor: theme.primary },
  slide: { flex: 1 },
  imageContainer: { flex: 0.55 },
  slideImage: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
    backgroundColor: 'transparent',
  },
  slideContent: {
    flex: 0.45,
    paddingHorizontal: 32,
    paddingTop: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,215,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  slideTitle: {
    fontSize: 28, fontWeight: '700', color: theme.textPrimary,
    textAlign: 'center', marginBottom: 12,
  },
  slideSubtitle: {
    fontSize: 16, fontWeight: '400', color: theme.textSecondary,
    textAlign: 'center', lineHeight: 24,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    borderRadius: theme.radiusMedium,
    height: 56,
  },
  nextBtnFinal: {
    backgroundColor: theme.primary,
  },
  nextBtnText: {
    fontSize: 17, fontWeight: '700', color: theme.background,
  },
  termsText: {
    ...typography.small,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
