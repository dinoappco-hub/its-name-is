import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Modal, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '../../components/SafeIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useAuth, useAlert } from '@/template';
import { useAppTheme } from '../../hooks/useTheme';
import DinoLoader from '../../components/DinoLoader';
import { useApp } from '../../contexts/AppContext';
import { SuggestedName } from '../../services/types';

import { CATEGORIES } from '../../constants/config';
import { theme as staticTheme } from '../../constants/theme';
import { REPORT_REASONS, submitReport, hasUserReported, getReportReasonMeta } from '../../services/reportService';
import { flagSubmission, fetchReportNotificationTargets } from '../../services/adminService';
import { Comment, fetchComments, addComment, deleteComment } from '../../services/commentService';
import { useNotifications } from '../../hooks/useNotifications';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useMute } from '../../hooks/useMute';
import { sendPushNotification } from '../../services/pushService';


export default function ObjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const navigateToUser = useCallback((userId: string) => {
    Haptics?.selectionAsync();
    router.push(`/user/${userId}`);
  }, [router]);
  const { user: authUser } = useAuth();
  const { colors: t, typo } = useAppTheme();
  const { objects, vote, addNameSuggestion, currentUser, trackView, deleteSubmission, updateDescription, adminDeleteSubmission, adminToggleFeatured } = useApp();
  const { addNotification } = useNotifications();
  const { scaledSize, fontWeight: fw, triggerHaptic, shouldAnimate, subtleTextColor, a11yProps } = useAccessibility();
  const { isUserMuted, muteUser: muteUserAction, unmuteUser: unmuteUserAction } = useMute();
  const { sendRemotePush } = useNotifications();
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

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Edit description state
  const [editingDescription, setEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);

  const object = useMemo(() => objects.find(o => o.id === id), [objects, id]);

  useEffect(() => {
    if (id) trackView(id);
  }, [id, trackView]);

  // Load comments
  useEffect(() => {
    if (id) loadComments();
  }, [id]);

  const loadComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    const { data } = await fetchComments(id);
    setComments(data);
    setCommentsLoading(false);
  };

  const handleShare = useCallback(async () => {
    if (!object || sharing) return;
    setSharing(true);
    triggerHaptic('selection');
    const topN = [...object.suggestedNames].sort((a, b) => b.votes - a.votes)[0];
    const shareText = topN
      ? `Check out "${topN.name}" on its name is. app!`
      : `Check out this object on its name is. app!`;

    try {
      if (Platform.OS !== 'web') {
        try {
          const FileSystem = require('expo-file-system');
          const Sharing = require('expo-sharing');
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            const fileUri = `${FileSystem.cacheDirectory}share_${object.id}.jpg`;
            const download = await FileSystem.downloadAsync(object.imageUri, fileUri);
            if (download.status === 200) {
              await Sharing.shareAsync(download.uri, {
                mimeType: 'image/jpeg',
                dialogTitle: shareText,
              });
              setSharing(false);
              return;
            }
          }
        } catch {
          // Fall through to Share.share
        }
      }
      await Share.share({ message: shareText, url: object.imageUri });
    } catch {
      // user cancelled or error
    }
    setSharing(false);
  }, [object, sharing, triggerHaptic]);

  // Check if user already reported this object
  useEffect(() => {
    if (authUser?.id && id) {
      hasUserReported(authUser.id, id).then(setAlreadyReported);
    }
  }, [authUser?.id, id]);

  const isOwnPost = object?.submittedBy.id === authUser?.id;
  const isAdmin = currentUser.isAdmin === true;

  const handleStartEditDescription = useCallback(() => {
    if (!object) return;
    triggerHaptic('selection');
    setEditedDescription(object.description || '');
    setEditingDescription(true);
  }, [object, triggerHaptic]);

  const handleSaveDescription = useCallback(async () => {
    if (!object) return;
    setSavingDescription(true);
    const { error } = await updateDescription(object.id, editedDescription.trim());
    setSavingDescription(false);
    if (error) {
      showAlert('Error', error);
      return;
    }
    Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Success);
    setEditingDescription(false);
  }, [object, editedDescription, updateDescription, showAlert]);

  const handleCancelEditDescription = useCallback(() => {
    setEditingDescription(false);
    setEditedDescription('');
  }, []);

  const handleDeletePost = useCallback(() => {
    triggerHaptic('impact');
    showAlert('Delete Submission', 'This will permanently remove this post and all its names, votes, and comments. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const deleteFunc = isOwnPost ? deleteSubmission : adminDeleteSubmission;
          const { error } = await deleteFunc(id!);
          if (error) {
            showAlert('Error', error);
          } else {
            router.back();
          }
        },
      },
    ]);
  }, [id, isOwnPost, deleteSubmission, adminDeleteSubmission, triggerHaptic, showAlert, router]);

  const handleToggleFeatured = useCallback(async () => {
    if (!object || !isAdmin) return;
    triggerHaptic('selection');
    const newFeatured = !object.isFeatured;
    const { error } = await adminToggleFeatured(object.id, newFeatured);
    if (error) {
      showAlert('Error', error);
    }
  }, [object, isAdmin, adminToggleFeatured, triggerHaptic, showAlert]);

  const openReportModal = useCallback((nameId?: string) => {
    if (alreadyReported) {
      showAlert('Already Reported', 'You have already reported this submission. Our team will review it.');
      return;
    }
    Haptics?.selectionAsync();
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

    Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Success);
    setShowReportModal(false);
    setAlreadyReported(true);
    showAlert('Report Submitted', 'Thank you. Our moderation team will review this content shortly.');

    // Auto-flag the submission with the specific violation type
    const reasonMeta = getReportReasonMeta(reportReason);
    flagSubmission(id, reasonMeta.label);

    // Send push notifications to all admin users + primary notification email
    const reasonLabel = reasonMeta.label;
    fetchReportNotificationTargets().then(targetIds => {
      for (const targetId of targetIds) {
        if (targetId !== authUser?.id) {
          sendPushNotification({
            targetUserId: targetId,
            title: 'New Report Filed',
            body: `@${currentUser.username} reported a post: ${reasonLabel}`,
            data: { objectId: id, type: 'admin_report' },
          });
        }
      }
    });
  }, [reportReason, reportDescription, reportNameId, authUser?.id, id, showAlert]);

  const handlePostComment = useCallback(async () => {
    if (!commentText.trim() || !authUser?.id || !id) return;
    if (currentUser.isBanned) {
      showAlert('Account Suspended', 'Your account has been suspended. You cannot post comments.' + (currentUser.banReason ? ` Reason: ${currentUser.banReason}` : ''));
      return;
    }
    if (commentText.trim().length < 2) {
      showAlert('Too short', 'Comments must be at least 2 characters.');
      return;
    }

    setSubmittingComment(true);
    const { error } = await addComment(id, authUser.id, commentText.trim(), replyingTo?.id || undefined);
    setSubmittingComment(false);

    if (error) {
      showAlert('Error', error);
      return;
    }

    Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Success);
    setCommentText('');

    // Send push notification to the object owner for new comments
    if (object && object.submittedBy.id !== authUser.id) {
      addNotification({
        type: 'comment',
        title: 'New Comment',
        body: `@${currentUser.username} commented on your object`,
        objectId: id,
        objectImageUri: object.imageUri,
        fromUser: { username: currentUser.username, avatar: currentUser.avatar },
      });
      sendRemotePush({
        targetUserId: object.submittedBy.id,
        title: 'New Comment',
        body: `@${currentUser.username} commented on your object`,
        data: { objectId: id, type: 'comment' },
      });
    }

    // Send push to the user being replied to
    if (replyingTo) {
      const replyTarget = comments.find(c => c.id === replyingTo.id);
      if (replyTarget && replyTarget.userId !== authUser.id) {
        sendRemotePush({
          targetUserId: replyTarget.userId,
          title: 'New Reply',
          body: `@${currentUser.username} replied to your comment`,
          data: { objectId: id, type: 'comment' },
        });
      }
    }

    setReplyingTo(null);
    await loadComments();
  }, [commentText, authUser?.id, id, replyingTo, showAlert, object, currentUser, addNotification, sendRemotePush, comments]);

  const handleDeleteComment = useCallback((commentId: string) => {
    showAlert('Delete Comment?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteComment(commentId);
          if (error) {
            showAlert('Error', error);
            return;
          }
          Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Success);
          await loadComments();
        },
      },
    ]);
  }, [showAlert]);

  const handleReply = useCallback((commentId: string, username: string) => {
    Haptics?.selectionAsync();
    setReplyingTo({ id: commentId, username });
    setCommentText(`@${username} `);
  }, []);

  const totalCommentCount = useMemo(() => {
    let count = 0;
    const countAll = (list: Comment[]) => {
      for (const c of list) {
        count++;
        if (c.replies.length > 0) countAll(c.replies);
      }
    };
    countAll(comments);
    return count;
  }, [comments]);

  if (!object) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.notFound}>
          <MaterialIcons name="error-outline" size={48} color={t.textMuted} />
          <Text style={[styles.notFoundText, { color: t.textSecondary }]}>Object not found</Text>
          <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: t.textPrimary }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sortedNames = [...object.suggestedNames].sort((a, b) => b.votes - a.votes);
  const topName = sortedNames[0];

  const handleVote = (nameId: string, direction: 'up' | 'down') => {
    triggerHaptic('selection');
    vote(object.id, nameId, direction);
  };

  const handleSuggestName = async () => {
    if (!newName.trim()) return;
    if (currentUser.isBanned) {
      showAlert('Account Suspended', 'Your account has been suspended. You cannot suggest names.');
      return;
    }
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
    Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Success);
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

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isOwn = comment.userId === authUser?.id;
    const maxDepth = 2;
    const indent = Math.min(depth, maxDepth) * 24;

    return (
      <View key={comment.id} style={{ marginLeft: indent }}>
        <View style={[styles.commentCard, { backgroundColor: t.surface, borderColor: t.border }, depth > 0 && { backgroundColor: t.surfaceElevated, borderColor: t.borderLight }]}>
          <Pressable onPress={() => navigateToUser(comment.user.id)} hitSlop={4}>
            <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatar} contentFit="cover" />
          </Pressable>
          <View style={styles.commentBody}>
            <View style={styles.commentHeader}>
              <Pressable style={styles.commentUserRow} onPress={() => navigateToUser(comment.user.id)} hitSlop={4}>
                <Text style={[styles.commentUsername, { color: t.textPrimary }]} numberOfLines={1}>
                  @{comment.user.username}
                </Text>
              </Pressable>
              <Text style={[styles.commentTime, { color: t.textMuted }]}>{timeAgo(comment.createdAt)}</Text>
            </View>
            <Text style={[styles.commentContent, { color: t.textSecondary }]}>{comment.content}</Text>
            <View style={styles.commentActions}>
              <Pressable
                style={styles.commentAction}
                onPress={() => handleReply(comment.id, comment.user.username || comment.user.displayName)}
                hitSlop={8}
              >
                <MaterialIcons name="reply" size={14} color={t.textMuted} />
                <Text style={[styles.commentActionText, { color: t.textMuted }]}>Reply</Text>
              </Pressable>
              {isOwn ? (
                <Pressable
                  style={styles.commentAction}
                  onPress={() => handleDeleteComment(comment.id)}
                  hitSlop={8}
                >
                  <MaterialIcons name="delete-outline" size={14} color={t.error} />
                  <Text style={[styles.commentActionText, { color: t.error }]}>Delete</Text>
                </Pressable>
              ) : isAdmin ? (
                <Pressable
                  style={styles.commentAction}
                  onPress={() => handleDeleteComment(comment.id)}
                  hitSlop={8}
                >
                  <MaterialIcons name="delete-outline" size={14} color={t.error} />
                  <Text style={[styles.commentActionText, { color: t.error }]}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
        {comment.replies.length > 0 ? (
          <View>
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderNameRow = (item: SuggestedName, index: number) => {
    const isTop = index === 0;
    return (
      <Animated.View
        key={item.id}
        entering={shouldAnimate ? FadeInDown.delay(index * 60).duration(350) : undefined}
      >
        <View style={[styles.nameRow, { backgroundColor: t.surface, borderColor: t.border }, isTop && { borderColor: `${t.primary}40`, backgroundColor: `${t.primary}08` }]}>
          <View style={styles.nameRank}>
            {isTop ? (
              <View style={[styles.crownBadge, { backgroundColor: `${t.primary}20` }]}>
                <MaterialIcons name="emoji-events" size={16} color={t.primary} />
              </View>
            ) : (
              <Text style={[styles.rankNumber, { color: t.textMuted }]}>#{index + 1}</Text>
            )}
          </View>
          <View style={styles.nameContent}>
            <View style={styles.nameHeader}>
              <Text style={[styles.nameText, { color: t.textPrimary }, isTop && { color: t.primary }]} numberOfLines={1}>{item.name}</Text>
              <Pressable
                style={styles.nameReportBtn}
                onPress={() => openReportModal(item.id)}
                hitSlop={8}
              >
                <MaterialIcons name="more-vert" size={16} color={t.textMuted} />
              </Pressable>
            </View>
            <Pressable style={styles.nameSubmitter} onPress={() => navigateToUser(item.submittedBy.id)} hitSlop={4}>
              <Image source={{ uri: item.submittedBy.avatar }} style={styles.nameAvatar} contentFit="cover" />
              <Text style={[styles.nameUsername, { color: t.textSecondary }]}>@{item.submittedBy.username}</Text>
              <Text style={[styles.nameTime, { color: t.textMuted }]}>{timeAgo(item.submittedAt)}</Text>
            </Pressable>
          </View>
          <View style={styles.voteSection}>
            <Pressable
              style={[styles.voteBtn, { backgroundColor: t.surfaceElevated }, item.userVote === 'up' && styles.voteBtnActiveUp]}
              onPress={() => handleVote(item.id, 'up')}
            >
              <MaterialIcons
                name="arrow-upward"
                size={16}
                color={item.userVote === 'up' ? '#fff' : t.textMuted}
              />
            </Pressable>
            <Text style={[
              styles.voteCount, { color: t.textSecondary },
              item.votes > 0 && styles.voteCountPositive,
              item.votes < 0 && styles.voteCountNegative,
            ]}>
              {item.votes}
            </Text>
            <Pressable
              style={[styles.voteBtn, { backgroundColor: t.surfaceElevated }, item.userVote === 'down' && styles.voteBtnActiveDown]}
              onPress={() => handleVote(item.id, 'down')}
            >
              <MaterialIcons
                name="arrow-downward"
                size={16}
                color={item.userVote === 'down' ? '#fff' : t.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <Animated.View entering={shouldAnimate ? FadeIn.duration(400) : undefined}>
            <View style={styles.heroWrap}>
              <Image source={{ uri: object.imageUri }} style={styles.heroImage} contentFit="cover" transition={200} />
              <View style={styles.heroOverlay}>
                <Pressable style={styles.heroBack} onPress={() => router.back()}>
                  <MaterialIcons name="arrow-back" size={22} color="#fff" />
                </Pressable>
                <View style={styles.heroRightActions}>
                  {isAdmin ? (
                    <Pressable
                      style={[styles.heroShareBtn, object.isFeatured && { backgroundColor: 'rgba(255,215,0,0.6)' }]}
                      onPress={handleToggleFeatured}
                    >
                      <MaterialIcons name={object.isFeatured ? 'star' : 'star-outline'} size={20} color={object.isFeatured ? '#000' : '#fff'} />
                    </Pressable>
                  ) : object.isFeatured ? (
                    <View style={styles.heroFeaturedBadge}>
                      <MaterialIcons name="star" size={12} color={t.background} />
                      <Text style={[styles.heroFeaturedText, { color: t.background }]}>FEATURED</Text>
                    </View>
                  ) : null}
                  <Pressable
                    style={styles.heroShareBtn}
                    onPress={handleShare}
                    disabled={sharing}
                  >
                    {sharing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <MaterialIcons name="share" size={20} color="#fff" />
                    )}
                  </Pressable>
                  {(isOwnPost || isAdmin) ? (
                    <Pressable
                      style={styles.heroDeleteBtn}
                      onPress={handleDeletePost}
                    >
                      <MaterialIcons name="delete" size={20} color="#EF4444" />
                    </Pressable>
                  ) : (
                    <>
                      <Pressable
                        style={[styles.heroReportBtn, isUserMuted(object.submittedBy.id) && { backgroundColor: 'rgba(239,68,68,0.5)' }]}
                        onPress={() => {
                          Haptics?.selectionAsync();
                          const muted = isUserMuted(object.submittedBy.id);
                          if (muted) {
                            showAlert('Unmute User', `Show posts from @${object.submittedBy.username} again?`, [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Unmute', onPress: () => unmuteUserAction(object.submittedBy.id) },
                            ]);
                          } else {
                            showAlert('Mute User', `Hide posts and comments from @${object.submittedBy.username}?`, [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Mute', style: 'destructive', onPress: () => muteUserAction(object.submittedBy.id) },
                            ]);
                          }
                        }}
                      >
                        <MaterialIcons name={isUserMuted(object.submittedBy.id) ? 'volume-off' : 'volume-up'} size={18} color="#fff" />
                      </Pressable>
                      <Pressable
                        style={styles.heroReportBtn}
                        onPress={() => openReportModal()}
                      >
                        <MaterialIcons name="flag" size={20} color={alreadyReported ? t.warning : '#fff'} />
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.heroBottom}>
                {topName ? (
                  <Text style={[styles.heroName, { fontSize: scaledSize(28), fontWeight: fw('700') }]}>{topName.name}</Text>
                ) : null}
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <MaterialIcons name="arrow-upward" size={14} color={t.upvote} />
                    <Text style={styles.heroStatText}>{object.totalVotes} votes</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <MaterialIcons name="chat-bubble" size={14} color={t.accent} />
                    <Text style={styles.heroStatText}>{object.suggestedNames.length} names</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <MaterialIcons name="visibility" size={14} color={t.textMuted} />
                    <Text style={styles.heroStatText}>{object.viewCount} views</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          <View style={styles.contentPad}>
            <Pressable onPress={() => navigateToUser(object.submittedBy.id)}>
              <Animated.View entering={shouldAnimate ? FadeInUp.delay(200) : undefined} style={styles.submitterCard}>
                <Image source={{ uri: object.submittedBy.avatar }} style={styles.submitterAvatar} contentFit="cover" />
                <View style={styles.submitterInfo}>
                  <View style={styles.submitterNameRow}>
                    <Text style={[styles.submitterName, { color: t.textPrimary }]}>@{object.submittedBy.username}</Text>
                    <MaterialIcons name="chevron-right" size={16} color={t.textMuted} />
                  </View>
                  <Text style={[styles.submitterMeta, { color: t.textMuted }]}>
                    {timeAgo(object.submittedAt)} · {object.submittedBy.totalSubmissions} submissions
                  </Text>
                </View>
              </Animated.View>
            </Pressable>

            {/* Category Badge */}
            {object.category ? (
              <Animated.View entering={shouldAnimate ? FadeInUp.delay(230) : undefined}>
                {(() => {
                  const cat = CATEGORIES.find(c => c.key === object.category);
                  if (!cat || cat.key === 'all') return null;
                  return (
                    <View style={[styles.categoryBadge, { backgroundColor: `${cat.color}15`, borderColor: `${cat.color}30` }]}>
                      <MaterialIcons name={cat.icon} size={14} color={cat.color} />
                      <Text style={[styles.categoryBadgeText, { color: cat.color }]}>{cat.label}</Text>
                    </View>
                  );
                })()}
              </Animated.View>
            ) : null}

            <Animated.View entering={shouldAnimate ? FadeInUp.delay(250) : undefined}>
              {editingDescription ? (
                <View style={[styles.editDescWrap, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <TextInput
                    style={[styles.editDescInput, { color: t.textPrimary, borderColor: t.border }]}
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    placeholder="Add a description..."
                    placeholderTextColor={t.textMuted}
                    multiline
                    maxLength={300}
                    autoFocus
                  />
                  <Text style={[styles.editDescCount, { color: t.textMuted }]}>{editedDescription.length}/300</Text>
                  <View style={styles.editDescActions}>
                    <Pressable style={[styles.editDescCancelBtn, { borderColor: t.border }]} onPress={handleCancelEditDescription}>
                      <Text style={[styles.editDescCancelText, { color: t.textSecondary }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.editDescSaveBtn, { backgroundColor: t.primary }, savingDescription && { opacity: 0.5 }]}
                      onPress={handleSaveDescription}
                      disabled={savingDescription}
                    >
                      {savingDescription ? (
                        <ActivityIndicator size="small" color={t.background} />
                      ) : (
                        <Text style={[styles.editDescSaveText, { color: t.background }]}>Save</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.descriptionRow}>
                  {object.description ? (
                    <Text style={[styles.description, { color: t.textSecondary, flex: 1 }]}>{object.description}</Text>
                  ) : isOwnPost ? (
                    <Text style={[styles.description, { color: t.textMuted, fontStyle: 'italic', flex: 1 }]}>No description yet</Text>
                  ) : null}
                  {isOwnPost ? (
                    <Pressable style={styles.editDescBtn} onPress={handleStartEditDescription} hitSlop={8}>
                      <MaterialIcons name="edit" size={16} color={t.primary} />
                    </Pressable>
                  ) : null}
                </View>
              )}
            </Animated.View>

            <View style={styles.namesSection}>
              <View style={styles.namesSectionHeader}>
                <Text style={[styles.namesSectionTitle, { color: t.textPrimary }]}>Suggested Names</Text>
                <Pressable
                  style={[styles.suggestBtn, { borderColor: `${t.primary}40`, backgroundColor: `${t.primary}15` }]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setShowInput(!showInput);
                  }}
                >
                  <MaterialIcons name="add" size={16} color={t.primary} />
                  <Text style={[styles.suggestBtnText, { color: t.primary }]}>Suggest</Text>
                </Pressable>
              </View>

              {showInput ? (
                <Animated.View entering={shouldAnimate ? FadeInDown.duration(300) : undefined} style={styles.suggestInput}>
                  <TextInput
                    style={[styles.suggestTextInput, { backgroundColor: t.surface, color: t.textPrimary, borderColor: t.border }]}
                    placeholder="Your name idea..."
                    placeholderTextColor={t.textMuted}
                    value={newName}
                    onChangeText={setNewName}
                    maxLength={50}
                    autoFocus
                  />
                  <Pressable
                    style={[styles.suggestSubmit, { backgroundColor: t.primary }, (!newName.trim() || suggesting) && { opacity: 0.4 }]}
                    onPress={handleSuggestName}
                    disabled={suggesting}
                  >
                    {suggesting ? (
                      <ActivityIndicator size="small" color={t.background} />
                    ) : (
                      <MaterialIcons name="send" size={18} color={t.background} />
                    )}
                  </Pressable>
                </Animated.View>
              ) : null}

              {sortedNames.length === 0 ? (
                <View style={styles.noNames}>
                  <Text style={[styles.noNamesText, { color: t.textMuted }]}>No names yet. Be the first to suggest one!</Text>
                </View>
              ) : null}

              {sortedNames.map((item, index) => renderNameRow(item, index))}
            </View>

            {/* Comments Section */}
            <Animated.View entering={shouldAnimate ? FadeInUp.delay(400) : undefined} style={[styles.commentsSection, { borderTopColor: t.border }]}>
              <View style={styles.commentsSectionHeader}>
                <View style={styles.commentsTitleRow}>
                  <MaterialIcons name="forum" size={20} color={t.accent} />
                  <Text style={[styles.commentsSectionTitle, { fontSize: scaledSize(18), fontWeight: fw('700'), color: t.textPrimary }]}>Discussion</Text>
                  <View style={[styles.commentCountBadge, { backgroundColor: t.accent }]}>
                    <Text style={styles.commentCountText}>{totalCommentCount}</Text>
                  </View>
                </View>
              </View>

              {/* Reply indicator */}
              {replyingTo ? (
                <View style={[styles.replyIndicator, { backgroundColor: `${t.accent}15`, borderLeftColor: t.accent }]}>
                  <MaterialIcons name="reply" size={14} color={t.accent} />
                  <Text style={[styles.replyIndicatorText, { color: t.accent }]}>
                    Replying to @{replyingTo.username}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setReplyingTo(null);
                      setCommentText('');
                    }}
                    hitSlop={8}
                  >
                    <MaterialIcons name="close" size={16} color={t.textMuted} />
                  </Pressable>
                </View>
              ) : null}

              {/* Comment input */}
              <View style={styles.commentInputRow}>
                <Image
                  source={{ uri: currentUser.avatar }}
                  style={styles.commentInputAvatar}
                  contentFit="cover"
                />
                <TextInput
                  style={[styles.commentTextInput, { backgroundColor: t.surface, color: t.textPrimary, borderColor: t.border }]}
                  placeholder="Add a comment..."
                  placeholderTextColor={t.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={500}
                  multiline
                />
                <Pressable
                  style={[styles.commentSendBtn, { backgroundColor: t.accent }, (!commentText.trim() || submittingComment) && { opacity: 0.3 }]}
                  onPress={handlePostComment}
                  disabled={!commentText.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color={t.background} />
                  ) : (
                    <MaterialIcons name="send" size={16} color={t.background} />
                  )}
                </Pressable>
              </View>

              {/* Comments list */}
              {commentsLoading ? (
                <View style={styles.commentsLoading}>
                  <ActivityIndicator size="small" color={t.accent} />
                  <Text style={[styles.commentsLoadingText, { color: t.textMuted }]}>Loading discussion...</Text>
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.noComments}>
                  <MaterialIcons name="chat-bubble-outline" size={32} color={t.textMuted} />
                  <Text style={[styles.noCommentsTitle, { color: t.textSecondary }]}>No comments yet</Text>
                  <Text style={[styles.noCommentsText, { color: t.textMuted }]}>Start the discussion about this object</Text>
                </View>
              ) : (
                <View style={styles.commentsList}>
                  {displayedComments.map(comment => renderComment(comment, 0))}
                  {comments.length > 3 && !showAllComments ? (
                    <Pressable
                      style={styles.showMoreBtn}
                      onPress={() => {
                        Haptics?.selectionAsync();
                        setShowAllComments(true);
                      }}
                    >
                      <Text style={[styles.showMoreText, { color: t.accent }]}>
                        Show all {totalCommentCount} comments
                      </Text>
                      <MaterialIcons name="expand-more" size={18} color={t.accent} />
                    </Pressable>
                  ) : null}
                </View>
              )}
            </Animated.View>
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
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, backgroundColor: t.background }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: `${t.error}15` }]}>
                <MaterialIcons name="flag" size={22} color={t.error} />
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Report Content</Text>
                <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>
                  {reportNameId ? 'Report this suggested name' : 'Report this submission'}
                </Text>
              </View>
              <Pressable style={[styles.modalCloseBtn, { backgroundColor: t.surface }]} onPress={() => setShowReportModal(false)}>
                <MaterialIcons name="close" size={20} color={t.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.reasonLabel, { color: t.textMuted }]}>Why are you reporting this?</Text>
              {REPORT_REASONS.map((reason) => {
                const selected = reportReason === reason.key;
                return (
                  <Pressable
                    key={reason.key}
                    style={[styles.reasonRow, { backgroundColor: t.surface, borderColor: t.border }, selected && { borderColor: `${t.error}50`, backgroundColor: `${t.error}08` }]}
                    onPress={() => {
                      Haptics?.selectionAsync();
                      setReportReason(reason.key);
                    }}
                  >
                    <View style={[styles.reasonIcon, { backgroundColor: t.surfaceElevated }, selected && { backgroundColor: `${reason.color}15` }]}>
                      <MaterialIcons
                        name={reason.icon}
                        size={18}
                        color={selected ? reason.color : t.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reasonText, { color: t.textPrimary }, selected && { color: reason.color }]}>
                        {reason.label}
                      </Text>
                      <Text style={[{ fontSize: 11, marginTop: 1, color: t.textMuted }]}>
                        {reason.contentType === 'image' ? 'Image content issue' : reason.contentType === 'text' ? 'Text/name issue' : 'General violation'}
                      </Text>
                    </View>
                    {selected ? (
                      <MaterialIcons name="check-circle" size={20} color={reason.color} />
                    ) : (
                      <View style={[styles.reasonRadio, { borderColor: t.borderLight }]} />
                    )}
                  </Pressable>
                );
              })}

              <Text style={[styles.detailsLabel, { color: t.textMuted }]}>Additional details (optional)</Text>
              <TextInput
                style={[styles.detailsInput, { backgroundColor: t.surface, color: t.textPrimary, borderColor: t.border }]}
                placeholder="Tell us more about the issue..."
                placeholderTextColor={t.textMuted}
                value={reportDescription}
                onChangeText={setReportDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.detailsCount, { color: t.textMuted }]}>{reportDescription.length}/500</Text>

              <Pressable
                style={[styles.submitReportBtn, { backgroundColor: t.error }, (!reportReason || submittingReport) && styles.submitReportBtnDisabled]}
                onPress={handleSubmitReport}
                disabled={!reportReason || submittingReport}
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color={t.background} />
                ) : (
                  <>
                    <MaterialIcons name="send" size={18} color={t.background} />
                    <Text style={styles.submitReportText}>Submit Report</Text>
                  </>
                )}
              </Pressable>

              <Text style={[styles.reportDisclaimer, { color: t.textMuted }]}>
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
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 15 },
  backBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  backBtnText: { fontSize: 15, fontWeight: '600' },
  heroWrap: { width: '100%', aspectRatio: 1, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54, paddingHorizontal: 16 },
  heroRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  heroReportBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroDeleteBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroShareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroFeaturedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: staticTheme.primary, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 5 },
  heroFeaturedText: { fontSize: 10, fontWeight: '800' },
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
  submitterName: { fontSize: 15, fontWeight: '600' },
  submitterMeta: { fontSize: 12, marginTop: 2 },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: '700' },
  description: { fontSize: 15, marginBottom: 16, lineHeight: 22 },
  descriptionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 16 },
  editDescBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: -4 },
  editDescWrap: { borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1 },
  editDescInput: { fontSize: 15, lineHeight: 22, minHeight: 60, textAlignVertical: 'top', marginBottom: 6 },
  editDescCount: { fontSize: 11, textAlign: 'right', marginBottom: 10 },
  editDescActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  editDescCancelBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
  editDescCancelText: { fontSize: 13, fontWeight: '600' },
  editDescSaveBtn: { borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  editDescSaveText: { fontSize: 13, fontWeight: '700' },
  namesSection: { marginTop: 4 },
  namesSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  namesSectionTitle: { fontSize: 18, fontWeight: '700' },
  suggestBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  suggestBtnText: { fontSize: 12, fontWeight: '700' },
  suggestInput: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  suggestTextInput: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
  suggestSubmit: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  noNames: { alignItems: 'center', paddingVertical: 24 },
  noNamesText: { fontSize: 13, textAlign: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  nameRank: { width: 32, alignItems: 'center' },
  crownBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankNumber: { fontSize: 13, fontWeight: '600' },
  nameContent: { flex: 1, marginLeft: 8 },
  nameHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameText: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  nameTime: { fontSize: 12, marginLeft: 6 },
  nameSubmitter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  nameAvatar: { width: 16, height: 16, borderRadius: 8 },
  nameUsername: { fontSize: 12 },
  nameReportBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  voteSection: { alignItems: 'center', gap: 2, marginLeft: 8 },
  voteBtn: { width: 32, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  voteBtnActiveUp: { backgroundColor: staticTheme.upvote },
  voteBtnActiveDown: { backgroundColor: staticTheme.downvote },
  voteCount: { fontSize: 13, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  voteCountPositive: { color: staticTheme.upvote },
  voteCountNegative: { color: staticTheme.downvote },

  // Comments Section
  commentsSection: {
    marginTop: 28,
    borderTopWidth: 1,
    paddingTop: 20,
  },
  commentsSectionHeader: {
    marginBottom: 16,
  },
  commentsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  commentCountBadge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  commentCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Reply indicator
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  replyIndicatorText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },

  // Comment input
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  commentTextInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    maxHeight: 100,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  // Comments loading
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  commentsLoadingText: {
    fontSize: 13,
  },

  // No comments
  noComments: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  noCommentsTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  noCommentsText: {
    fontSize: 13,
  },

  // Comment card
  commentsList: {
    gap: 4,
  },
  commentCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    marginTop: 2,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 10,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Show more
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Report Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 20, gap: 12,
  },
  modalHeaderIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSubtitle: { fontSize: 13, marginTop: 2 },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  modalScroll: { paddingHorizontal: 20 },

  reasonLabel: {
    fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10,
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12,
    padding: 14, marginBottom: 8, gap: 12,
    borderWidth: 1,
  },
  reasonIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  reasonText: { fontSize: 15, fontWeight: '600' },
  reasonRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2,
  },

  detailsLabel: {
    fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 12, marginBottom: 8,
  },
  detailsInput: {
    borderRadius: 12,
    padding: 14, fontSize: 15,
    borderWidth: 1,
    minHeight: 80,
  },
  detailsCount: { fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: 16 },

  submitReportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  submitReportBtnDisabled: { opacity: 0.4 },
  submitReportText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  reportDisclaimer: {
    fontSize: 12,
    textAlign: 'center', lineHeight: 16,
    marginBottom: 8,
  },
});
