import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/template';
import { useAppTheme } from '../../hooks/useTheme';
import { useApp } from '../../contexts/AppContext';
import { User, ObjectSubmission } from '../../services/types';
import { fetchPublicUserProfile } from '../../services/communityService';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_W = (SCREEN_W - 20 * 2 - CARD_GAP) / 2;

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { colors: t } = useAppTheme();
  const { objects } = useApp();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [namesGiven, setNamesGiven] = useState(0);
  const [votesReceived, setVotesReceived] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const isOwnProfile = authUser?.id === id;

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;
    setLoadingProfile(true);
    const result = await fetchPublicUserProfile(id);
    if (result.user) {
      setProfileUser(result.user);
      setNamesGiven(result.namesGiven);
      setVotesReceived(result.votesReceived);
    }
    setLoadingProfile(false);
  };

  const userObjects = useMemo(() => {
    return objects.filter(o => o.submittedBy.id === id);
  }, [objects, id]);

  const stats = useMemo(() => [
    { icon: 'camera-alt' as const, value: profileUser?.totalSubmissions || 0, label: 'Objects' },
    { icon: 'label' as const, value: namesGiven, label: 'Names Given' },
    { icon: 'thumb-up' as const, value: votesReceived, label: 'Votes Received' },
    { icon: 'visibility' as const, value: userObjects.reduce((s, o) => s + o.viewCount, 0), label: 'Total Views' },
  ], [profileUser, namesGiven, votesReceived, userObjects]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  };

  const renderCard = useCallback(({ item, index }: { item: ObjectSubmission; index: number }) => {
    const topName = [...item.suggestedNames].sort((a, b) => b.votes - a.votes)[0];
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 300)).duration(400)}>
        <Pressable
          style={[styles.card, { backgroundColor: t.surface }]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push(`/object/${item.id}`);
          }}
        >
          <View style={styles.cardImageWrap}>
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} contentFit="cover" transition={200} />
            {item.isFeatured ? (
              <View style={[styles.featuredBadge, { backgroundColor: t.primary }]}>
                <MaterialIcons name="star" size={10} color={t.background} />
              </View>
            ) : null}
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardName, { color: t.textPrimary }]} numberOfLines={1}>{topName?.name || 'Unnamed'}</Text>
            <View style={styles.cardMeta}>
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="arrow-upward" size={12} color={t.upvote} />
                <Text style={[styles.cardMetaText, { color: t.textSecondary }]}>{item.totalVotes}</Text>
              </View>
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="chat-bubble-outline" size={12} color={t.textMuted} />
                <Text style={[styles.cardMetaText, { color: t.textSecondary }]}>{item.suggestedNames.length}</Text>
              </View>
              <Text style={[styles.cardTimeText, { color: t.textMuted }]}>{timeAgo(item.submittedAt)}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }, [router, t]);

  if (loadingProfile) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.header}>
          <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.header}>
          <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFound}>
          <MaterialIcons name="person-off" size={48} color={t.textMuted} />
          <Text style={[styles.notFoundText, { color: t.textSecondary }]}>User not found</Text>
          <Pressable style={[styles.goBackBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
            <Text style={[styles.goBackText, { color: t.textPrimary }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.profileContent}>
      <Animated.View entering={FadeIn.duration(400)} style={[styles.profileCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Image source={{ uri: profileUser.avatar }} style={[styles.avatar, { borderColor: t.primary }]} contentFit="cover" transition={200} />
        <Text style={[styles.displayName, { color: t.textPrimary }]}>{profileUser.displayName}</Text>
        <View style={styles.usernameRow}>
          <Text style={[styles.username, { color: t.textSecondary }]}>@{profileUser.username}</Text>
          {profileUser.isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: t.primary }]}>
              <MaterialIcons name="star" size={10} color={t.background} />
              <Text style={[styles.premiumText, { color: t.background }]}>PRO</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.joinedText, { color: t.textMuted }]}>
          Member since {new Date(profileUser.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>

        {isOwnProfile ? (
          <Pressable
            style={[styles.editBtn, { backgroundColor: `${t.primary}12`, borderColor: `${t.primary}30` }]}
            onPress={() => { Haptics.selectionAsync(); router.push('/edit-profile'); }}
          >
            <MaterialIcons name="edit" size={16} color={t.primary} />
            <Text style={[styles.editBtnText, { color: t.primary }]}>Edit Profile</Text>
          </Pressable>
        ) : null}
      </Animated.View>

      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <Animated.View key={stat.label} entering={FadeInDown.delay(i * 70).duration(350)} style={[styles.statCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <MaterialIcons name={stat.icon} size={20} color={t.primary} />
            <Text style={[styles.statValue, { color: t.textPrimary }]}>{stat.value.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: t.textMuted }]}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Submissions</Text>
        <Text style={[styles.sectionCount, { color: t.textMuted, backgroundColor: t.surface }]}>{userObjects.length}</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="photo-camera" size={40} color={t.textMuted} />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No submissions yet</Text>
      <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
        {isOwnProfile ? 'Snap your first object!' : 'This user has not submitted any objects yet.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]} numberOfLines={1}>@{profileUser.username}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={userObjects}
        renderItem={renderCard}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: CARD_GAP }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 15 },
  goBackBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  goBackText: { fontSize: 15, fontWeight: '600' },
  profileContent: { paddingBottom: 8 },
  profileCard: { alignItems: 'center', paddingVertical: 24, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, marginBottom: 12 },
  displayName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  username: { fontSize: 14 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 },
  premiumText: { fontSize: 9, fontWeight: '800' },
  joinedText: { fontSize: 11, marginTop: 2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
  editBtnText: { fontSize: 13, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '48%', flexGrow: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  sectionCount: { fontSize: 13, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  card: { width: CARD_W, marginBottom: CARD_GAP, borderRadius: 12, overflow: 'hidden' },
  cardImageWrap: { width: '100%', aspectRatio: 1 },
  cardImage: { width: '100%', height: '100%' },
  featuredBadge: { position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: 10 },
  cardName: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMetaText: { fontSize: 11, fontWeight: '500' },
  cardTimeText: { fontSize: 11, marginLeft: 'auto' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
});
