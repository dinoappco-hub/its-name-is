import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
import { useAuth, useAlert } from '@/template';
import { useAppTheme } from '../hooks/useTheme';
import { useMute } from '../hooks/useMute';

export default function MutedUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t } = useAppTheme();
  const { mutedUserIds, unmuteUser } = useMute();
  const { showAlert } = useAlert();

  const handleUnmute = useCallback((userId: string) => {
    Haptics.selectionAsync();
    showAlert('Unmute User', 'Show posts from this user again?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unmute', onPress: () => unmuteUser(userId) },
    ]);
  }, [unmuteUser, showAlert]);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: t.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Muted Users</Text>
        <View style={{ width: 40 }} />
      </View>

      {mutedUserIds.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="volume-up" size={48} color={t.textMuted} />
          <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No muted users</Text>
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>
            When you mute someone, their posts and comments will be hidden from your feed.
          </Text>
        </View>
      ) : (
        <FlatList
          data={mutedUserIds}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.userRow, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={[styles.userIcon, { backgroundColor: '#EF444415' }]}>
                <MaterialIcons name="volume-off" size={20} color="#EF4444" />
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userId, { color: t.textSecondary }]} numberOfLines={1}>User ID: {item.slice(0, 8)}...</Text>
              </View>
              <Pressable style={[styles.unmuteBtn, { backgroundColor: '#10B98115' }]} onPress={() => handleUnmute(item)}>
                <MaterialIcons name="volume-up" size={16} color="#10B981" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>Unmute</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, gap: 10 },
  userIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1 },
  userId: { fontSize: 13, fontWeight: '500' },
  unmuteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
});
