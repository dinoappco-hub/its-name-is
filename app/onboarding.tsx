import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../hooks/useTheme';

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
    subtitle: 'Take a photo of anything around you and share it with the community.',
    icon: 'camera-alt',
  },
  {
    id: '2',
    image: require('../assets/images/onboarding-2.png'),
    title: 'Name & Vote',
    subtitle: 'Give creative names and vote on the best ones. The community decides!',
    icon: 'how-to-vote',
  },
  {
    id: '3',
    image: require('../assets/images/onboarding-3.png'),
    title: 'Rise to the Top',
    subtitle: 'Earn votes, climb the leaderboard, and become a top contributor.',
    icon: 'emoji-events',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors: t } = useAppTheme();
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

      </View>
      <View style={styles.slideContent}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.iconCircle, { backgroundColor: `${t.primary}20` }]}>
            <MaterialIcons name={item.icon} size={28} color={t.primary} />
          </View>
        </Animated.View>
        <Text style={[styles.slideTitle, { color: t.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.slideSubtitle, { color: t.textSecondary }]}>{item.subtitle}</Text>
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
  imageContainer: { flex: 0.55 },
  slideImage: { width: '100%', height: '100%' },

  slideContent: {
    flex: 0.45, paddingHorizontal: 32, paddingTop: 24, alignItems: 'center',
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  slideTitle: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  slideSubtitle: { fontSize: 16, fontWeight: '400', textAlign: 'center', lineHeight: 24 },
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
