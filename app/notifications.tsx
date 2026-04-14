import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '../components/SafeIcons';
import { useRouter } from 'expo-router';
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { useAppTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { AppNotification } from '../services/notificationTypes';

const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  vote: 'thumb-up',
  name_suggestion: 'chat-bubble',
  featured: 'star',
  milestone: 'emoji-events',
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t, typo } = useAppTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { showAlert } = useAlert();

  const COLOR_MAP: Record<string, string> = useMemo(() => ({
    vote: t.upvote,
    name_suggestion: t.accent,
    featured: t.primary,
    milestone: t.warning,
  }), [t]);

  const handleClear = () => {
    showAlert('Clear Notifications', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearAll },
    ]);
  };

  const handleTapNotification = (notif: AppNotification) => {
    Haptics?.selectionAsync();
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
    const iconColor = COLOR_MAP[notif.type] || t.accent;

    return (
      <Animated.View key={notif.id} entering={FadeInDown.delay(index * 40).duration(300)}>
        <Pressable
          style={[styles.notifRow, { backgroundColor: t.surface, borderColor: t.border }, !notif.read && { backgroundColor: `${t.accent}08`, borderColor: `${t.accent}20` }]}
          onPress={() => handleTapNotification(notif)}
        >
          <View style={styles.notifLeft}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: notif.fromUser.avatar }} style={styles.avatar} contentFit="cover" />
              <View style={[styles.typeIcon, { backgroundColor: iconColor, borderColor: t.surface }]}>
                <MaterialIcons name={iconName} size={10} color="#fff" />
              </View>
            </View>
          </View>
          <View style={styles.notifContent}>
            <Text style={[styles.notifTitle, { color: t.textPrimary }]} numberOfLines={1}>{notif.title}</Text>
            <Text style={[styles.notifBody, { color: t.textSecondary }]} numberOfLines={2}>{notif.body}</Text>
            <Text style={[styles.notifTime, { color: t.textMuted }]}>{timeAgo(notif.createdAt)}</Text>
          </View>
          <View style={styles.notifRight}>
            <Image source={{ uri: notif.objectImageUri }} style={[styles.objectThumb, { borderRadius: 8 }]} contentFit="cover" />
            {!notif.read ? <View style={[styles.unreadDot, { backgroundColor: t.accent }]} /> : null}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderSection = (title: string, items: AppNotification[], startIndex: number) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: t.textMuted }]}>{title}</Text>
        {items.map((n, i) => renderNotification(n, startIndex + i))}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Notifications</Text>
        {notifications.length > 0 ? (
          <Pressable style={[styles.headerAction, { backgroundColor: t.surface }]} onPress={handleClear}>
            <MaterialIcons name="delete-outline" size={20} color={t.textSecondary} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {unreadCount > 0 ? (
        <Pressable style={[styles.markAllBar, { backgroundColor: `${t.accent}12`, borderColor: `${t.accent}25` }]} onPress={() => { Haptics?.selectionAsync(); markAllAsRead(); }}>
          <MaterialIcons name="done-all" size={16} color={t.accent} />
          <Text style={[styles.markAllText, { color: t.accent }]}>Mark all as read ({unreadCount})</Text>
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: t.surface }]}>
              <MaterialIcons name="notifications-none" size={56} color={t.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No notifications yet</Text>
            <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerAction: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  markAllBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  markAllText: { fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10, marginLeft: 4,
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12,
    padding: 12, marginBottom: 6,
    borderWidth: 1,
  },
  notifLeft: { marginRight: 10 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  typeIcon: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  notifContent: { flex: 1, marginRight: 10 },
  notifTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  notifBody: { fontSize: 12, lineHeight: 18, marginBottom: 3 },
  notifTime: { fontSize: 11 },
  notifRight: { alignItems: 'center', gap: 6 },
  objectThumb: { width: 44, height: 44 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
