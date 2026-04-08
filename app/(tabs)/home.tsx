import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Dimensions, ActivityIndicator, RefreshControl, ScrollView as HScrollView, FlatList, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, runOnJS, Easing } from 'react-native-reanimated';
import { CATEGORIES, CategoryKey } from '../../constants/config';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '@/template';
import { useNotifications } from '../../hooks/useNotifications';
import { ObjectSubmission, User } from '../../services/types';
import { CommunityStats, fetchCommunityStats, fetchRecentActiveUsers } from '../../services/communityService';
import NavigationDrawer from '../../components/NavigationDrawer';
import DinoLoader from '../../components/DinoLoader';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAppTheme } from '../../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_W = (SCREEN_W - 16 * 2 - CARD_GAP) / 2;

type SortMode = 'trending' | 'new' | 'top';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t, typo, isDark, toggleMode } = useAppTheme();
  const { objects, searchObjects, loading, refreshing, refreshObjects, currentUser } = useApp();
  const { unreadCount } = useNotifications();
  const { scaledSize, fontWeight: fw, triggerHaptic, shouldAnimate, subtleTextColor, mutedTextColor, a11yProps } = useAccessibility();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('trending');
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const { user: authUser } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const hasShownWelcome = useRef(false);
  const welcomeProgress = useSharedValue(0);

  const welcomeAnimStyle = useAnimatedStyle(() => ({
    opacity: welcomeProgress.value,
    transform: [{ scale: 0.9 + 0.1 * welcomeProgress.value }],
    maxHeight: welcomeProgress.value * 300,
    marginBottom: welcomeProgress.value * 14,
    overflow: 'hidden' as const,
  }));

  const dismissWelcome = useCallback(() => {
    welcomeProgress.value = withTiming(0, { duration: 600, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setShowWelcome)(false);
    });
  }, []);

  useEffect(() => { loadCommunityData(); }, []);

  // Show welcome banner once after initial load
  useEffect(() => {
    if (!loading && !hasShownWelcome.current && objects.length >= 0) {
      hasShownWelcome.current = true;
      setShowWelcome(true);
      welcomeProgress.value = withTiming(1, { duration: 500 });
      const timer = setTimeout(() => dismissWelcome(), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const loadCommunityData = async () => {
    const [stats, users] = await Promise.all([fetchCommunityStats(), fetchRecentActiveUsers(10)]);
    setCommunityStats(stats);
    setActiveUsers(users);
  };

  const filteredObjects = useMemo(() => {
    let list = search ? searchObjects(search) : objects;
    if (selectedCategory !== 'all') list = list.filter(o => o.category === selectedCategory);
    switch (sortMode) {
      case 'new': return [...list].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      case 'top': return [...list].sort((a, b) => b.totalVotes - a.totalVotes);
      default: return [...list].sort((a, b) => (b.totalVotes * 0.7 + b.viewCount * 0.3) - (a.totalVotes * 0.7 + a.viewCount * 0.3));
    }
  }, [objects, search, sortMode, searchObjects, selectedCategory]);

  const featuredObjects = useMemo(() => objects.filter(o => o.isFeatured).slice(0, 3), [objects]);

  const [dinoRefreshing, setDinoRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setDinoRefreshing(true);
    await Promise.all([refreshObjects(), loadCommunityData()]);
    // Keep dino visible for a satisfying animation duration
    setTimeout(() => setDinoRefreshing(false), 1200);
  }, [refreshObjects]);

  const navigateToUser = useCallback((userId: string) => { Haptics.selectionAsync(); router.push(`/user/${userId}`); }, [router]);

  const renderCard = ({ item, index }: { item: ObjectSubmission; index: number }) => {
    const topName = [...item.suggestedNames].sort((a, b) => b.votes - a.votes)[0];
    return (
      <Animated.View entering={shouldAnimate ? FadeInDown.delay(Math.min(index * 50, 300)).duration(400) : undefined}>
        <Pressable
          style={[styles.card, { backgroundColor: t.surface }]}
          onPress={() => { triggerHaptic('selection'); router.push(`/object/${item.id}`); }}
        >
          <View style={styles.cardImageWrap}>
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} contentFit="cover" transition={200} />
            {item.isFeatured ? (
              <View style={[styles.featuredBadge, { backgroundColor: t.primary }]}>
                <MaterialIcons name="star" size={10} color={t.background} />
                <Text style={[styles.featuredBadgeText, { color: t.background }]}>FEATURED</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.cardContent}>
            {topName ? <Text style={[styles.cardName, { color: t.textPrimary, fontSize: scaledSize(14), fontWeight: fw('600') }]} numberOfLines={1}>{topName.name}</Text> : null}
            <View style={styles.cardMeta}>
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="arrow-upward" size={12} color={t.upvote} />
                <Text style={[styles.cardMetaText, { color: t.textSecondary }]}>{item.totalVotes}</Text>
              </View>
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="chat-bubble-outline" size={12} color={t.textMuted} />
                <Text style={[styles.cardMetaText, { color: t.textSecondary }]}>{item.suggestedNames.length}</Text>
              </View>
            </View>
            <Pressable style={styles.cardUser} onPress={(e) => { e.stopPropagation?.(); navigateToUser(item.submittedBy.id); }} hitSlop={4}>
              <Image source={{ uri: item.submittedBy.avatar }} style={styles.cardAvatar} contentFit="cover" />
              <Text style={[styles.cardUsername, { color: t.textSecondary }]} numberOfLines={1}>@{item.submittedBy.username}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {showWelcome ? (
        <Animated.View style={welcomeAnimStyle}>
          <View style={[styles.welcomeBanner, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={styles.welcomeBannerRow}>
              <View style={[styles.welcomeIconWrap, { backgroundColor: `${t.primary}15` }]}>
                <MaterialIcons name="waving-hand" size={28} color={t.primary} />
              </View>
              <View style={styles.welcomeBannerText}>
                <Text style={[styles.welcomeTitle, { color: t.textPrimary }]}>Welcome back,</Text>
                <Text style={[styles.welcomeName, { color: t.primary }]}>{welcomeDisplayName}!</Text>
              </View>
              <Pressable onPress={dismissWelcome} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={t.textMuted} />
              </Pressable>
            </View>
            <Text style={[styles.welcomeSubtitle, { color: t.textSecondary }]}>Let us see what the community has been naming</Text>
            <View style={styles.welcomeDinos}>
              <DinoLoader message="" size="small" />
            </View>
          </View>
        </Animated.View>
      ) : null}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: t.surface }]}>
          <MaterialIcons name="search" size={20} color={t.textMuted} />
          <TextInput style={[styles.searchInput, { color: t.textPrimary }]} placeholder="Search objects, names..." placeholderTextColor={t.textMuted} value={search} onChangeText={setSearch} />
          {search.length > 0 ? <Pressable onPress={() => setSearch('')}><MaterialIcons name="close" size={18} color={t.textSecondary} /></Pressable> : null}
        </View>
      </View>

      {!search && communityStats ? (
        <Pressable style={[styles.communityBanner, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => { Haptics.selectionAsync(); router.push('/leaderboard'); }}>
          <View style={styles.communityBannerLeft}>
            <MaterialIcons name="people" size={18} color={t.primary} />
            <Text style={[styles.communityBannerText, { color: t.textSecondary }]}>
              <Text style={{ fontWeight: '700', color: t.textPrimary }}>{communityStats.totalUsers.toLocaleString()}</Text> members · <Text style={{ fontWeight: '700', color: t.textPrimary }}>{communityStats.totalObjects.toLocaleString()}</Text> objects · <Text style={{ fontWeight: '700', color: t.textPrimary }}>{communityStats.totalVotes.toLocaleString()}</Text> votes
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={t.textMuted} />
        </Pressable>
      ) : null}

      {!search && activeUsers.length > 0 ? (
        <View style={styles.activeSection}>
          <View style={styles.activeSectionHeader}>
            <Text style={[styles.activeSectionTitle, { color: t.textPrimary }]}>Active Community</Text>
            <Pressable style={styles.leaderboardBtn} onPress={() => { Haptics.selectionAsync(); router.push('/leaderboard'); }}>
              <MaterialIcons name="emoji-events" size={14} color={t.primary} />
              <Text style={[styles.leaderboardBtnText, { color: t.primary }]}>Leaderboard</Text>
            </Pressable>
          </View>
          <HScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeScrollContent}>
            {activeUsers.map((u) => (
              <Pressable key={u.id} style={styles.activeUserItem} onPress={() => navigateToUser(u.id)}>
                <View style={[styles.activeAvatarWrap, { borderColor: t.border }]}>
                  <Image source={{ uri: u.avatar }} style={styles.activeAvatar} contentFit="cover" />
                </View>
                <Text style={[styles.activeUsername, { color: t.textMuted }]} numberOfLines={1}>{u.username}</Text>
              </Pressable>
            ))}
          </HScrollView>
        </View>
      ) : null}

      <View style={styles.categoryBarWrap}>
        <HScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBarScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const count = cat.key === 'all' ? objects.length : objects.filter(o => o.category === cat.key).length;
            return (
              <Pressable key={cat.key} style={[styles.categoryPill, { backgroundColor: t.surface, borderColor: t.border }, isSelected && { backgroundColor: cat.color, borderColor: cat.color }]} onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat.key); }}>
                <MaterialIcons name={cat.icon} size={15} color={isSelected ? '#fff' : cat.color} />
                <Text style={[styles.categoryPillText, { color: t.textSecondary }, isSelected && { color: '#fff' }]}>{cat.label}</Text>
                {count > 0 ? (
                  <View style={[styles.categoryCount, { backgroundColor: t.surfaceElevated }, isSelected && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                    <Text style={[styles.categoryCountText, { color: t.textMuted }, isSelected && { color: '#fff' }]}>{count}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </HScrollView>
      </View>

      {!search && featuredObjects.length > 0 ? (
        <View style={styles.featuredSection}>
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Featured</Text>
          <View style={styles.featuredRow}>
            {featuredObjects.map((obj, idx) => {
              const topN = [...obj.suggestedNames].sort((a, b) => b.votes - a.votes)[0];
              return (
                <Pressable key={obj.id} style={[styles.featuredCard, idx === 0 && styles.featuredCardFirst]} onPress={() => { Haptics.selectionAsync(); router.push(`/object/${obj.id}`); }}>
                  <Image source={{ uri: obj.imageUri }} style={styles.featuredImage} contentFit="cover" transition={200} />
                  <View style={styles.featuredOverlay}>
                    <Text style={styles.featuredName} numberOfLines={1}>{topN?.name || 'Unnamed'}</Text>
                    <View style={styles.featuredBottom}>
                      <View style={styles.featuredVotes}><MaterialIcons name="arrow-upward" size={11} color="#fff" /><Text style={styles.featuredVoteText}>{obj.totalVotes}</Text></View>
                      <Pressable style={styles.featuredUser} onPress={(e) => { e.stopPropagation?.(); navigateToUser(obj.submittedBy.id); }} hitSlop={4}>
                        <Image source={{ uri: obj.submittedBy.avatar }} style={styles.featuredUserAvatar} contentFit="cover" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.sortRow}>
        <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Community</Text>
        <View style={styles.sortChips}>
          {(['trending', 'new', 'top'] as SortMode[]).map(mode => (
            <Pressable key={mode} style={[styles.sortChip, { backgroundColor: t.surface }, sortMode === mode && { backgroundColor: t.primary }]} onPress={() => { Haptics.selectionAsync(); setSortMode(mode); }}>
              <Text style={[styles.sortChipText, { color: t.textSecondary }, sortMode === mode && { color: t.background, fontWeight: '700' }]}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    return (
      <View style={styles.emptyWrap}>
        <MaterialIcons name="photo-camera" size={48} color={t.textMuted} />
        <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No objects yet</Text>
        <Text style={[styles.emptyText, { color: t.textSecondary }]}>Be the first to snap an object and let the community name it!</Text>
        <Pressable style={[styles.emptyBtn, { backgroundColor: t.primary }]} onPress={() => router.navigate('/(tabs)/snap')}>
          <MaterialIcons name="camera-alt" size={18} color={t.background} />
          <Text style={[styles.emptyBtnText, { color: t.background }]}>Snap First Object</Text>
        </Pressable>
      </View>
    );
  };

  const welcomeDisplayName = currentUser.username || authUser?.email?.split('@')[0] || 'Friend';

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.titleRow}>
          <Pressable style={[styles.headerBtn, { backgroundColor: t.surface }]} onPress={() => { triggerHaptic('selection'); setDrawerVisible(true); }}>
            <MaterialIcons name="menu" size={22} color={t.textSecondary} />
          </Pressable>
          <Text style={[styles.title, { color: t.primary, fontSize: scaledSize(24) }]}>its name is.</Text>
          <View style={styles.headerActions}>
            <Pressable style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(245,158,11,0.12)' }]} onPress={() => { triggerHaptic('selection'); toggleMode(); }}>
              <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={20} color={isDark ? '#7C5CFC' : '#F59E0B'} />
            </Pressable>
            <Pressable style={[styles.headerBtn, { backgroundColor: t.surface }]} onPress={() => router.push('/leaderboard')}>
              <MaterialIcons name="emoji-events" size={20} color={t.primary} />
            </Pressable>
            <Pressable style={[styles.headerBtn, { backgroundColor: t.surface }]} onPress={() => router.push('/notifications')}>
              <MaterialIcons name="notifications" size={20} color={t.textSecondary} />
              {unreadCount > 0 ? <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View> : null}
            </Pressable>
          </View>
        </View>
        <View style={styles.centeredLoader}>
          <DinoLoader message="Loading community" size="large" />
        </View>
        <NavigationDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.titleRow}>
        <Pressable style={[styles.headerBtn, { backgroundColor: t.surface }]} onPress={() => { triggerHaptic('selection'); setDrawerVisible(true); }}>
          <MaterialIcons name="menu" size={22} color={t.textSecondary} />
        </Pressable>
        <Text style={[styles.title, { color: t.primary, fontSize: scaledSize(24) }]}>its name is.</Text>
        <View style={styles.headerActions}>
          <Pressable style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(245,158,11,0.12)' }]} onPress={() => { triggerHaptic('selection'); toggleMode(); }}>
            <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={20} color={isDark ? '#7C5CFC' : '#F59E0B'} />
          </Pressable>
          <Pressable style={[styles.headerBtn, { backgroundColor: t.surface }]} onPress={() => router.push('/leaderboard')}>
            <MaterialIcons name="emoji-events" size={20} color={t.primary} />
          </Pressable>
          <Pressable style={[styles.headerBtn, { backgroundColor: t.surface }]} onPress={() => router.push('/notifications')}>
            <MaterialIcons name="notifications" size={20} color={t.textSecondary} />
            {unreadCount > 0 ? <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View> : null}
          </Pressable>
        </View>
      </View>
      <FlatList
        data={filteredObjects}
        renderItem={renderCard}
        numColumns={2}
        ListHeaderComponent={() => (
          <>
            {dinoRefreshing ? (
              <View style={styles.dinoRefreshWrap}>
                <DinoLoader message="Refreshing" size="small" />
              </View>
            ) : null}
            {renderHeader()}
          </>
        )}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || dinoRefreshing}
            onRefresh={handleRefresh}
            tintColor="transparent"
            colors={['transparent']}
            style={Platform.OS === 'android' ? { backgroundColor: 'transparent' } : undefined}
            progressBackgroundColor="transparent"
          />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: CARD_GAP }}
      />
      <NavigationDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  headerContent: { paddingBottom: 8 },
  searchRow: { marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  categoryBarWrap: { marginBottom: 14 },
  categoryBarScroll: { gap: 8 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5 },
  categoryPillText: { fontSize: 11, fontWeight: '600' },
  categoryCount: { borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  categoryCountText: { fontSize: 10, fontWeight: '700' },
  communityBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, borderWidth: 1 },
  communityBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  communityBannerText: { fontSize: 11, fontWeight: '500', flex: 1 },
  activeSection: { marginBottom: 16 },
  activeSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  activeSectionTitle: { fontSize: 15, fontWeight: '600' },
  leaderboardBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  leaderboardBtnText: { fontSize: 11, fontWeight: '700' },
  activeScrollContent: { gap: 12 },
  activeUserItem: { alignItems: 'center', width: 60 },
  activeAvatarWrap: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, overflow: 'hidden', marginBottom: 4 },
  activeAvatar: { width: '100%', height: '100%' },
  activeUsername: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  featuredSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  featuredRow: { flexDirection: 'row', gap: 10 },
  featuredCard: { flex: 1, height: 240, borderRadius: 16, overflow: 'hidden' },
  featuredCardFirst: { flex: 1.5 },
  featuredImage: { width: '100%', height: '100%' },
  featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, paddingTop: 30 },
  featuredName: { fontSize: 13, fontWeight: '600', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  featuredBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  featuredVotes: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  featuredVoteText: { fontSize: 11, fontWeight: '600', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  featuredUser: { width: 22, height: 22, borderRadius: 11, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  featuredUserAvatar: { width: '100%', height: '100%' },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sortChips: { flexDirection: 'row', gap: 6 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  sortChipText: { fontSize: 11, fontWeight: '500' },
  card: { width: CARD_W, marginBottom: CARD_GAP, borderRadius: 12, overflow: 'hidden' },
  cardImageWrap: { width: '100%', aspectRatio: 0.65 },
  cardImage: { width: '100%', height: '100%' },
  featuredBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 3 },
  featuredBadgeText: { fontSize: 9, fontWeight: '700' },
  cardContent: { padding: 10 },
  cardName: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMetaText: { fontSize: 11, fontWeight: '500' },
  cardUser: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardAvatar: { width: 18, height: 18, borderRadius: 9 },
  cardUsername: { fontSize: 11, fontWeight: '500', flex: 1 },
  welcomeBanner: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, alignItems: 'center' },
  welcomeBannerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 },
  welcomeBannerText: { flex: 1, marginLeft: 12 },
  welcomeIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontSize: 14, fontWeight: '500' },
  welcomeName: { fontSize: 20, fontWeight: '700' },
  welcomeSubtitle: { fontSize: 13, fontWeight: '400', textAlign: 'center', lineHeight: 18, marginBottom: 4 },
  welcomeDinos: { marginTop: 4 },
  centeredLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  emptyText: { fontSize: 13, fontWeight: '400', textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '700' },
  dinoRefreshWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 0, paddingBottom: 8, marginTop: -16 },
});
