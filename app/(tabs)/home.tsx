import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Dimensions, ActivityIndicator, RefreshControl, ScrollView as HScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useNotifications } from '../../hooks/useNotifications';
import { ObjectSubmission, User } from '../../services/types';

import { CommunityStats, fetchCommunityStats, fetchRecentActiveUsers } from '../../services/communityService';
import NavigationDrawer from '../../components/NavigationDrawer';
import { useAccessibility } from '../../hooks/useAccessibility';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_W = (SCREEN_W - 16 * 2 - CARD_GAP) / 2;

type SortMode = 'trending' | 'new' | 'top';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { objects, searchObjects, loading, refreshing, refreshObjects } = useApp();
  const { unreadCount } = useNotifications();
  const { scaledSize, fontWeight: fw, triggerHaptic, shouldAnimate, subtleTextColor, mutedTextColor, a11yProps } = useAccessibility();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('trending');
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    const [stats, users] = await Promise.all([
      fetchCommunityStats(),
      fetchRecentActiveUsers(10),
    ]);
    setCommunityStats(stats);
    setActiveUsers(users);
  };

  const filteredObjects = useMemo(() => {
    const list = search ? searchObjects(search) : objects;
    switch (sortMode) {
      case 'new': return [...list].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      case 'top': return [...list].sort((a, b) => b.totalVotes - a.totalVotes);
      default: return [...list].sort((a, b) => (b.totalVotes * 0.7 + b.viewCount * 0.3) - (a.totalVotes * 0.7 + a.viewCount * 0.3));
    }
  }, [objects, search, sortMode, searchObjects]);

  const featuredObjects = useMemo(() => objects.filter(o => o.isFeatured).slice(0, 3), [objects]);

  const handleRefresh = useCallback(() => {
    refreshObjects();
    loadCommunityData();
  }, [refreshObjects]);

  const navigateToUser = useCallback((userId: string) => {
    Haptics.selectionAsync();
    router.push(`/user/${userId}`);
  }, [router]);

  const renderCard = ({ item, index }: { item: ObjectSubmission; index: number }) => {
    const topName = [...item.suggestedNames].sort((a, b) => b.votes - a.votes)[0];
    return (
      <Animated.View entering={shouldAnimate ? FadeInDown.delay(Math.min(index * 50, 300)).duration(400) : undefined}>
        <Pressable
          style={styles.card}
          onPress={() => {
            triggerHaptic('selection');
            router.push(`/object/${item.id}`);
          }}
        >
          <View style={styles.cardImageWrap}>
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} contentFit="cover" transition={200} />
            {item.isFeatured ? (
              <View style={styles.featuredBadge}>
                <MaterialIcons name="star" size={10} color={theme.background} />
                <Text style={styles.featuredBadgeText}>FEATURED</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.cardContent}>
            {topName ? (
              <Text style={[styles.cardName, { fontSize: scaledSize(14), fontWeight: fw('600') }]} numberOfLines={1}>{topName.name}</Text>
            ) : null}
            <View style={styles.cardMeta}>
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="arrow-upward" size={12} color={theme.upvote} />
                <Text style={styles.cardMetaText}>{item.totalVotes}</Text>
              </View>
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="chat-bubble-outline" size={12} color={theme.textMuted} />
                <Text style={styles.cardMetaText}>{item.suggestedNames.length}</Text>
              </View>

            </View>
            <Pressable
              style={styles.cardUser}
              onPress={(e) => {
                e.stopPropagation?.();
                navigateToUser(item.submittedBy.id);
              }}
              hitSlop={4}
            >
              <Image source={{ uri: item.submittedBy.avatar }} style={styles.cardAvatar} contentFit="cover" />
              <Text style={styles.cardUsername} numberOfLines={1}>@{item.submittedBy.username}</Text>

            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search objects, names..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Community Stats Strip */}
      {!search && communityStats ? (
        <Pressable
          style={styles.communityBanner}
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/leaderboard');
          }}
        >
          <View style={styles.communityBannerLeft}>
            <MaterialIcons name="people" size={18} color={theme.primary} />
            <Text style={styles.communityBannerText}>
              <Text style={styles.communityBannerHighlight}>{communityStats.totalUsers.toLocaleString()}</Text> members · <Text style={styles.communityBannerHighlight}>{communityStats.totalObjects.toLocaleString()}</Text> objects · <Text style={styles.communityBannerHighlight}>{communityStats.totalVotes.toLocaleString()}</Text> votes
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
        </Pressable>
      ) : null}

      {/* Active Community Members */}
      {!search && activeUsers.length > 0 ? (
        <View style={styles.activeSection}>
          <View style={styles.activeSectionHeader}>
            <Text style={styles.activeSectionTitle}>Active Community</Text>
            <Pressable
              style={styles.leaderboardBtn}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/leaderboard');
              }}
            >
              <MaterialIcons name="emoji-events" size={14} color={theme.primary} />
              <Text style={styles.leaderboardBtnText}>Leaderboard</Text>
            </Pressable>
          </View>
          <HScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeScrollContent}
          >
            {activeUsers.map((u) => (
              <Pressable
                key={u.id}
                style={styles.activeUserItem}
                onPress={() => navigateToUser(u.id)}
              >
                <View style={[styles.activeAvatarWrap, u.isPremium && styles.activeAvatarPremium]}>
                  <Image source={{ uri: u.avatar }} style={styles.activeAvatar} contentFit="cover" />
                </View>
                <Text style={styles.activeUsername} numberOfLines={1}>{u.username}</Text>
              </Pressable>
            ))}
          </HScrollView>
        </View>
      ) : null}

      {!search && featuredObjects.length > 0 ? (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <View style={styles.featuredRow}>
            {featuredObjects.map((obj, idx) => {
              const topN = [...obj.suggestedNames].sort((a, b) => b.votes - a.votes)[0];
              return (
                <Pressable
                  key={obj.id}
                  style={[styles.featuredCard, idx === 0 && styles.featuredCardFirst]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/object/${obj.id}`);
                  }}
                >
                  <Image source={{ uri: obj.imageUri }} style={styles.featuredImage} contentFit="cover" transition={200} />
                  <View style={styles.featuredOverlay}>
                    <Text style={styles.featuredName} numberOfLines={1}>{topN?.name || 'Unnamed'}</Text>
                    <View style={styles.featuredBottom}>
                      <View style={styles.featuredVotes}>
                        <MaterialIcons name="arrow-upward" size={11} color="#fff" />
                        <Text style={styles.featuredVoteText}>{obj.totalVotes}</Text>
                      </View>
                      <Pressable
                        style={styles.featuredUser}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          navigateToUser(obj.submittedBy.id);
                        }}
                        hitSlop={4}
                      >
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
        <Text style={styles.sectionTitle}>Community</Text>
        <View style={styles.sortChips}>
          {(['trending', 'new', 'top'] as SortMode[]).map(mode => (
            <Pressable
              key={mode}
              style={[styles.sortChip, sortMode === mode && styles.sortChipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setSortMode(mode);
              }}
            >
              <Text style={[styles.sortChipText, sortMode === mode && styles.sortChipTextActive]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.emptyText}>Loading community...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <MaterialIcons name="photo-camera" size={48} color={theme.textMuted} />
        <Text style={styles.emptyTitle}>No objects yet</Text>
        <Text style={styles.emptyText}>Be the first to snap an object and let the community name it!</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.navigate('/(tabs)/snap')}>
          <MaterialIcons name="camera-alt" size={18} color={theme.background} />
          <Text style={styles.emptyBtnText}>Snap First Object</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.titleRow}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => {
            triggerHaptic('selection');
            setDrawerVisible(true);
          }}
        >
          <MaterialIcons name="menu" size={22} color={theme.textSecondary} />
        </Pressable>
        <Text style={[styles.title, { fontSize: scaledSize(24) }]}>its name is.</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.push('/leaderboard')}
          >
            <MaterialIcons name="emoji-events" size={20} color={theme.primary} />
          </Pressable>
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.push('/notifications')}
          >
            <MaterialIcons name="notifications" size={20} color={theme.textSecondary} />
            {unreadCount > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
      <FlashList
        data={filteredObjects}
        renderItem={renderCard}
        estimatedItemSize={260}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
      />

      <NavigationDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { ...typography.title, color: theme.primary, fontSize: 24 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: theme.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  headerContent: { paddingBottom: 8 },
  searchRow: { marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.radiusMedium, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: theme.textPrimary },

  // Community Banner
  communityBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.surface, borderRadius: theme.radiusMedium,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1, borderColor: theme.border,
  },
  communityBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  communityBannerText: { ...typography.small, color: theme.textSecondary, flex: 1 },
  communityBannerHighlight: { fontWeight: '700', color: theme.textPrimary },

  // Active Users
  activeSection: { marginBottom: 16 },
  activeSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  activeSectionTitle: { ...typography.bodyBold },
  leaderboardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: theme.radiusFull,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
  },
  leaderboardBtnText: { ...typography.small, color: theme.primary, fontWeight: '700' },
  activeScrollContent: { gap: 12 },
  activeUserItem: { alignItems: 'center', width: 60 },
  activeAvatarWrap: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 2, borderColor: theme.border,
    overflow: 'hidden', marginBottom: 4,
  },
  activeAvatarPremium: { borderColor: theme.primary },
  activeAvatar: { width: '100%', height: '100%' },
  activeUsername: { ...typography.small, fontSize: 10, textAlign: 'center' },

  // Featured
  featuredSection: { marginBottom: 20 },
  sectionTitle: { ...typography.bodyBold, marginBottom: 12 },
  featuredRow: { flexDirection: 'row', gap: 10 },
  featuredCard: { flex: 1, height: 160, borderRadius: theme.radiusLarge, overflow: 'hidden' },
  featuredCardFirst: { flex: 1.5 },
  featuredImage: { width: '100%', height: '100%' },
  featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, paddingTop: 30 },
  featuredName: { ...typography.captionBold, color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  featuredBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  featuredVotes: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  featuredVoteText: { fontSize: 11, fontWeight: '600', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  featuredUser: { width: 22, height: 22, borderRadius: 11, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  featuredUserAvatar: { width: '100%', height: '100%' },

  // Sort
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sortChips: { flexDirection: 'row', gap: 6 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radiusFull, backgroundColor: theme.surface },
  sortChipActive: { backgroundColor: theme.primary },
  sortChipText: { ...typography.small, color: theme.textSecondary },
  sortChipTextActive: { color: theme.background, fontWeight: '700' },

  // Card
  card: { width: CARD_W, marginBottom: CARD_GAP, borderRadius: theme.radiusMedium, backgroundColor: theme.surface, overflow: 'hidden' },
  cardImageWrap: { width: '100%', aspectRatio: 1 },
  cardImage: { width: '100%', height: '100%' },
  featuredBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.primary, borderRadius: theme.radiusFull, paddingHorizontal: 6, paddingVertical: 3 },
  featuredBadgeText: { fontSize: 9, fontWeight: '700', color: theme.background },
  cardContent: { padding: 10 },
  cardName: { ...typography.cardTitle, fontSize: 14, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMetaText: { ...typography.small, color: theme.textSecondary },

  cardUser: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardAvatar: { width: 18, height: 18, borderRadius: 9 },
  cardUsername: { ...typography.small, color: theme.textSecondary, flex: 1 },

  // Empty
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { ...typography.bodyBold, marginTop: 4 },
  emptyText: { ...typography.caption, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary, borderRadius: theme.radiusMedium, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { ...typography.button, fontSize: 14 },
});
