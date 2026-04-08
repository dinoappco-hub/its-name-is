import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/template';
import { theme, typography } from '../../constants/theme';
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
          style={styles.card}
          onPress={() => {
            Haptics.selectionAsync();
            router.push(`/object/${item.id}`);
          }}
        >
          <View style={styles.cardImageWrap}>
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} contentFit="cover" transition={200} />
            {item.isFeatured ? (
              <View style={styles.featuredBadge}>
                <MaterialIcons name="star" size={10} color={theme.background} />
              </View>
            ) : null}
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardName} numberOfLines={1}>{topName?.name || 'Unnamed'}</Text>
            <View style={styles.cardMeta}>
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="arrow-upward" size={12} color={theme.upvote} />
                <Text style={styles.cardMetaText}>{item.totalVotes}</Text>
              </View>
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="chat-bubble-outline" size={12} color={theme.textMuted} />
                <Text style={styles.cardMetaText}>{item.suggestedNames.length}</Text>
              </View>
              <Text style={styles.cardTimeText}>{timeAgo(item.submittedAt)}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }, [router]);

  if (loadingProfile) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFound}>
          <MaterialIcons name="person-off" size={48} color={theme.textMuted} />
          <Text style={styles.notFoundText}>User not found</Text>
          <Pressable style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.profileContent}>
      {/* Profile Card */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.profileCard}>
        <Image source={{ uri: profileUser.avatar }} style={styles.avatar} contentFit="cover" transition={200} />
        <Text style={styles.displayName}>{profileUser.displayName}</Text>
        <View style={styles.usernameRow}>
          <Text style={styles.username}>@{profileUser.username}</Text>
          {profileUser.isPremium ? (
            <View style={styles.premiumBadge}>
              <MaterialIcons name="star" size={10} color={theme.background} />
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.joinedText}>
          Member since {new Date(profileUser.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>

        {isOwnProfile ? (
          <Pressable
            style={styles.editBtn}
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/edit-profile');
            }}
          >
            <MaterialIcons name="edit" size={16} color={theme.primary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        ) : null}
      </Animated.View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <Animated.View key={stat.label} entering={FadeInDown.delay(i * 70).duration(350)} style={styles.statCard}>
            <MaterialIcons name={stat.icon} size={20} color={theme.primary} />
            <Text style={styles.statValue}>{stat.value.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Submissions Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Submissions</Text>
        <Text style={styles.sectionCount}>{userObjects.length}</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="photo-camera" size={40} color={theme.textMuted} />
      <Text style={styles.emptyTitle}>No submissions yet</Text>
      <Text style={styles.emptySubtitle}>
        {isOwnProfile ? 'Snap your first object!' : 'This user has not submitted any objects yet.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>@{profileUser.username}</Text>
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
  headerTitle: { ...typography.bodyBold, fontSize: 17, flex: 1, textAlign: 'center' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { ...typography.body, color: theme.textSecondary },
  goBackBtn: { backgroundColor: theme.surface, borderRadius: theme.radiusMedium, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  goBackText: { ...typography.bodyBold },

  profileContent: { paddingBottom: 8 },
  profileCard: {
    alignItems: 'center', paddingVertical: 24,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    borderWidth: 1, borderColor: theme.border,
    marginBottom: 16,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: theme.primary, marginBottom: 12 },
  displayName: { ...typography.subtitle, fontSize: 20, marginBottom: 4 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  username: { ...typography.caption, fontSize: 14 },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: theme.primary, borderRadius: theme.radiusFull,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumText: { fontSize: 9, fontWeight: '800', color: theme.background },
  joinedText: { ...typography.small, color: theme.textMuted, marginTop: 2 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: theme.radiusFull,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
  },
  editBtnText: { ...typography.captionBold, color: theme.primary },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '48%', flexGrow: 1,
    backgroundColor: theme.surface, borderRadius: theme.radiusMedium,
    padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: theme.border,
  },
  statValue: { ...typography.cardValue, fontSize: 20 },
  statLabel: { ...typography.small, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { ...typography.bodyBold },
  sectionCount: {
    ...typography.captionBold, color: theme.textMuted,
    backgroundColor: theme.surface, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: theme.radiusFull,
  },

  card: { width: CARD_W, marginBottom: CARD_GAP, borderRadius: theme.radiusMedium, backgroundColor: theme.surface, overflow: 'hidden' },
  cardImageWrap: { width: '100%', aspectRatio: 1 },
  cardImage: { width: '100%', height: '100%' },
  featuredBadge: {
    position: 'absolute', top: 8, left: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: theme.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { padding: 10 },
  cardName: { ...typography.cardTitle, fontSize: 14, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMetaText: { ...typography.small, color: theme.textSecondary },
  cardTimeText: { ...typography.small, color: theme.textMuted, marginLeft: 'auto' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { ...typography.bodyBold },
  emptySubtitle: { ...typography.caption, textAlign: 'center', paddingHorizontal: 20 },
});
