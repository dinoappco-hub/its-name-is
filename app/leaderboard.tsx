import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  LeaderboardEntry,
  CommunityStats,
  fetchCommunityStats,
  fetchTopContributors,
  fetchTopNamers,
  fetchMostVotedUsers,
} from '../services/communityService';
import { useAppTheme } from '../hooks/useTheme';

type LeaderboardTab = 'contributors' | 'namers' | 'popular';

const TABS: { key: LeaderboardTab; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'contributors', label: 'Top Snaps', icon: 'camera-alt' },
  { key: 'namers', label: 'Top Namers', icon: 'label' },
  { key: 'popular', label: 'Most Voted', icon: 'thumb-up' },
];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t, typo } = useAppTheme();

  const [activeTab, setActiveTab] = useState<LeaderboardTab>('contributors');
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [contributors, setContributors] = useState<LeaderboardEntry[]>([]);
  const [namers, setNamers] = useState<LeaderboardEntry[]>([]);
  const [popular, setPopular] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [s, c, n, p] = await Promise.all([fetchCommunityStats(), fetchTopContributors(10), fetchTopNamers(10), fetchMostVotedUsers(10)]);
    setStats(s); setContributors(c); setNamers(n); setPopular(p); setLoading(false);
  };

  const handleRefresh = useCallback(async () => { setRefreshing(true); await loadAll(); setRefreshing(false); }, []);

  const getActiveList = (): LeaderboardEntry[] => {
    switch (activeTab) { case 'contributors': return contributors; case 'namers': return namers; case 'popular': return popular; }
  };

  const getScoreLabel = (): string => {
    switch (activeTab) { case 'contributors': return 'objects'; case 'namers': return 'names'; case 'popular': return 'votes'; }
  };

  const renderPodium = (list: LeaderboardEntry[]) => {
    if (list.length < 1) return null;
    const top3 = list.slice(0, 3);
    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];
    return (
      <Animated.View entering={FadeIn.duration(500)} style={styles.podiumSection}>
        <View style={styles.podiumRow}>
          {podiumOrder.map((entry) => {
            const isFirst = entry.rank === 1;
            const avatarSize = isFirst ? 68 : 54;
            const podiumHeight = isFirst ? 90 : entry.rank === 2 ? 68 : 52;
            return (
              <Pressable key={entry.user.id} style={styles.podiumItem} onPress={() => { Haptics?.selectionAsync(); router.push(`/user/${entry.user.id}`); }}>
                <View style={styles.podiumAvatarWrap}>
                  <Image source={{ uri: entry.user.avatar }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} contentFit="cover" />
                  <View style={[styles.rankBadge, isFirst && { backgroundColor: t.primary }]}>
                    {isFirst ? <MaterialIcons name="emoji-events" size={12} color={t.background} /> : <Text style={styles.rankBadgeText}>{entry.rank}</Text>}
                  </View>
                </View>
                <Text style={[styles.podiumName, { color: t.textPrimary }, isFirst && { color: t.primary }]} numberOfLines={1}>{entry.user.displayName}</Text>
                <Text style={[styles.podiumScore, { color: t.textSecondary }]}>{entry.score} {getScoreLabel()}</Text>
                <View style={[styles.podiumBar, { height: podiumHeight, backgroundColor: t.surface, borderColor: t.border }, isFirst && { backgroundColor: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.25)' }]} />
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const list = getActiveList();

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Community</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.primary} colors={[t.primary]} />}>
        
        {stats ? (
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.statsBanner, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={styles.statsRow}>
              {[
                { value: stats.totalUsers, label: 'Members', icon: 'people' as const },
                { value: stats.totalObjects, label: 'Objects', icon: 'camera-alt' as const },
                { value: stats.totalNames, label: 'Names', icon: 'label' as const },
                { value: stats.totalVotes, label: 'Votes', icon: 'how-to-vote' as const },
              ].map((s) => (
                <View key={s.label} style={styles.statsItem}>
                  <MaterialIcons name={s.icon} size={18} color={t.primary} />
                  <Text style={[styles.statsValue, { color: t.textPrimary }]}>{s.value.toLocaleString()}</Text>
                  <Text style={[styles.statsLabel, { color: t.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable key={tab.key} style={[styles.tab, { backgroundColor: t.surface, borderColor: t.border }, active && { backgroundColor: t.primary, borderColor: t.primary }]} onPress={() => { Haptics?.selectionAsync(); setActiveTab(tab.key); }}>
                <MaterialIcons name={tab.icon} size={16} color={active ? t.background : t.textSecondary} />
                <Text style={[styles.tabText, { color: t.textSecondary }, active && { color: t.background }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator size="large" color={t.primary} /></View>
        ) : list.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="emoji-events" size={48} color={t.textMuted} />
            <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No rankings yet</Text>
            <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>Be the first to contribute to the community!</Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {renderPodium(list)}
            {list.slice(3).map((entry, idx) => (
              <Animated.View key={entry.user.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                <Pressable style={[styles.listRow, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => { Haptics?.selectionAsync(); router.push(`/user/${entry.user.id}`); }}>
                  <Text style={[styles.listRank, { color: t.textMuted }]}>{entry.rank}</Text>
                  <Image source={{ uri: entry.user.avatar }} style={styles.listAvatar} contentFit="cover" />
                  <View style={styles.listInfo}>
                    <Text style={[styles.listName, { color: t.textPrimary }]} numberOfLines={1}>{entry.user.displayName}</Text>
                    <Text style={[styles.listUsername, { color: t.textSecondary }]}>@{entry.user.username}</Text>
                  </View>
                  <View style={styles.listScoreWrap}>
                    <Text style={[styles.listScore, { color: t.primary }]}>{entry.score}</Text>
                    <Text style={[styles.listScoreLabel, { color: t.textMuted }]}>{getScoreLabel()}</Text>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  statsBanner: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statsItem: { alignItems: 'center', gap: 4 },
  statsValue: { fontSize: 18, fontWeight: '700' },
  statsLabel: { fontSize: 11, fontWeight: '500' },
  tabRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '600' },
  loadingWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptySubtitle: { fontSize: 13, fontWeight: '400', textAlign: 'center' },
  listContent: { paddingHorizontal: 16 },
  podiumSection: { marginBottom: 24 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12 },
  podiumItem: { alignItems: 'center', width: 100 },
  podiumAvatarWrap: { position: 'relative', marginBottom: 8 },
  rankBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C5CFC', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  rankBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  podiumName: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 2 },
  podiumScore: { fontSize: 11, fontWeight: '500', marginBottom: 6 },
  podiumBar: { width: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 1, borderBottomWidth: 0 },
  listRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, gap: 12 },
  listRank: { fontSize: 13, fontWeight: '600', width: 24, textAlign: 'center' },
  listAvatar: { width: 40, height: 40, borderRadius: 20 },
  listInfo: { flex: 1 },
  listName: { fontSize: 15, fontWeight: '600', flex: 1 },
  listUsername: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  listScoreWrap: { alignItems: 'flex-end' },
  listScore: { fontSize: 18, fontWeight: '600' },
  listScoreLabel: { fontSize: 11, fontWeight: '500' },
});
