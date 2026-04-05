import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth, useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import AdBanner from '../../components/AdBanner';
import { shareObject, shareApp } from '../../services/shareService';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { currentUser, getUserObjects, isPremium, objects, loading } = useApp();
  const userObjects = useMemo(() => getUserObjects(currentUser.id), [currentUser.id, getUserObjects]);

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

  const displayName = user?.username || user?.email?.split('@')[0] || currentUser.displayName;
  const displayEmail = user?.email || '';
  const avatarUri = currentUser.avatar;

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          const { error } = await logout();
          if (error) {
            showAlert('Error', error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerBtn} onPress={() => { Haptics.selectionAsync(); shareApp(); }}>
              <MaterialIcons name="share" size={20} color={theme.textSecondary} />
            </Pressable>
            <Pressable style={styles.headerBtn} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={theme.error} />
            </Pressable>
            <Pressable style={styles.headerBtn} onPress={() => router.push('/settings')}>
              <MaterialIcons name="settings" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileCard}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{displayName}</Text>
              {isPremium ? (
                <View style={styles.premiumBadge}>
                  <MaterialIcons name="star" size={12} color={theme.background} />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              ) : null}
            </View>
            {displayEmail ? <Text style={styles.email}>{displayEmail}</Text> : null}
            <Text style={styles.joined}>Joined {new Date(currentUser.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
          </View>
          <Pressable
            style={styles.editProfileBtn}
            onPress={() => { Haptics.selectionAsync(); router.push('/edit-profile'); }}
          >
            <MaterialIcons name="edit" size={16} color={theme.primary} />
          </Pressable>
        </Animated.View>

        {!isPremium ? (
          <Pressable
            style={styles.upgradeCard}
            onPress={() => { Haptics.selectionAsync(); router.push('/premium'); }}
          >
            <View style={styles.upgradeLeft}>
              <MaterialIcons name="workspace-premium" size={28} color={theme.primary} />
              <View>
                <Text style={styles.upgradeTitle}>Go Premium</Text>
                <Text style={styles.upgradeSubtitle}>Unlimited submissions & more</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.primary} />
          </Pressable>
        ) : null}

        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <Animated.View key={stat.label} entering={FadeInDown.delay(i * 80).duration(400)} style={styles.statCard}>
              <MaterialIcons name={stat.icon} size={22} color={theme.primary} />
              <Text style={styles.statValue}>{stat.value.toLocaleString()}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        <AdBanner style={{ marginBottom: 16 }} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Submissions</Text>
          <Text style={styles.sectionCount}>{userObjects.length}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : userObjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={require('../../assets/images/empty-state.png')} style={styles.emptyImage} contentFit="contain" />
            <Text style={styles.emptyTitle}>No submissions yet</Text>
            <Text style={styles.emptySubtitle}>Snap your first object and let the community name it!</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.navigate('/(tabs)/snap')}>
              <MaterialIcons name="camera-alt" size={18} color={theme.background} />
              <Text style={styles.emptyBtnText}>Snap Now</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.submissionsGrid}>
            {userObjects.map((obj, i) => {
              const topName = [...obj.suggestedNames].sort((a, b) => b.votes - a.votes)[0];
              return (
                <Animated.View key={obj.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                  <Pressable
                    style={styles.submissionCard}
                    onPress={() => { Haptics.selectionAsync(); router.push(`/object/${obj.id}`); }}
                  >
                    <Image source={{ uri: obj.imageUri }} style={styles.submissionImage} contentFit="cover" transition={200} />
                    <View style={styles.submissionOverlay}>
                      <Text style={styles.submissionName} numberOfLines={1}>{topName?.name || 'Unnamed'}</Text>
                      <View style={styles.submissionMeta}>
                        <MaterialIcons name="arrow-upward" size={11} color="#fff" />
                        <Text style={styles.submissionMetaText}>{obj.totalVotes}</Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  pageTitle: { ...typography.subtitle },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.radiusLarge, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  editProfileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  profileInfo: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName: { ...typography.subtitle, fontSize: 18 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.primary, borderRadius: theme.radiusFull, paddingHorizontal: 8, paddingVertical: 3 },
  premiumBadgeText: { fontSize: 10, fontWeight: '800', color: theme.background },
  email: { ...typography.caption, marginTop: 2 },
  joined: { ...typography.small, marginTop: 4 },
  upgradeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: theme.radiusMedium, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeTitle: { ...typography.bodyBold, color: theme.primary },
  upgradeSubtitle: { ...typography.small, color: theme.textSecondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '48%', flexGrow: 1, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: theme.border },
  statValue: { ...typography.cardValue, fontSize: 22 },
  statLabel: { ...typography.small, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { ...typography.bodyBold },
  sectionCount: { ...typography.captionBold, color: theme.textMuted, backgroundColor: theme.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radiusFull },
  loadingWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyImage: { width: 180, height: 140, marginBottom: 16 },
  emptyTitle: { ...typography.bodyBold, marginBottom: 6 },
  emptySubtitle: { ...typography.caption, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary, borderRadius: theme.radiusMedium, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { ...typography.button, fontSize: 14 },
  submissionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  submissionCard: { width: '48%', flexGrow: 1, aspectRatio: 1, borderRadius: theme.radiusMedium, overflow: 'hidden' },
  submissionImage: { width: '100%', height: '100%' },
  submissionOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
  submissionName: { ...typography.small, color: '#fff', fontWeight: '600' },
  submissionMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  submissionMetaText: { fontSize: 10, fontWeight: '600', color: '#fff' },
});
