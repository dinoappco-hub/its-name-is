import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAlert } from '@/template';
import { useAppTheme } from '../hooks/useTheme';
import { useApp } from '../contexts/AppContext';
import { Report, fetchAllReports, updateReportStatus, REPORT_REASONS } from '../services/reportService';

type FilterStatus = 'all' | 'pending' | 'reviewed' | 'dismissed';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t, typo } = useAppTheme();
  const { currentUser, adminDeleteSubmission } = useApp();
  const { showAlert } = useAlert();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    if (!currentUser.isAdmin) {
      router.back();
      return;
    }
    loadReports();
  }, [currentUser.isAdmin]);

  const loadReports = async () => {
    setLoading(true);
    const { data, error } = await fetchAllReports();
    if (error) {
      showAlert('Error', error);
    } else {
      setReports(data);
    }
    setLoading(false);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const { data } = await fetchAllReports();
    if (data) setReports(data);
    setRefreshing(false);
  }, []);

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
    if (error) {
      showAlert('Error', error);
      return;
    }
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  }, [showAlert]);

  const handleDeleteReportedObject = useCallback((reportId: string, objectId: string) => {
    showAlert('Delete Object', 'Remove this reported object and all associated data? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await adminDeleteSubmission(objectId);
          if (error) {
            showAlert('Error', error);
            return;
          }
          await handleUpdateStatus(reportId, 'reviewed');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [adminDeleteSubmission, handleUpdateStatus, showAlert]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getReasonLabel = (key: string) => {
    return REPORT_REASONS.find(r => r.key === key)?.label || key;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'reviewed': return '#10B981';
      case 'dismissed': return '#6B7280';
      default: return t.textMuted;
    }
  };

  const renderReport = ({ item }: { item: Report }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <View style={[styles.reportCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.reportHeader}>
          <Pressable onPress={() => router.push(`/object/${item.objectId}`)} style={styles.reportImageWrap}>
            {item.objectImageUrl ? (
              <Image source={{ uri: item.objectImageUrl }} style={styles.reportImage} contentFit="cover" />
            ) : (
              <View style={[styles.reportImagePlaceholder, { backgroundColor: t.surfaceElevated }]}>
                <MaterialIcons name="broken-image" size={20} color={t.textMuted} />
              </View>
            )}
          </Pressable>
          <View style={styles.reportInfo}>
            <View style={styles.reportReasonRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.reportReason, { color: t.textPrimary }]}>{getReasonLabel(item.reason)}</Text>
            </View>
            <View style={styles.reporterRow}>
              <Image source={{ uri: item.reporterAvatar }} style={styles.reporterAvatar} contentFit="cover" />
              <Text style={[styles.reporterName, { color: t.textSecondary }]}>@{item.reporterUsername}</Text>
              <Text style={[styles.reportTime, { color: t.textMuted }]}>{timeAgo(item.createdAt)}</Text>
            </View>
            {item.description ? (
              <Text style={[styles.reportDesc, { color: t.textSecondary }]} numberOfLines={2}>{item.description}</Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.reportActions, { borderTopColor: t.border }]}>
          {item.status === 'pending' ? (
            <>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: `${t.error}12` }]}
                onPress={() => handleDeleteReportedObject(item.id, item.objectId)}
              >
                <MaterialIcons name="delete" size={16} color={t.error} />
                <Text style={[styles.actionBtnText, { color: t.error }]}>Remove Post</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: '#10B98112' }]}
                onPress={() => handleUpdateStatus(item.id, 'reviewed')}
              >
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Mark Safe</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: t.surfaceElevated }]}
                onPress={() => handleUpdateStatus(item.id, 'dismissed')}
              >
                <MaterialIcons name="close" size={16} color={t.textMuted} />
                <Text style={[styles.actionBtnText, { color: t.textMuted }]}>Dismiss</Text>
              </Pressable>
            </>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <MaterialIcons
                name={item.status === 'reviewed' ? 'check-circle' : 'remove-circle'}
                size={14}
                color={statusColor}
              />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!currentUser.isAdmin) return null;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.adminIcon, { backgroundColor: `${t.error}15` }]}>
            <MaterialIcons name="shield" size={18} color={t.error} />
          </View>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Admin Panel</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
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

      {/* Filter */}
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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReport}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="verified-user" size={48} color={t.textMuted} />
              <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>All clear</Text>
              <Text style={[styles.emptyText, { color: t.textSecondary }]}>No {filter === 'all' ? '' : filter} reports to review</Text>
            </View>
          }
        />
      )}
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
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontWeight: '600' },
  reportCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  reportHeader: { flexDirection: 'row', padding: 14, gap: 12 },
  reportImageWrap: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  reportImage: { width: '100%', height: '100%' },
  reportImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  reportInfo: { flex: 1 },
  reportReasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  reportReason: { fontSize: 14, fontWeight: '600' },
  reporterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  reporterAvatar: { width: 18, height: 18, borderRadius: 9 },
  reporterName: { fontSize: 12, fontWeight: '500' },
  reportTime: { fontSize: 11 },
  reportDesc: { fontSize: 12, lineHeight: 17 },
  reportActions: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 8, paddingVertical: 9 },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyText: { fontSize: 13 },
});
