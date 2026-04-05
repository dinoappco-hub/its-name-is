import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import {
  LeaderboardEntry,
  CommunityStats,
  fetchCommunityStats,
  fetchTopContributors,
  fetchTopNamers,
  fetchMostVotedUsers,
} from '../services/communityService';

type LeaderboardTab = 'contributors' | 'namers' | 'popular';

const TABS: { key: LeaderboardTab; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'contributors', label: 'Top Snaps', icon: 'camera-alt' },
  { key: 'namers', label: 'Top Namers', icon: 'label' },
  { key: 'popular', label: 'Most Voted', icon: 'thumb-up' },
];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<LeaderboardTab>('contributors');
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [contributors, setContributors] = useState<LeaderboardEntry[]>([]);
  const [namers, setNamers] = useState<LeaderboardEntry[]>([]);
  const [popular, setPopular] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [s, c, n, p] = await Promise.all([
      fetchCommunityStats(),
      fetchTopContributors(10),
      fetchTopNamers(10),
      fetchMostVotedUsers(10),
    ]);
    setStats(s);
    setContributors(c);
    setNamers(n);
    setPopular(p);
    setLoading(false);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, []);

  const getActiveList = (): LeaderboardEntry[] => {
    switch (activeTab) {
      case 'contributors': return contributors;
      case 'namers': return namers;
      case 'popular': return popular;
    }
  };

  const getScoreLabel = (): string => {
    switch (activeTab) {
      case 'contributors': return 'objects';
      case 'namers': return 'names';
      case 'popular': return 'votes';
    }
  };

  const renderPodium = (list: LeaderboardEntry[]) => {
    if (list.length < 1) return null;
    const top3 = list.slice(0, 3);
    const podiumOrder = top3.length >= 3
      ? [top3[1], top3[0], top3[2]]
      : top3.length === 2
        ? [top3[1], top3[0]]
        : [top3[0]];

    return (
      <Animated.View entering={FadeIn.duration(500)} style={styles.podiumSection}>
        <View style={styles.podiumRow}>
          {podiumOrder.map((entry, idx) => {
            const isFirst = entry.rank === 1;
            const avatarSize = isFirst ? 68 : 54;
            const podiumHeight = isFirst ? 90 : entry.rank === 2 ? 68 : 52;

            return (
              <Pressable
                key={entry.user.id}
                style={styles.podiumItem}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/user/${entry.user.id}`);
                }}
              >
                <View style={[styles.podiumAvatarWrap, isFirst && styles.podiumAvatarFirst]}>
                  <Image source={{ uri: entry.user.avatar }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} contentFit="cover" />
                  <View style={[styles.rankBadge, isFirst && styles.rankBadgeFirst]}>
                    {isFirst ? (
                      <MaterialIcons name="emoji-events" size={12} color={theme.background} />
                    ) : (
                      <Text style={styles.rankBadgeText}>{entry.rank}</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.podiumName, isFirst && styles.podiumNameFirst]} numberOfLines={1}>
                  {entry.user.displayName}
                </Text>
                <Text style={styles.podiumScore}>{entry.score} {getScoreLabel()}</Text>
                <View style={[styles.podiumBar, { height: podiumHeight }, isFirst && styles.podiumBarFirst]} />
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const list = getActiveList();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
      >
        {/* Community Stats Banner */}
        {stats ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.statsBanner}>
            <View style={styles.statsRow}>
              {[
                { value: stats.totalUsers, label: 'Members', icon: 'people' as const },
                { value: stats.totalObjects, label: 'Objects', icon: 'camera-alt' as const },
                { value: stats.totalNames, label: 'Names', icon: 'label' as const },
                { value: stats.totalVotes, label: 'Votes', icon: 'how-to-vote' as const },
              ].map((s, i) => (
                <View key={s.label} style={styles.statsItem}>
                  <MaterialIcons name={s.icon} size={18} color={theme.primary} />
                  <Text style={styles.statsValue}>{s.value.toLocaleString()}</Text>
                  <Text style={styles.statsLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab.key);
                }}
              >
                <MaterialIcons name={tab.icon} size={16} color={active ? theme.background : theme.textSecondary} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="emoji-events" size={48} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to contribute to the community!</Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {renderPodium(list)}

            {/* Rest of the list (rank 4+) */}
            {list.slice(3).map((entry, idx) => (
              <Animated.View key={entry.user.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                <Pressable
                  style={styles.listRow}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/user/${entry.user.id}`);
                  }}
                >
                  <Text style={styles.listRank}>{entry.rank}</Text>
                  <Image source={{ uri: entry.user.avatar }} style={styles.listAvatar} contentFit="cover" />
                  <View style={styles.listInfo}>
                    <View style={styles.listNameRow}>
                      <Text style={styles.listName} numberOfLines={1}>{entry.user.displayName}</Text>
                      {entry.user.isPremium ? (
                        <MaterialIcons name="verified" size={14} color={theme.primary} />
                      ) : null}
                    </View>
                    <Text style={styles.listUsername}>@{entry.user.username}</Text>
                  </View>
                  <View style={styles.listScoreWrap}>
                    <Text style={styles.listScore}>{entry.score}</Text>
                    <Text style={styles.listScoreLabel}>{getScoreLabel()}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
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

  statsBanner: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    padding: 16,
    borderWidth: 1, borderColor: theme.border,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statsItem: { alignItems: 'center', gap: 4 },
  statsValue: { ...typography.cardValue, fontSize: 18 },
  statsLabel: { ...typography.small },

  tabRow: {
    flexDirection: 'row', gap: 8,
    marginHorizontal: 16, marginBottom: 20,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    borderWidth: 1, borderColor: theme.border,
  },
  tabActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  tabText: { ...typography.captionBold, color: theme.textSecondary },
  tabTextActive: { color: theme.background },

  loadingWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { ...typography.bodyBold },
  emptySubtitle: { ...typography.caption, textAlign: 'center' },

  listContent: { paddingHorizontal: 16 },

  // Podium
  podiumSection: { marginBottom: 24 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12 },
  podiumItem: { alignItems: 'center', width: 100 },
  podiumAvatarWrap: { position: 'relative', marginBottom: 8 },
  podiumAvatarFirst: { marginBottom: 10 },
  rankBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: theme.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.background,
  },
  rankBadgeFirst: { backgroundColor: theme.primary },
  rankBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  podiumName: { ...typography.captionBold, textAlign: 'center', marginBottom: 2 },
  podiumNameFirst: { color: theme.primary },
  podiumScore: { ...typography.small, color: theme.textSecondary, marginBottom: 6 },
  podiumBar: {
    width: '100%', backgroundColor: theme.surface,
    borderTopLeftRadius: theme.radiusMedium, borderTopRightRadius: theme.radiusMedium,
    borderWidth: 1, borderBottomWidth: 0, borderColor: theme.border,
  },
  podiumBarFirst: { backgroundColor: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.25)' },

  // List rows (rank 4+)
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: theme.border,
    gap: 12,
  },
  listRank: { ...typography.captionBold, color: theme.textMuted, width: 24, textAlign: 'center' },
  listAvatar: { width: 40, height: 40, borderRadius: 20 },
  listInfo: { flex: 1 },
  listNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  listName: { ...typography.bodyBold, fontSize: 15, flex: 1 },
  listUsername: { ...typography.small, color: theme.textSecondary, marginTop: 2 },
  listScoreWrap: { alignItems: 'flex-end' },
  listScore: { ...typography.bodyBold, color: theme.primary, fontSize: 18 },
  listScoreLabel: { ...typography.small, color: theme.textMuted },
});
