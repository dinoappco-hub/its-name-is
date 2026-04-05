import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../constants/theme';
import { useNotifications } from '../hooks/useNotifications';
import { AppNotification } from '../services/notificationTypes';

const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  vote: 'thumb-up',
  name_suggestion: 'chat-bubble',
  featured: 'star',
  milestone: 'emoji-events',
};

const COLOR_MAP: Record<string, string> = {
  vote: theme.upvote,
  name_suggestion: theme.accent,
  featured: theme.primary,
  milestone: theme.warning,
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { showAlert } = useAlert();

  const handleClear = () => {
    showAlert('Clear Notifications', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearAll },
    ]);
  };

  const handleTapNotification = (notif: AppNotification) => {
    Haptics.selectionAsync();
    markAsRead(notif.id);
    router.push(`/object/${notif.objectId}`);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const grouped = useMemo(() => {
    const today: AppNotification[] = [];
    const earlier: AppNotification[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    notifications.forEach(n => {
      if (now - new Date(n.createdAt).getTime() < dayMs) {
        today.push(n);
      } else {
        earlier.push(n);
      }
    });
    return { today, earlier };
  }, [notifications]);

  const renderNotification = (notif: AppNotification, index: number) => {
    const iconName = ICON_MAP[notif.type] || 'notifications';
    const iconColor = COLOR_MAP[notif.type] || theme.accent;

    return (
      <Animated.View key={notif.id} entering={FadeInDown.delay(index * 40).duration(300)}>
        <Pressable
          style={[styles.notifRow, !notif.read && styles.notifRowUnread]}
          onPress={() => handleTapNotification(notif)}
        >
          <View style={styles.notifLeft}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: notif.fromUser.avatar }} style={styles.avatar} contentFit="cover" />
              <View style={[styles.typeIcon, { backgroundColor: iconColor }]}>
                <MaterialIcons name={iconName} size={10} color="#fff" />
              </View>
            </View>
          </View>
          <View style={styles.notifContent}>
            <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
            <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
            <Text style={styles.notifTime}>{timeAgo(notif.createdAt)}</Text>
          </View>
          <View style={styles.notifRight}>
            <Image source={{ uri: notif.objectImageUri }} style={styles.objectThumb} contentFit="cover" />
            {!notif.read ? <View style={styles.unreadDot} /> : null}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderSection = (title: string, items: AppNotification[], startIndex: number) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{title}</Text>
        {items.map((n, i) => renderNotification(n, startIndex + i))}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 ? (
          <Pressable style={styles.headerAction} onPress={handleClear}>
            <MaterialIcons name="delete-outline" size={20} color={theme.textSecondary} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {unreadCount > 0 ? (
        <Pressable style={styles.markAllBar} onPress={() => { Haptics.selectionAsync(); markAllAsRead(); }}>
          <MaterialIcons name="done-all" size={16} color={theme.accent} />
          <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="notifications-none" size={56} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              When someone votes on your objects or suggests a name, it will show up here.
            </Text>
          </View>
        ) : (
          <>
            {renderSection('Today', grouped.today, 0)}
            {renderSection('Earlier', grouped.earlier, grouped.today.length)}
          </>
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
  headerAction: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  markAllBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginHorizontal: 16, marginBottom: 8,
    backgroundColor: 'rgba(124,92,252,0.1)',
    borderRadius: theme.radiusMedium,
    paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(124,92,252,0.2)',
  },
  markAllText: { ...typography.small, color: theme.accent, fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionLabel: {
    ...typography.captionBold, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10, marginLeft: 4,
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface, borderRadius: theme.radiusMedium,
    padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: theme.border,
  },
  notifRowUnread: {
    backgroundColor: 'rgba(124,92,252,0.06)',
    borderColor: 'rgba(124,92,252,0.15)',
  },
  notifLeft: { marginRight: 10 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  typeIcon: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.surface,
  },
  notifContent: { flex: 1, marginRight: 10 },
  notifTitle: { ...typography.bodyBold, fontSize: 14, marginBottom: 2 },
  notifBody: { ...typography.caption, lineHeight: 18, marginBottom: 3 },
  notifTime: { ...typography.small },
  notifRight: { alignItems: 'center', gap: 6 },
  objectThumb: { width: 44, height: 44, borderRadius: theme.radiusSmall },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.accent,
  },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: theme.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { ...typography.bodyBold, marginBottom: 8 },
  emptySubtitle: { ...typography.caption, textAlign: 'center', lineHeight: 20 },
});
