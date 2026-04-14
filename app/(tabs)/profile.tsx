import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Dimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '../../components/SafeIcons';
import { useRouter } from 'expo-router';
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth, useAlert } from '@/template';
import { useApp } from '../../contexts/AppContext';
import { useAppTheme as useThemeToggle } from '../../hooks/useTheme';
import DinoLoader from '../../components/DinoLoader';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAppTheme } from '../../hooks/useTheme';
import { ObjectSubmission } from '../../services/types';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 10;
const CARD_W = (SCREEN_W - 32 - GRID_GAP) / 2;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { colors: t, typo, isDark, toggleMode } = useAppTheme();
  const { currentUser, getUserObjects, objects, loading, refreshing, refreshObjects, deleteSubmission } = useApp();
  const { scaledSize, fontWeight: fw, triggerHaptic, shouldAnimate, subtleTextColor } = useAccessibility();
  const [dinoRefreshing, setDinoRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setDinoRefreshing(true);
    await refreshObjects();
    setTimeout(() => setDinoRefreshing(false), 1200);
  }, [refreshObjects]);
  const userObjects = useMemo(() => {
    if (!currentUser.id) return [];
    return getUserObjects(currentUser.id);
  }, [currentUser.id, getUserObjects, objects]);

  const totalVotesGiven = useMemo(() => {
    let count = 0;
    objects.forEach(o => o.suggestedNames.forEach(n => { if (n.userVote) count++; }));
    return count;
  }, [objects]);

  const stats = [
    { icon: 'camera-alt' as const, value: currentUser.totalSubmissions, label: 'Submissions' },
    { icon: 'thumb-up' as const, value: currentUser.totalVotesReceived, label: 'Votes Received' },
    { icon: 'how-to-vote' as const, value: totalVotesGiven, label: 'Votes Given' },
    { icon: 'visibility' as const, value: userObjects.reduce((s, o) => s + o.viewCount, 0), label: 'Total Views' },
  ];

  const displayName = currentUser.username || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const avatarUri = currentUser.avatar;

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { const { error } = await logout(); if (error) showAlert('Error', error); } },
    ]);
  };

  const handleDeleteSubmission = useCallback((item: ObjectSubmission) => {
    triggerHaptic('impact');
    showAlert('Delete Submission', 'This will permanently remove this post and all its names, votes, and comments. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteSubmission(item.id);
          if (error) showAlert('Error', error);
        },
      },
    ]);
  }, [deleteSubmission, triggerHaptic, showAlert]);

  const renderSubmissionCard = useCallback(({ item, index }: { item: ObjectSubmission; index: number }) => {
    const topName = [...item.suggestedNames].sort((a, b) => b.votes - a.votes)[0];
    return (
      <Pressable
        style={[styles.submissionCard, { width: CARD_W, backgroundColor: t.surface }]}
        onPress={() => { triggerHaptic('selection'); router.push(`/object/${item.id}`); }}
        onLongPress={() => handleDeleteSubmission(item)}
      >
        <Image source={{ uri: item.imageUri }} style={styles.submissionImage} contentFit="cover" transition={200} />
        <View style={styles.submissionOverlay}>
          <Text style={styles.submissionName} numberOfLines={1}>{topName?.name || 'Unnamed'}</Text>
          <View style={styles.submissionMeta}>
            <MaterialIcons name="arrow-upward" size={11} color="#fff" />
            <Text style={styles.submissionMetaText}>{item.totalVotes}</Text>
            <View style={{ width: 6 }} />
            <MaterialIcons name="chat-bubble-outline" size={10} color="#fff" />
            <Text style={styles.submissionMetaText}>{item.suggestedNames.length}</Text>
          </View>
        </View>
        {item.isFeatured ? (
          <View style={[styles.featuredBadge, { backgroundColor: t.primary }]}>
            <MaterialIcons name="star" size={10} color={t.background} />
          </View>
        ) : null}
        <Pressable
          style={[styles.deleteBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => handleDeleteSubmission(item)}
          hitSlop={6}
        >
          <MaterialIcons name="delete-outline" size={14} color="#fff" />
        </Pressable>
      </Pressable>
    );
  }, [t, router, triggerHaptic, handleDeleteSubmission]);

  const renderHeader = () => (
    <>
      {dinoRefreshing ? (
        <View style={styles.dinoRefreshWrap}>
          <DinoLoader message="Refreshing" size="small" />
        </View>
      ) : null}
      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: t.textPrimary }]}>Profile</Text>
        <View style={styles.headerActions}>
          <Pressable style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(245,158,11,0.12)' }]} onPress={() => { triggerHaptic('selection'); toggleMode(); }}>
            <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={20} color={isDark ? '#7C5CFC' : '#F59E0B'} />
          </Pressable>
          <Pressable style={[styles.headerBtn, { backgroundColor: t.surface }]} onPress={() => { triggerHaptic('selection'); handleLogout(); }}>
            <MaterialIcons name="logout" size={20} color={t.error} />
          </Pressable>
          <Pressable style={[styles.headerBtn, { backgroundColor: t.surface }]} onPress={() => { triggerHaptic('selection'); router.push('/settings'); }}>
            <MaterialIcons name="settings" size={22} color={t.textSecondary} />
          </Pressable>
        </View>
      </View>

      <Animated.View entering={shouldAnimate ? FadeInDown.duration(400) : undefined} style={[styles.profileCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: t.textPrimary, fontSize: scaledSize(18), fontWeight: fw('700') }]}>{displayName}</Text>
          </View>
          {displayEmail ? <Text style={[styles.email, { color: t.textSecondary }]}>{displayEmail}</Text> : null}
          <Text style={[styles.joined, { color: t.textMuted }]}>Joined {new Date(currentUser.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
        </View>
        <Pressable style={[styles.editProfileBtn, { backgroundColor: `${t.primary}15`, borderColor: `${t.primary}30` }]} onPress={() => { Haptics?.selectionAsync(); router.push('/edit-profile'); }}>
          <MaterialIcons name="edit" size={16} color={t.primary} />
        </Pressable>
      </Animated.View>

      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <Animated.View key={stat.label} entering={shouldAnimate ? FadeInDown.delay(i * 80).duration(400) : undefined} style={[styles.statCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <MaterialIcons name={stat.icon} size={22} color={t.primary} />
            <Text style={[styles.statValue, { color: t.textPrimary, fontSize: scaledSize(22), fontWeight: fw('700') }]}>{stat.value.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: subtleTextColor, fontSize: scaledSize(11) }]}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Your Submissions</Text>
        <Text style={[styles.sectionCount, { color: t.textMuted, backgroundColor: t.surface }]}>{userObjects.length}</Text>
      </View>
    </>
  );

  const renderEmpty = () => (
    loading ? (
      <View style={styles.loadingWrap}><DinoLoader message="Loading submissions" /></View>
    ) : (
      <View style={styles.emptyState}>
        <Image source={require('../../assets/images/empty-state.png')} style={styles.emptyImage} contentFit="contain" />
        <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No submissions yet</Text>
        <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>Snap your first object and let the community name it!</Text>
        <Pressable style={[styles.emptyBtn, { backgroundColor: t.primary }]} onPress={() => router.navigate('/(tabs)/snap')}>
          <MaterialIcons name="camera-alt" size={18} color={t.background} />
          <Text style={[styles.emptyBtnText, { color: t.background }]}>Snap Now</Text>
        </Pressable>
      </View>
    )
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <FlatList
        data={userObjects}
        renderItem={renderSubmissionCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GRID_GAP }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  pageTitle: { fontSize: 20, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  editProfileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  profileInfo: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName: { fontSize: 18, fontWeight: '700' },
  email: { fontSize: 13, fontWeight: '400', marginTop: 2 },
  joined: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '48%', flexGrow: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  sectionCount: { fontSize: 13, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  loadingWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyImage: { width: 180, height: 140, marginBottom: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, fontWeight: '400', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '700' },
  submissionCard: { aspectRatio: 0.85, borderRadius: 12, overflow: 'hidden', marginBottom: GRID_GAP, position: 'relative' },
  submissionImage: { width: '100%', height: '100%' },
  submissionOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  submissionName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  submissionMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  submissionMetaText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  featuredBadge: { position: 'absolute', top: 8, left: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dinoRefreshWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 0, paddingBottom: 8, marginTop: -16 },
});
