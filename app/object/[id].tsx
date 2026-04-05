import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Modal, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth, useAlert } from '@/template';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { SuggestedName } from '../../services/types';
import AdBanner from '../../components/AdBanner';
import { shareObject } from '../../services/shareService';
import { useRouter as useRouterNav } from 'expo-router';
import { REPORT_REASONS, submitReport, hasUserReported } from '../../services/reportService';

export default function ObjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const navigateToUser = useCallback((userId: string) => {
    Haptics.selectionAsync();
    router.push(`/user/${userId}`);
  }, [router]);
  const { user: authUser } = useAuth();
  const { objects, vote, addNameSuggestion, currentUser, trackView } = useApp();
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const { showAlert } = useAlert();

  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportNameId, setReportNameId] = useState<string | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  const object = useMemo(() => objects.find(o => o.id === id), [objects, id]);

  useEffect(() => {
    if (id) trackView(id);
  }, [id, trackView]);

  // Check if user already reported this object
  useEffect(() => {
    if (authUser?.id && id) {
      hasUserReported(authUser.id, id).then(setAlreadyReported);
    }
  }, [authUser?.id, id]);

  const openReportModal = useCallback((nameId?: string) => {
    if (alreadyReported) {
      showAlert('Already Reported', 'You have already reported this submission. Our team will review it.');
      return;
    }
    Haptics.selectionAsync();
    setReportNameId(nameId || null);
    setReportReason('');
    setReportDescription('');
    setShowReportModal(true);
  }, [alreadyReported, showAlert]);

  const handleSubmitReport = useCallback(async () => {
    if (!reportReason) {
      showAlert('Select a Reason', 'Please select why you are reporting this content.');
      return;
    }
    if (!authUser?.id || !id) return;

    setSubmittingReport(true);
    const { error } = await submitReport({
      reporterId: authUser.id,
      objectId: id,
      nameId: reportNameId || undefined,
      reason: reportReason,
      description: reportDescription.trim(),
    });
    setSubmittingReport(false);

    if (error) {
      showAlert('Error', error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowReportModal(false);
    setAlreadyReported(true);
    showAlert('Report Submitted', 'Thank you. Our moderation team will review this content shortly.');
  }, [reportReason, reportDescription, reportNameId, authUser?.id, id, showAlert]);

  if (!object) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.notFound}>
          <MaterialIcons name="error-outline" size={48} color={theme.textMuted} />
          <Text style={styles.notFoundText}>Object not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sortedNames = [...object.suggestedNames].sort((a, b) => b.votes - a.votes);
  const topName = sortedNames[0];

  const handleVote = (nameId: string, direction: 'up' | 'down') => {
    Haptics.selectionAsync();
    vote(object.id, nameId, direction);
  };

  const handleSuggestName = async () => {
    if (!newName.trim()) return;
    if (newName.trim().length < 2) {
      showAlert('Too short', 'Names must be at least 2 characters.');
      return;
    }
    setSuggesting(true);
    const { error } = await addNameSuggestion(object.id, newName.trim());
    setSuggesting(false);
    if (error) {
      showAlert('Error', error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewName('');
    setShowInput(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const renderNameRow = (item: SuggestedName, index: number) => {
    const isTop = index === 0;
    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(index * 60).duration(350)}
      >
        <View style={[styles.nameRow, isTop && styles.nameRowTop]}>
          <View style={styles.nameRank}>
            {isTop ? (
              <View style={styles.crownBadge}>
                <MaterialIcons name="emoji-events" size={16} color={theme.primary} />
              </View>
            ) : (
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            )}
          </View>
          <View style={styles.nameContent}>
            <View style={styles.nameHeader}>
              <Text style={[styles.nameText, isTop && styles.nameTextTop]} numberOfLines={1}>{item.name}</Text>
              <Pressable
                style={styles.nameReportBtn}
                onPress={() => openReportModal(item.id)}
                hitSlop={8}
              >
                <MaterialIcons name="more-vert" size={16} color={theme.textMuted} />
              </Pressable>
            </View>
            <Pressable style={styles.nameSubmitter} onPress={() => navigateToUser(item.submittedBy.id)} hitSlop={4}>
              <Image source={{ uri: item.submittedBy.avatar }} style={styles.nameAvatar} contentFit="cover" />
              <Text style={styles.nameUsername}>@{item.submittedBy.username}</Text>
              {item.submittedBy.isPremium ? (
                <MaterialIcons name="verified" size={12} color={theme.primary} />
              ) : null}
              <Text style={styles.nameTime}>{timeAgo(item.submittedAt)}</Text>
            </Pressable>
          </View>
          <View style={styles.voteSection}>
            <Pressable
              style={[styles.voteBtn, item.userVote === 'up' && styles.voteBtnActiveUp]}
              onPress={() => handleVote(item.id, 'up')}
            >
              <MaterialIcons
                name="arrow-upward"
                size={16}
                color={item.userVote === 'up' ? '#fff' : theme.textMuted}
              />
            </Pressable>
            <Text style={[
              styles.voteCount,
              item.votes > 0 && styles.voteCountPositive,
              item.votes < 0 && styles.voteCountNegative,
            ]}>
              {item.votes}
            </Text>
            <Pressable
              style={[styles.voteBtn, item.userVote === 'down' && styles.voteBtnActiveDown]}
              onPress={() => handleVote(item.id, 'down')}
            >
              <MaterialIcons
                name="arrow-downward"
                size={16}
                color={item.userVote === 'down' ? '#fff' : theme.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.heroWrap}>
              <Image source={{ uri: object.imageUri }} style={styles.heroImage} contentFit="cover" transition={200} />
              <View style={styles.heroOverlay}>
                <Pressable style={styles.heroBack} onPress={() => router.back()}>
                  <MaterialIcons name="arrow-back" size={22} color="#fff" />
                </Pressable>
                <View style={styles.heroRightActions}>
                  {object.isFeatured ? (
                    <View style={styles.heroFeaturedBadge}>
                      <MaterialIcons name="star" size={12} color={theme.background} />
                      <Text style={styles.heroFeaturedText}>FEATURED</Text>
                    </View>
                  ) : null}
                  <Pressable
                    style={styles.heroShareBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      const topN = sortedNames[0];
                      shareObject({
                        objectId: object.id,
                        topName: topN?.name,
                        submitterName: object.submittedBy.displayName,
                      });
                    }}
                  >
                    <MaterialIcons name="share" size={20} color="#fff" />
                  </Pressable>
                  <Pressable
                    style={styles.heroReportBtn}
                    onPress={() => openReportModal()}
                  >
                    <MaterialIcons name="flag" size={20} color={alreadyReported ? theme.warning : '#fff'} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.heroBottom}>
                {topName ? (
                  <Text style={styles.heroName}>{topName.name}</Text>
                ) : null}
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <MaterialIcons name="arrow-upward" size={14} color={theme.upvote} />
                    <Text style={styles.heroStatText}>{object.totalVotes} votes</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <MaterialIcons name="chat-bubble" size={14} color={theme.accent} />
                    <Text style={styles.heroStatText}>{object.suggestedNames.length} names</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <MaterialIcons name="visibility" size={14} color={theme.textMuted} />
                    <Text style={styles.heroStatText}>{object.viewCount} views</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          <View style={styles.contentPad}>
            <Pressable onPress={() => navigateToUser(object.submittedBy.id)}>
              <Animated.View entering={FadeInUp.delay(200)} style={styles.submitterCard}>
                <Image source={{ uri: object.submittedBy.avatar }} style={styles.submitterAvatar} contentFit="cover" />
                <View style={styles.submitterInfo}>
                  <View style={styles.submitterNameRow}>
                    <Text style={styles.submitterName}>{object.submittedBy.displayName}</Text>
                    {object.submittedBy.isPremium ? (
                      <MaterialIcons name="verified" size={14} color={theme.primary} />
                    ) : null}
                    <MaterialIcons name="chevron-right" size={16} color={theme.textMuted} />
                  </View>
                  <Text style={styles.submitterMeta}>
                    {timeAgo(object.submittedAt)} · {object.submittedBy.totalSubmissions} submissions
                  </Text>
                </View>
              </Animated.View>
            </Pressable>

            {object.description ? (
              <Animated.View entering={FadeInUp.delay(250)}>
                <Text style={styles.description}>{object.description}</Text>
              </Animated.View>
            ) : null}

            {/* Google It Card */}
            <Animated.View entering={FadeInUp.delay(300)}>
              <Pressable
                style={styles.googleCard}
                onPress={() => {
                  Haptics.selectionAsync();
                  const query = topName?.name || object.description || 'unknown object';
                  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                  Linking.openURL(url);
                }}
              >
                <View style={styles.googleIconWrap}>
                  <Text style={styles.googleG}>
                    <Text style={{ color: '#4285F4' }}>G</Text>
                    <Text style={{ color: '#EA4335' }}>o</Text>
                    <Text style={{ color: '#FBBC05' }}>o</Text>
                    <Text style={{ color: '#4285F4' }}>g</Text>
                    <Text style={{ color: '#34A853' }}>l</Text>
                    <Text style={{ color: '#EA4335' }}>e</Text>
                  </Text>
                </View>
                <View style={styles.googleTextWrap}>
                  <Text style={styles.googleTitle}>Google It</Text>
                  <Text style={styles.googleSubtitle} numberOfLines={1}>
                    Search for "{topName?.name || 'this object'}"
                  </Text>
                </View>
                <MaterialIcons name="open-in-new" size={18} color={theme.textMuted} />
              </Pressable>
            </Animated.View>

            <AdBanner style={{ marginBottom: 12 }} />

            <View style={styles.namesSection}>
              <View style={styles.namesSectionHeader}>
                <Text style={styles.namesSectionTitle}>Suggested Names</Text>
                <Pressable
                  style={styles.suggestBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowInput(!showInput);
                  }}
                >
                  <MaterialIcons name="add" size={16} color={theme.primary} />
                  <Text style={styles.suggestBtnText}>Suggest</Text>
                </Pressable>
              </View>

              {showInput ? (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.suggestInput}>
                  <TextInput
                    style={styles.suggestTextInput}
                    placeholder="Your name idea..."
                    placeholderTextColor={theme.textMuted}
                    value={newName}
                    onChangeText={setNewName}
                    maxLength={50}
                    autoFocus
                  />
                  <Pressable
                    style={[styles.suggestSubmit, (!newName.trim() || suggesting) && { opacity: 0.4 }]}
                    onPress={handleSuggestName}
                    disabled={suggesting}
                  >
                    {suggesting ? (
                      <ActivityIndicator size="small" color={theme.background} />
                    ) : (
                      <MaterialIcons name="send" size={18} color={theme.background} />
                    )}
                  </Pressable>
                </Animated.View>
              ) : null}

              {sortedNames.length === 0 ? (
                <View style={styles.noNames}>
                  <Text style={styles.noNamesText}>No names yet. Be the first to suggest one!</Text>
                </View>
              ) : null}

              {sortedNames.map((item, index) => renderNameRow(item, index))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowReportModal(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <MaterialIcons name="flag" size={22} color={theme.error} />
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Report Content</Text>
                <Text style={styles.modalSubtitle}>
                  {reportNameId ? 'Report this suggested name' : 'Report this submission'}
                </Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setShowReportModal(false)}>
                <MaterialIcons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.reasonLabel}>Why are you reporting this?</Text>
              {REPORT_REASONS.map((reason) => {
                const selected = reportReason === reason.key;
                return (
                  <Pressable
                    key={reason.key}
                    style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setReportReason(reason.key);
                    }}
                  >
                    <View style={[styles.reasonIcon, selected && styles.reasonIconSelected]}>
                      <MaterialIcons
                        name={reason.icon}
                        size={18}
                        color={selected ? theme.error : theme.textMuted}
                      />
                    </View>
                    <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                      {reason.label}
                    </Text>
                    {selected ? (
                      <MaterialIcons name="check-circle" size={20} color={theme.error} />
                    ) : (
                      <View style={styles.reasonRadio} />
                    )}
                  </Pressable>
                );
              })}

              <Text style={styles.detailsLabel}>Additional details (optional)</Text>
              <TextInput
                style={styles.detailsInput}
                placeholder="Tell us more about the issue..."
                placeholderTextColor={theme.textMuted}
                value={reportDescription}
                onChangeText={setReportDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.detailsCount}>{reportDescription.length}/500</Text>

              <Pressable
                style={[styles.submitReportBtn, (!reportReason || submittingReport) && styles.submitReportBtnDisabled]}
                onPress={handleSubmitReport}
                disabled={!reportReason || submittingReport}
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color={theme.background} />
                ) : (
                  <>
                    <MaterialIcons name="send" size={18} color={theme.background} />
                    <Text style={styles.submitReportText}>Submit Report</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.reportDisclaimer}>
                Our moderation team reviews all reports within 24 hours. False reports may result in account restrictions.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { ...typography.body, color: theme.textSecondary },
  backBtn: { backgroundColor: theme.surface, borderRadius: theme.radiusMedium, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  backBtnText: { ...typography.bodyBold, color: theme.textPrimary },
  heroWrap: { width: '100%', aspectRatio: 1, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54, paddingHorizontal: 16 },
  heroRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroShareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroReportBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroFeaturedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.primary, borderRadius: theme.radiusFull, paddingHorizontal: 10, paddingVertical: 5 },
  heroFeaturedText: { fontSize: 10, fontWeight: '800', color: theme.background },
  heroBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingTop: 60, backgroundColor: 'rgba(0,0,0,0.01)' },
  heroName: { fontSize: 28, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8, marginBottom: 8 },
  heroStats: { flexDirection: 'row', gap: 16 },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatText: { fontSize: 13, fontWeight: '600', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  contentPad: { paddingHorizontal: 16, paddingTop: 16 },
  submitterCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  submitterAvatar: { width: 40, height: 40, borderRadius: 20 },
  submitterInfo: { flex: 1, marginLeft: 10 },
  submitterNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  submitterName: { ...typography.bodyBold },
  submitterMeta: { ...typography.small, marginTop: 2 },
  description: { ...typography.body, color: theme.textSecondary, marginBottom: 16, lineHeight: 22 },
  googleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 14, marginBottom: 16, gap: 12,
    borderWidth: 1, borderColor: theme.border,
  },
  googleIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  googleG: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  googleTextWrap: { flex: 1 },
  googleTitle: { ...typography.bodyBold, fontSize: 15 },
  googleSubtitle: { ...typography.small, color: theme.textSecondary, marginTop: 2 },
  namesSection: { marginTop: 4 },
  namesSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  namesSectionTitle: { ...typography.subtitle, fontSize: 18 },
  suggestBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: theme.radiusFull, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
  suggestBtnText: { ...typography.small, color: theme.primary, fontWeight: '700' },
  suggestInput: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  suggestTextInput: { flex: 1, backgroundColor: theme.surface, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  suggestSubmit: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  noNames: { alignItems: 'center', paddingVertical: 24 },
  noNamesText: { ...typography.caption, textAlign: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.radiusMedium, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  nameRowTop: { borderColor: 'rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,215,0,0.05)' },
  nameRank: { width: 32, alignItems: 'center' },
  crownBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,215,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  rankNumber: { ...typography.captionBold, color: theme.textMuted },
  nameContent: { flex: 1, marginLeft: 8 },
  nameHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameText: { ...typography.bodyBold, flex: 1, marginRight: 8 },
  nameTextTop: { color: theme.primary },
  nameTime: { ...typography.small, marginLeft: 6 },
  nameSubmitter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  nameAvatar: { width: 16, height: 16, borderRadius: 8 },
  nameUsername: { ...typography.small },
  nameReportBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  voteSection: { alignItems: 'center', gap: 2, marginLeft: 8 },
  voteBtn: { width: 32, height: 28, borderRadius: theme.radiusSmall, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceElevated },
  voteBtnActiveUp: { backgroundColor: theme.upvote },
  voteBtnActiveDown: { backgroundColor: theme.downvote },
  voteCount: { ...typography.captionBold, color: theme.textSecondary, minWidth: 20, textAlign: 'center' },
  voteCountPositive: { color: theme.upvote },
  voteCountNegative: { color: theme.downvote },

  // Report Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: theme.borderLight,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 20, gap: 12,
  },
  modalHeaderIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${theme.error}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  modalHeaderText: { flex: 1 },
  modalTitle: { ...typography.subtitle, fontSize: 18 },
  modalSubtitle: { ...typography.caption, marginTop: 2 },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  modalScroll: { paddingHorizontal: 20 },

  reasonLabel: {
    ...typography.captionBold, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10,
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 14, marginBottom: 8, gap: 12,
    borderWidth: 1, borderColor: theme.border,
  },
  reasonRowSelected: {
    borderColor: `${theme.error}50`,
    backgroundColor: `${theme.error}08`,
  },
  reasonIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: theme.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  reasonIconSelected: {
    backgroundColor: `${theme.error}15`,
  },
  reasonText: { ...typography.bodyBold, fontSize: 15, flex: 1 },
  reasonTextSelected: { color: theme.error },
  reasonRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: theme.borderLight,
  },

  detailsLabel: {
    ...typography.captionBold, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 12, marginBottom: 8,
  },
  detailsInput: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMedium,
    padding: 14, fontSize: 15, color: theme.textPrimary,
    borderWidth: 1, borderColor: theme.border,
    minHeight: 80,
  },
  detailsCount: { ...typography.small, textAlign: 'right', marginTop: 4, marginBottom: 16 },

  submitReportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.error,
    borderRadius: theme.radiusMedium,
    paddingVertical: 16,
    marginBottom: 12,
  },
  submitReportBtnDisabled: { opacity: 0.4 },
  submitReportText: { ...typography.button, color: '#fff', fontSize: 16 },

  reportDisclaimer: {
    ...typography.small, color: theme.textMuted,
    textAlign: 'center', lineHeight: 16,
    marginBottom: 8,
  },
});
