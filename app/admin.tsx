import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth, useAlert } from '@/template';
import { useAppTheme } from '../hooks/useTheme';
import { useApp } from '../contexts/AppContext';
import { Report, fetchAllReports, updateReportStatus, REPORT_REASONS, getReportReasonMeta } from '../services/reportService';
import {
  ActivityLogEntry, FlaggedSubmission, AdminUserEntry,
  logAdminAction, fetchActivityLog,
  banUser, unbanUser,
  fetchFlaggedSubmissions, unflagSubmission,
  fetchUsersForAdmin,
} from '../services/adminService';

type AdminTab = 'reports' | 'queue' | 'users' | 'log';
type FilterStatus = 'all' | 'pending' | 'reviewed' | 'dismissed';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t } = useAppTheme();
  const { currentUser, adminDeleteSubmission, refreshObjects } = useApp();
  const { user: authUser } = useAuth();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<AdminTab>('reports');

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsRefreshing, setReportsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');

  // Queue state
  const [queue, setQueue] = useState<FlaggedSubmission[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<AdminUserEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [banTarget, setBanTarget] = useState<AdminUserEntry | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banning, setBanning] = useState(false);

  // Activity log state
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // ──── Bulk Selection State ────
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [selectedQueueIds, setSelectedQueueIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    if (!currentUser.isAdmin) {
      router.back();
      return;
    }
    loadReports();
  }, [currentUser.isAdmin]);

  useEffect(() => {
    if (activeTab === 'queue' && queue.length === 0) loadQueue();
    if (activeTab === 'users' && users.length === 0) loadUsers();
    if (activeTab === 'log' && activityLog.length === 0) loadActivityLog();
  }, [activeTab]);

  // Reset bulk mode when switching tabs
  useEffect(() => {
    setBulkMode(false);
    setSelectedReportIds(new Set());
    setSelectedQueueIds(new Set());
  }, [activeTab]);

  const loadReports = async () => {
    setReportsLoading(true);
    const { data, error } = await fetchAllReports();
    if (!error) setReports(data);
    setReportsLoading(false);
  };

  const loadQueue = async () => {
    setQueueLoading(true);
    const { data } = await fetchFlaggedSubmissions();
    setQueue(data);
    setQueueLoading(false);
  };

  const loadUsers = async (search?: string) => {
    setUsersLoading(true);
    const { data } = await fetchUsersForAdmin(search);
    setUsers(data);
    setUsersLoading(false);
  };

  const loadActivityLog = async () => {
    setLogLoading(true);
    const { data } = await fetchActivityLog();
    setActivityLog(data);
    setLogLoading(false);
  };

  const handleRefresh = useCallback(async () => {
    setReportsRefreshing(true);
    if (activeTab === 'reports') {
      const { data } = await fetchAllReports();
      if (data) setReports(data);
    } else if (activeTab === 'queue') {
      await loadQueue();
    } else if (activeTab === 'users') {
      await loadUsers(userSearch || undefined);
    } else {
      await loadActivityLog();
    }
    setReportsRefreshing(false);
  }, [activeTab, userSearch]);

  // ──── Reports helpers ────
  const filteredReports = useMemo(() => {
    if (filter === 'all') return reports;
    return reports.filter(r => r.status === filter);
  }, [reports, filter]);

  const statusCounts = useMemo(() => ({
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }), [reports]);

  const handleUpdateStatus = useCallback(async (reportId: string, status: string) => {
    Haptics.selectionAsync();
    const { error } = await updateReportStatus(reportId, status);
    if (error) { showAlert('Error', error); return; }
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    if (authUser?.id) {
      logAdminAction({ adminId: authUser.id, actionType: `report_${status}`, targetType: 'report', targetId: reportId, details: `Marked report as ${status}` });
    }
  }, [authUser?.id, showAlert]);

  const handleDeleteReportedObject = useCallback((reportId: string, objectId: string) => {
    showAlert('Delete Object', 'Remove this reported object and all associated data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await adminDeleteSubmission(objectId);
          if (error) { showAlert('Error', error); return; }
          await handleUpdateStatus(reportId, 'reviewed');
          if (authUser?.id) {
            logAdminAction({ adminId: authUser.id, actionType: 'delete_submission', targetType: 'submission', targetId: objectId, details: 'Deleted reported submission' });
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [adminDeleteSubmission, handleUpdateStatus, authUser?.id, showAlert]);

  // ──── Bulk Actions ────
  const toggleReportSelection = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedReportIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleQueueSelection = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedQueueIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAllReports = useCallback(() => {
    Haptics.selectionAsync();
    const pending = filteredReports.filter(r => r.status === 'pending');
    if (selectedReportIds.size === pending.length) {
      setSelectedReportIds(new Set());
    } else {
      setSelectedReportIds(new Set(pending.map(r => r.id)));
    }
  }, [filteredReports, selectedReportIds]);

  const selectAllQueue = useCallback(() => {
    Haptics.selectionAsync();
    if (selectedQueueIds.size === queue.length) {
      setSelectedQueueIds(new Set());
    } else {
      setSelectedQueueIds(new Set(queue.map(q => q.id)));
    }
  }, [queue, selectedQueueIds]);

  const handleBulkDismissReports = useCallback(async () => {
    if (selectedReportIds.size === 0) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedReportIds);
    for (const id of ids) {
      await updateReportStatus(id, 'dismissed');
    }
    setReports(prev => prev.map(r => selectedReportIds.has(r.id) ? { ...r, status: 'dismissed' } : r));
    if (authUser?.id) {
      logAdminAction({ adminId: authUser.id, actionType: 'bulk_dismiss_reports', targetType: 'report', targetId: ids.join(','), details: `Bulk dismissed ${ids.length} reports` });
    }
    setSelectedReportIds(new Set());
    setBulkProcessing(false);
    setBulkMode(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedReportIds, authUser?.id]);

  const handleBulkReviewReports = useCallback(async () => {
    if (selectedReportIds.size === 0) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedReportIds);
    for (const id of ids) {
      await updateReportStatus(id, 'reviewed');
    }
    setReports(prev => prev.map(r => selectedReportIds.has(r.id) ? { ...r, status: 'reviewed' } : r));
    if (authUser?.id) {
      logAdminAction({ adminId: authUser.id, actionType: 'bulk_review_reports', targetType: 'report', targetId: ids.join(','), details: `Bulk reviewed ${ids.length} reports` });
    }
    setSelectedReportIds(new Set());
    setBulkProcessing(false);
    setBulkMode(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedReportIds, authUser?.id]);

  const handleBulkApproveQueue = useCallback(async () => {
    if (selectedQueueIds.size === 0) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedQueueIds);
    for (const id of ids) {
      await unflagSubmission(id);
    }
    setQueue(prev => prev.filter(q => !selectedQueueIds.has(q.id)));
    if (authUser?.id) {
      logAdminAction({ adminId: authUser.id, actionType: 'bulk_approve_queue', targetType: 'submission', targetId: ids.join(','), details: `Bulk approved ${ids.length} flagged submissions` });
    }
    setSelectedQueueIds(new Set());
    setBulkProcessing(false);
    setBulkMode(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedQueueIds, authUser?.id]);

  const handleBulkDeleteQueue = useCallback(async () => {
    if (selectedQueueIds.size === 0) return;
    showAlert('Bulk Delete', `Remove ${selectedQueueIds.size} flagged submissions?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All', style: 'destructive',
        onPress: async () => {
          setBulkProcessing(true);
          const ids = Array.from(selectedQueueIds);
          for (const id of ids) {
            await adminDeleteSubmission(id);
          }
          setQueue(prev => prev.filter(q => !selectedQueueIds.has(q.id)));
          if (authUser?.id) {
            logAdminAction({ adminId: authUser.id, actionType: 'bulk_delete_queue', targetType: 'submission', targetId: ids.join(','), details: `Bulk deleted ${ids.length} flagged submissions` });
          }
          setSelectedQueueIds(new Set());
          setBulkProcessing(false);
          setBulkMode(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [selectedQueueIds, adminDeleteSubmission, authUser?.id, showAlert]);

  // ──── Ban helpers ────
  const openBanModal = useCallback((user: AdminUserEntry) => {
    Haptics.selectionAsync();
    setBanTarget(user);
    setBanReason('');
    setShowBanModal(true);
  }, []);

  const handleBan = useCallback(async () => {
    if (!banTarget || !banReason.trim()) {
      showAlert('Required', 'Please provide a reason for the ban.');
      return;
    }
    setBanning(true);
    const { error } = await banUser(banTarget.id, banReason.trim());
    setBanning(false);
    if (error) { showAlert('Error', error); return; }

    if (authUser?.id) {
      logAdminAction({ adminId: authUser.id, actionType: 'ban_user', targetType: 'user', targetId: banTarget.id, details: `Banned @${banTarget.username}: ${banReason.trim()}` });
    }

    setUsers(prev => prev.map(u => u.id === banTarget.id ? { ...u, isBanned: true, banReason: banReason.trim(), bannedAt: new Date().toISOString() } : u));
    setShowBanModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('User Banned', `@${banTarget.username} has been banned.`);
  }, [banTarget, banReason, authUser?.id, showAlert]);

  const handleUnban = useCallback((user: AdminUserEntry) => {
    showAlert('Unban User', `Remove ban from @${user.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unban',
        onPress: async () => {
          const { error } = await unbanUser(user.id);
          if (error) { showAlert('Error', error); return; }
          if (authUser?.id) {
            logAdminAction({ adminId: authUser.id, actionType: 'unban_user', targetType: 'user', targetId: user.id, details: `Unbanned @${user.username}` });
          }
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: false, banReason: null, bannedAt: null } : u));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [authUser?.id, showAlert]);

  // ──── Queue helpers ────
  const handleQueueDelete = useCallback((item: FlaggedSubmission) => {
    showAlert('Delete Object', `Remove this submission by @${item.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await adminDeleteSubmission(item.id);
          if (error) { showAlert('Error', error); return; }
          if (authUser?.id) {
            logAdminAction({ adminId: authUser.id, actionType: 'delete_submission', targetType: 'submission', targetId: item.id, details: `Deleted flagged submission by @${item.username}` });
          }
          setQueue(prev => prev.filter(q => q.id !== item.id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [adminDeleteSubmission, authUser?.id, showAlert]);

  const handleQueueApprove = useCallback(async (item: FlaggedSubmission) => {
    Haptics.selectionAsync();
    const { error } = await unflagSubmission(item.id);
    if (error) { showAlert('Error', error); return; }
    if (authUser?.id) {
      logAdminAction({ adminId: authUser.id, actionType: 'approve_submission', targetType: 'submission', targetId: item.id, details: `Approved flagged submission by @${item.username}` });
    }
    setQueue(prev => prev.filter(q => q.id !== item.id));
  }, [authUser?.id, showAlert]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getReasonLabel = (key: string) => getReportReasonMeta(key).label;
  const getReasonColor = (key: string) => getReportReasonMeta(key).color;
  const getReasonIcon = (key: string): keyof typeof MaterialIcons.glyphMap => getReportReasonMeta(key).icon as keyof typeof MaterialIcons.glyphMap;
  const getContentTypeLabel = (key: string) => {
    const meta = getReportReasonMeta(key);
    if (meta.contentType === 'image') return 'IMAGE';
    if (meta.contentType === 'text') return 'TEXT';
    return 'GENERAL';
  };
  const getContentTypeColor = (key: string) => {
    const meta = getReportReasonMeta(key);
    if (meta.contentType === 'image') return '#EF4444';
    if (meta.contentType === 'text') return '#F97316';
    return '#6B7280';
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'reviewed': return '#10B981';
      case 'dismissed': return '#6B7280';
      default: return t.textMuted;
    }
  };

  const getActionIcon = (action: string): keyof typeof MaterialIcons.glyphMap => {
    if (action.includes('bulk')) return 'checklist';
    if (action.includes('ban')) return 'block';
    if (action.includes('unban')) return 'check-circle';
    if (action.includes('delete')) return 'delete';
    if (action.includes('feature')) return 'star';
    if (action.includes('approve')) return 'verified';
    if (action.includes('report')) return 'flag';
    return 'history';
  };

  const getActionColor = (action: string) => {
    if (action.includes('ban')) return '#EF4444';
    if (action.includes('unban')) return '#10B981';
    if (action.includes('delete')) return '#EF4444';
    if (action.includes('feature')) return '#F59E0B';
    if (action.includes('approve')) return '#10B981';
    if (action.includes('bulk')) return '#3B82F6';
    return t.textSecondary;
  };

  // ──── Tab Tabs ────
  const tabs: { key: AdminTab; label: string; icon: keyof typeof MaterialIcons.glyphMap; badge?: number }[] = [
    { key: 'reports', label: 'Reports', icon: 'flag', badge: statusCounts.pending },
    { key: 'queue', label: 'Queue', icon: 'security', badge: queue.length },
    { key: 'users', label: 'Users', icon: 'people' },
    { key: 'log', label: 'Log', icon: 'history' },
  ];

  // ──── Render Functions ────

  const renderReport = ({ item }: { item: Report }) => {
    const statusColor = getStatusColor(item.status);
    const isSelected = selectedReportIds.has(item.id);
    return (
      <Pressable
        onPress={bulkMode && item.status === 'pending' ? () => toggleReportSelection(item.id) : undefined}
        onLongPress={() => {
          if (!bulkMode && item.status === 'pending') {
            setBulkMode(true);
            setSelectedReportIds(new Set([item.id]));
          }
        }}
      >
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: isSelected ? t.primary : t.border }, isSelected && { borderWidth: 2 }]}>
          <View style={styles.cardHeader}>
            {bulkMode && item.status === 'pending' ? (
              <Pressable style={[styles.checkbox, { borderColor: isSelected ? t.primary : t.border }, isSelected && { backgroundColor: t.primary }]} onPress={() => toggleReportSelection(item.id)}>
                {isSelected ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.push(`/object/${item.objectId}`)} style={styles.cardImageWrap}>
              {item.objectImageUrl ? (
                <Image source={{ uri: item.objectImageUrl }} style={styles.cardImage} contentFit="cover" />
              ) : (
                <View style={[styles.cardImagePlaceholder, { backgroundColor: t.surfaceElevated }]}>
                  <MaterialIcons name="broken-image" size={20} color={t.textMuted} />
                </View>
              )}
            </Pressable>
            <View style={styles.cardInfo}>
              <View style={styles.cardReasonRow}>
                <View style={[styles.contentTypeBadge, { backgroundColor: `${getReasonColor(item.reason)}15`, borderColor: `${getReasonColor(item.reason)}30` }]}>
                  <MaterialIcons name={getReasonIcon(item.reason)} size={11} color={getReasonColor(item.reason)} />
                  <Text style={[styles.contentTypeText, { color: getReasonColor(item.reason) }]}>{getContentTypeLabel(item.reason)}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.cardReason, { color: t.textPrimary }]}>{getReasonLabel(item.reason)}</Text>
              </View>
              <View style={styles.reporterRow}>
                <Image source={{ uri: item.reporterAvatar }} style={styles.reporterAvatar} contentFit="cover" />
                <Text style={[styles.reporterName, { color: t.textSecondary }]}>@{item.reporterUsername}</Text>
                <Text style={[styles.timeText, { color: t.textMuted }]}>{timeAgo(item.createdAt)}</Text>
              </View>
              {item.description ? <Text style={[styles.descText, { color: t.textSecondary }]} numberOfLines={2}>{item.description}</Text> : null}
            </View>
          </View>
          {!bulkMode ? (
            <View style={[styles.cardActions, { borderTopColor: t.border }]}>
              {item.status === 'pending' ? (
                <>
                  <Pressable style={[styles.actionBtn, { backgroundColor: `${t.error}12` }]} onPress={() => handleDeleteReportedObject(item.id, item.objectId)}>
                    <MaterialIcons name="delete" size={16} color={t.error} />
                    <Text style={[styles.actionBtnText, { color: t.error }]}>Remove</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, { backgroundColor: '#10B98112' }]} onPress={() => handleUpdateStatus(item.id, 'reviewed')}>
                    <MaterialIcons name="check-circle" size={16} color="#10B981" />
                    <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Safe</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, { backgroundColor: t.surfaceElevated }]} onPress={() => handleUpdateStatus(item.id, 'dismissed')}>
                    <MaterialIcons name="close" size={16} color={t.textMuted} />
                    <Text style={[styles.actionBtnText, { color: t.textMuted }]}>Dismiss</Text>
                  </Pressable>
                </>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                  <MaterialIcons name={item.status === 'reviewed' ? 'check-circle' : 'remove-circle'} size={14} color={statusColor} />
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const renderQueueItem = ({ item }: { item: FlaggedSubmission }) => {
    const isSelected = selectedQueueIds.has(item.id);
    return (
      <Pressable
        onPress={bulkMode ? () => toggleQueueSelection(item.id) : undefined}
        onLongPress={() => {
          if (!bulkMode) {
            setBulkMode(true);
            setSelectedQueueIds(new Set([item.id]));
          }
        }}
      >
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: isSelected ? t.primary : t.border }, isSelected && { borderWidth: 2 }]}>
          <View style={styles.cardHeader}>
            {bulkMode ? (
              <Pressable style={[styles.checkbox, { borderColor: isSelected ? t.primary : t.border }, isSelected && { backgroundColor: t.primary }]} onPress={() => toggleQueueSelection(item.id)}>
                {isSelected ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.push(`/object/${item.id}`)} style={styles.cardImageWrap}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
            </Pressable>
            <View style={styles.cardInfo}>
              <View style={styles.cardReasonRow}>
                {item.flagReason ? (
                  <View style={[styles.flagReasonBadge, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}>
                    <MaterialIcons name="warning" size={11} color="#EF4444" />
                    <Text style={styles.flagReasonText}>{item.flagReason}</Text>
                  </View>
                ) : null}
                {item.isBanned ? (
                  <View style={[styles.bannedChip, { backgroundColor: '#EF444420' }]}>
                    <MaterialIcons name="block" size={12} color="#EF4444" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>BANNED USER</Text>
                  </View>
                ) : null}
                {item.reportCount > 0 ? (
                  <View style={[styles.bannedChip, { backgroundColor: '#F59E0B20' }]}>
                    <MaterialIcons name="flag" size={12} color="#F59E0B" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#F59E0B' }}>{item.reportCount} REPORTS</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.reporterRow}>
                <Image source={{ uri: item.userAvatar }} style={styles.reporterAvatar} contentFit="cover" />
                <Text style={[styles.reporterName, { color: t.textSecondary }]}>@{item.username}</Text>
                <Text style={[styles.timeText, { color: t.textMuted }]}>{timeAgo(item.createdAt)}</Text>
              </View>
              {item.description ? <Text style={[styles.descText, { color: t.textSecondary }]} numberOfLines={2}>{item.description}</Text> : null}
            </View>
          </View>
          {!bulkMode ? (
            <View style={[styles.cardActions, { borderTopColor: t.border }]}>
              <Pressable style={[styles.actionBtn, { backgroundColor: `${t.error}12` }]} onPress={() => handleQueueDelete(item)}>
                <MaterialIcons name="delete" size={16} color={t.error} />
                <Text style={[styles.actionBtnText, { color: t.error }]}>Remove</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#10B98112' }]} onPress={() => handleQueueApprove(item)}>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Approve</Text>
              </Pressable>
              {!item.isBanned ? (
                <Pressable style={[styles.actionBtn, { backgroundColor: '#EF444412' }]} onPress={() => openBanModal({ id: item.userId, username: item.username, email: '', avatar: item.userAvatar, isBanned: false, banReason: null, bannedAt: null, isAdmin: false, createdAt: '', submissionCount: 0 })}>
                  <MaterialIcons name="block" size={16} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Ban</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const renderUser = ({ item }: { item: AdminUserEntry }) => (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.userRow}>
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} contentFit="cover" />
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, { color: t.textPrimary }]} numberOfLines={1}>@{item.username}</Text>
            {item.isAdmin ? (
              <View style={[styles.adminChip, { backgroundColor: `${t.error}15` }]}>
                <MaterialIcons name="shield" size={10} color={t.error} />
                <Text style={{ fontSize: 9, fontWeight: '800', color: t.error }}>ADMIN</Text>
              </View>
            ) : null}
            {item.isBanned ? (
              <View style={[styles.adminChip, { backgroundColor: '#EF444415' }]}>
                <MaterialIcons name="block" size={10} color="#EF4444" />
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#EF4444' }}>BANNED</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.userEmail, { color: t.textMuted }]} numberOfLines={1}>{item.email}</Text>
          <Text style={[styles.userMeta, { color: t.textMuted }]}>{item.submissionCount} posts · Joined {timeAgo(item.createdAt)}</Text>
          {item.isBanned && item.banReason ? (
            <Text style={[styles.banReasonText, { color: '#EF4444' }]} numberOfLines={1}>Reason: {item.banReason}</Text>
          ) : null}
        </View>
        {!item.isAdmin ? (
          <View style={styles.userActions}>
            {item.isBanned ? (
              <Pressable style={[styles.smallBtn, { backgroundColor: '#10B98115' }]} onPress={() => handleUnban(item)}>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>Unban</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.smallBtn, { backgroundColor: '#EF444415' }]} onPress={() => openBanModal(item)}>
                <MaterialIcons name="block" size={16} color="#EF4444" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>Ban</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderLogEntry = ({ item }: { item: ActivityLogEntry }) => {
    const color = getActionColor(item.actionType);
    const icon = getActionIcon(item.actionType);
    return (
      <View style={[styles.logCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={[styles.logIcon, { backgroundColor: `${color}15` }]}>
          <MaterialIcons name={icon} size={16} color={color} />
        </View>
        <View style={styles.logInfo}>
          <View style={styles.logTopRow}>
            <Image source={{ uri: item.adminAvatar }} style={styles.logAvatar} contentFit="cover" />
            <Text style={[styles.logAdmin, { color: t.textPrimary }]}>@{item.adminUsername}</Text>
            <Text style={[styles.timeText, { color: t.textMuted }]}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={[styles.logDetails, { color: t.textSecondary }]} numberOfLines={2}>{item.details}</Text>
          <Text style={[styles.logAction, { color }]}>{item.actionType.replace(/_/g, ' ').toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  if (!currentUser.isAdmin) return null;

  const currentData = activeTab === 'reports' ? filteredReports : activeTab === 'queue' ? queue : activeTab === 'users' ? users : activityLog;
  const isLoading = activeTab === 'reports' ? reportsLoading : activeTab === 'queue' ? queueLoading : activeTab === 'users' ? usersLoading : logLoading;
  const hasBulkSelection = (activeTab === 'reports' && selectedReportIds.size > 0) || (activeTab === 'queue' && selectedQueueIds.size > 0);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => { if (bulkMode) { setBulkMode(false); setSelectedReportIds(new Set()); setSelectedQueueIds(new Set()); } else { router.back(); } }}>
          <MaterialIcons name={bulkMode ? 'close' : 'arrow-back'} size={22} color={t.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          {bulkMode ? (
            <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
              {activeTab === 'reports' ? selectedReportIds.size : selectedQueueIds.size} selected
            </Text>
          ) : (
            <>
              <View style={[styles.adminIcon, { backgroundColor: `${t.error}15` }]}>
                <MaterialIcons name="shield" size={18} color={t.error} />
              </View>
              <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Admin Panel</Text>
            </>
          )}
        </View>
        {(activeTab === 'reports' || activeTab === 'queue') && !bulkMode ? (
          <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => setBulkMode(true)}>
            <MaterialIcons name="checklist" size={20} color={t.textSecondary} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Tab Bar */}
      {!bulkMode ? (
        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && { borderBottomColor: t.primary, borderBottomWidth: 2 }]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.key); }}
            >
              <MaterialIcons name={tab.icon} size={18} color={activeTab === tab.key ? t.primary : t.textMuted} />
              <Text style={[styles.tabLabel, { color: activeTab === tab.key ? t.primary : t.textMuted }]}>{tab.label}</Text>
              {tab.badge && tab.badge > 0 ? (
                <View style={[styles.tabBadge, { backgroundColor: t.error }]}>
                  <Text style={styles.tabBadgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Bulk Action Bar */}
      {bulkMode ? (
        <View style={[styles.bulkBar, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Pressable style={[styles.bulkSelectAll, { backgroundColor: `${t.primary}12` }]} onPress={activeTab === 'reports' ? selectAllReports : selectAllQueue}>
            <MaterialIcons name="select-all" size={16} color={t.primary} />
            <Text style={[styles.bulkSelectAllText, { color: t.primary }]}>
              {activeTab === 'reports'
                ? (selectedReportIds.size === filteredReports.filter(r => r.status === 'pending').length ? 'Deselect All' : 'Select All Pending')
                : (selectedQueueIds.size === queue.length ? 'Deselect All' : 'Select All')
              }
            </Text>
          </Pressable>
          {hasBulkSelection ? (
            <View style={styles.bulkActions}>
              {activeTab === 'reports' ? (
                <>
                  <Pressable style={[styles.bulkActionBtn, { backgroundColor: '#10B98115' }]} onPress={handleBulkReviewReports} disabled={bulkProcessing}>
                    {bulkProcessing ? <ActivityIndicator size="small" color="#10B981" /> : <MaterialIcons name="check-circle" size={16} color="#10B981" />}
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>Safe</Text>
                  </Pressable>
                  <Pressable style={[styles.bulkActionBtn, { backgroundColor: `${t.textMuted}10` }]} onPress={handleBulkDismissReports} disabled={bulkProcessing}>
                    {bulkProcessing ? <ActivityIndicator size="small" color={t.textMuted} /> : <MaterialIcons name="close" size={16} color={t.textMuted} />}
                    <Text style={{ fontSize: 10, fontWeight: '700', color: t.textMuted }}>Dismiss</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable style={[styles.bulkActionBtn, { backgroundColor: '#10B98115' }]} onPress={handleBulkApproveQueue} disabled={bulkProcessing}>
                    {bulkProcessing ? <ActivityIndicator size="small" color="#10B981" /> : <MaterialIcons name="check-circle" size={16} color="#10B981" />}
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>Approve</Text>
                  </Pressable>
                  <Pressable style={[styles.bulkActionBtn, { backgroundColor: '#EF444415' }]} onPress={handleBulkDeleteQueue} disabled={bulkProcessing}>
                    {bulkProcessing ? <ActivityIndicator size="small" color="#EF4444" /> : <MaterialIcons name="delete" size={16} color="#EF4444" />}
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>Delete</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Reports Stats */}
      {activeTab === 'reports' && !bulkMode ? (
        <>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30' }]}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{statusCounts.pending}</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{statusCounts.reviewed}</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Reviewed</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: `${t.textMuted}10`, borderColor: `${t.textMuted}20` }]}>
              <Text style={[styles.statNumber, { color: t.textSecondary }]}>{statusCounts.dismissed}</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Dismissed</Text>
            </View>
          </View>
          <View style={styles.filterRow}>
            {(['all', 'pending', 'reviewed', 'dismissed'] as FilterStatus[]).map(f => (
              <Pressable
                key={f}
                style={[styles.filterChip, { backgroundColor: t.surface, borderColor: t.border }, filter === f && { backgroundColor: t.primary, borderColor: t.primary }]}
                onPress={() => { Haptics.selectionAsync(); setFilter(f); }}
              >
                <Text style={[styles.filterChipText, { color: t.textSecondary }, filter === f && { color: t.background }]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({statusCounts[f]})
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {/* Users Search */}
      {activeTab === 'users' ? (
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.border }]}>
            <MaterialIcons name="search" size={18} color={t.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: t.textPrimary }]}
              placeholder="Search users..."
              placeholderTextColor={t.textMuted}
              value={userSearch}
              onChangeText={(text) => { setUserSearch(text); loadUsers(text || undefined); }}
            />
            {userSearch ? <Pressable onPress={() => { setUserSearch(''); loadUsers(); }}><MaterialIcons name="close" size={16} color={t.textMuted} /></Pressable> : null}
          </View>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : (
        <FlatList
          data={currentData as any[]}
          renderItem={activeTab === 'reports' ? renderReport : activeTab === 'queue' ? renderQueueItem : activeTab === 'users' ? renderUser : renderLogEntry}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={reportsRefreshing} onRefresh={handleRefresh} tintColor={t.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name={activeTab === 'reports' ? 'verified-user' : activeTab === 'queue' ? 'security' : activeTab === 'users' ? 'people' : 'history'} size={48} color={t.textMuted} />
              <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
                {activeTab === 'reports' ? 'All clear' : activeTab === 'queue' ? 'Queue is empty' : activeTab === 'users' ? 'No users found' : 'No activity yet'}
              </Text>
              <Text style={[styles.emptyText, { color: t.textSecondary }]}>
                {activeTab === 'reports' ? 'No reports to review' : activeTab === 'queue' ? 'No flagged content' : activeTab === 'users' ? 'Try a different search' : 'Admin actions will appear here'}
              </Text>
            </View>
          }
        />
      )}

      {/* Ban Modal */}
      <Modal visible={showBanModal} transparent animationType="slide" onRequestClose={() => setShowBanModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowBanModal(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, backgroundColor: t.background }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: '#EF444415' }]}>
                <MaterialIcons name="block" size={22} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Ban User</Text>
                {banTarget ? <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>@{banTarget.username}</Text> : null}
              </View>
              <Pressable style={[styles.modalCloseBtn, { backgroundColor: t.surface }]} onPress={() => setShowBanModal(false)}>
                <MaterialIcons name="close" size={20} color={t.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={{ paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.banLabel, { color: t.textMuted }]}>Reason for ban *</Text>
              {['Inappropriate content', 'Spam or misleading', 'Harassment', 'Repeated violations', 'Other'].map(reason => (
                <Pressable
                  key={reason}
                  style={[styles.banReasonRow, { backgroundColor: t.surface, borderColor: banReason === reason ? '#EF4444' : t.border }]}
                  onPress={() => setBanReason(reason)}
                >
                  <Text style={[styles.banReasonLabel, { color: banReason === reason ? '#EF4444' : t.textPrimary }]}>{reason}</Text>
                  {banReason === reason ? <MaterialIcons name="check-circle" size={18} color="#EF4444" /> : <View style={[styles.banRadio, { borderColor: t.borderLight }]} />}
                </Pressable>
              ))}

              {banReason === 'Other' ? (
                <TextInput
                  style={[styles.banCustomInput, { backgroundColor: t.surface, color: t.textPrimary, borderColor: t.border }]}
                  placeholder="Specify reason..."
                  placeholderTextColor={t.textMuted}
                  value={banReason === 'Other' ? '' : banReason}
                  onChangeText={(text) => setBanReason(text || 'Other')}
                  multiline
                />
              ) : null}

              <Pressable
                style={[styles.banConfirmBtn, (!banReason.trim() || banning) && { opacity: 0.4 }]}
                onPress={handleBan}
                disabled={!banReason.trim() || banning}
              >
                {banning ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="block" size={18} color="#fff" />}
                <Text style={styles.banConfirmText}>Confirm Ban</Text>
              </Pressable>

              <Text style={[styles.banDisclaimer, { color: t.textMuted }]}>
                Banned users cannot post new objects or comments. This action can be reversed.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adminIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, paddingBottom: 8 },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  tabBadge: { minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, marginLeft: 2 },
  tabBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },

  // Bulk action bar
  bulkBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 10, borderWidth: 1, gap: 8 },
  bulkSelectAll: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  bulkSelectAllText: { fontSize: 11, fontWeight: '600' },
  bulkActions: { flexDirection: 'row', gap: 6 },
  bulkActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },

  // Checkbox
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  statNumber: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, borderWidth: 1 },
  filterChipText: { fontSize: 10, fontWeight: '600' },

  searchRow: { paddingHorizontal: 16, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, height: 40, gap: 8, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },

  card: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', padding: 12, gap: 10, alignItems: 'center' },
  cardImageWrap: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  cardInfo: { flex: 1 },
  cardReasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardReason: { fontSize: 13, fontWeight: '600' },
  reporterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  reporterAvatar: { width: 16, height: 16, borderRadius: 8 },
  reporterName: { fontSize: 11, fontWeight: '500' },
  timeText: { fontSize: 10 },
  descText: { fontSize: 11, lineHeight: 16 },

  cardActions: { flexDirection: 'row', gap: 6, padding: 10, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 8, paddingVertical: 8 },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },

  bannedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 },
  contentTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  contentTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  flagReasonBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  flagReasonText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },

  userRow: { flexDirection: 'row', padding: 12, gap: 10, alignItems: 'center' },
  userAvatar: { width: 44, height: 44, borderRadius: 22 },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  userName: { fontSize: 14, fontWeight: '600' },
  adminChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2 },
  userEmail: { fontSize: 11, marginBottom: 2 },
  userMeta: { fontSize: 10 },
  banReasonText: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  userActions: { gap: 6 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },

  logCard: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
  logIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logInfo: { flex: 1 },
  logTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  logAvatar: { width: 18, height: 18, borderRadius: 9 },
  logAdmin: { fontSize: 12, fontWeight: '600', flex: 1 },
  logDetails: { fontSize: 12, lineHeight: 17, marginBottom: 4 },
  logAction: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 13 },

  // Ban Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 12 },
  modalHeaderIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSubtitle: { fontSize: 13, marginTop: 2 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  banLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  banReasonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1 },
  banReasonLabel: { fontSize: 14, fontWeight: '500' },
  banRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  banCustomInput: { borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, minHeight: 60, textAlignVertical: 'top', marginBottom: 12 },
  banConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 14, marginTop: 12, marginBottom: 10 },
  banConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  banDisclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 15, marginBottom: 8 },
});
