import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform, BackHandler, Animated, Easing, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from './SafeIcons';
import { useRouter } from 'expo-router';
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { config } from '../constants/config';
import { useApp } from '../contexts/AppContext';
import { useNotifications } from '../hooks/useNotifications';
import { useAccessibility } from '../hooks/useAccessibility';
import { useAppTheme } from '../hooks/useTheme';

const DEFAULT_SCREEN_W = Math.max(Dimensions.get('window').width, 375);
const DEFAULT_DRAWER_W = Math.min(DEFAULT_SCREEN_W * 0.82, 340);

interface NavigationDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  route?: string;
  color?: string;
  badge?: string | number;
  onPress?: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function NavigationDrawer({ visible, onClose }: NavigationDrawerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: t } = useAppTheme();
  const { currentUser } = useApp();
  const { unreadCount } = useNotifications();
  const { activeCount: a11yActiveCount, triggerHaptic } = useAccessibility();

  const [drawerW] = useState(() => DEFAULT_DRAWER_W);

  // Use RN Animated directly for smooth native-driven animations
  const slideAnim = useRef(new Animated.Value(-drawerW)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Use timing on Android to avoid spring C++ issues; spring on iOS for feel
      const openAnim = Platform.OS === 'android'
        ? Animated.timing(slideAnim, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        : Animated.spring(slideAnim, {
            toValue: 0,
            damping: 22,
            stiffness: 200,
            mass: 0.8,
            useNativeDriver: true,
          });

      Animated.parallel([
        openAnim,
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -drawerW,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => handler.remove();
  }, [visible, onClose]);

  const handleNavigate = useCallback((route: string) => {
    Haptics?.selectionAsync();
    onClose();
    setTimeout(() => { router.push(route as any); }, 180);
  }, [onClose, router]);

  const sections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { icon: 'explore', label: 'Feed', route: '/(tabs)/home' },
        { icon: 'camera-alt', label: 'Snap Object', route: '/(tabs)/snap' },
        { icon: 'person', label: 'My Profile', route: '/(tabs)/profile' },
      ],
    },
    {
      title: 'Community',
      items: [
        { icon: 'emoji-events', label: 'Leaderboard', route: '/leaderboard' },
        { icon: 'notifications', label: 'Notifications', route: '/notifications', badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'edit', label: 'Edit Profile', route: '/edit-profile' },
        { icon: 'tune', label: 'Notification Settings', route: '/notification-settings' },
        { icon: 'accessibility-new', label: 'Accessibility', route: '/accessibility', badge: a11yActiveCount > 0 ? `${a11yActiveCount}` : undefined },
        { icon: 'settings', label: 'Settings', route: '/settings' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'auto-stories', label: 'Our Story', route: '/our-story', color: t.primary },
        { icon: 'gavel', label: 'Community Guidelines', route: '/community-guidelines' },
        { icon: 'description', label: 'Terms of Service', route: '/terms' },
        { icon: 'privacy-tip', label: 'Privacy Policy', route: '/privacy' },
      ],
    },
  ];

  if (!visible) return null;

  const displayName = currentUser.displayName || 'User';
  const displayUsername = currentUser.username ? `@${currentUser.username}` : '';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { width: drawerW, paddingTop: insets.top + 8, backgroundColor: t.background, borderRightColor: t.border, transform: [{ translateX: slideAnim }] }]}>
        <Pressable style={[styles.profileSection, { borderBottomColor: t.border }]} onPress={() => handleNavigate('/(tabs)/profile')}>
          <View style={[styles.avatarWrap, { borderColor: t.border }]}>
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} contentFit="cover" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: t.textPrimary }]} numberOfLines={1}>{displayName}</Text>
            {displayUsername ? <Text style={[styles.profileUsername, { color: t.textSecondary }]} numberOfLines={1}>{displayUsername}</Text> : null}
          </View>
          <MaterialIcons name="chevron-right" size={20} color={t.textMuted} />
        </Pressable>

        <View style={[styles.statsRow, { borderBottomColor: t.border }]}>
          <View style={styles.statItem}><Text style={[styles.statValue, { color: t.primary }]}>{currentUser.totalSubmissions}</Text><Text style={[styles.statLabel, { color: t.textMuted }]}>Objects</Text></View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.statItem}><Text style={[styles.statValue, { color: t.primary }]}>{currentUser.totalVotesReceived}</Text><Text style={[styles.statLabel, { color: t.textMuted }]}>Votes</Text></View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.statItem}><Text style={[styles.statValue, { color: t.primary }]}>{currentUser.totalSubmissions + (currentUser.totalVotesReceived || 0)}</Text><Text style={[styles.statLabel, { color: t.textMuted }]}>Activity</Text></View>
        </View>

        <ScrollView style={styles.navScroll} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.title} style={styles.navSection}>
              <Text style={[styles.navSectionTitle, { color: t.textMuted }]}>{section.title}</Text>
              {section.items.map((item) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [styles.navItem, pressed && { backgroundColor: t.surface }]}
                  onPress={() => { if (item.onPress) { triggerHaptic('selection'); item.onPress(); } else if (item.route) { handleNavigate(item.route); } }}
                >
                  <View style={[styles.navIcon, { backgroundColor: `${item.color || t.accent}12` }]}>
                    <MaterialIcons name={item.icon} size={19} color={item.color || t.accent} />
                  </View>
                  <Text style={[styles.navLabel, { color: t.textPrimary }]} numberOfLines={1}>{item.label}</Text>
                  {item.badge ? (
                    <View style={[styles.navBadge, typeof item.badge === 'string' && item.badge === 'PRO' && { backgroundColor: t.primary }]}>
                      <Text style={styles.navBadgeText}>{item.badge}</Text>
                    </View>
                  ) : (
                    <MaterialIcons name="chevron-right" size={18} color={t.textMuted} style={{ opacity: 0.5 }} />
                  )}
                </Pressable>
              ))}
            </View>
          ))}

          <View style={styles.drawerFooter}>
            <Text style={[styles.footerAppName, { color: t.primary }]}>{config.appName}</Text>
            <Text style={[styles.footerVersion, { color: t.textMuted }]}>v{config.version}</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    borderRightWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 16 },
      default: {},
    }),
  },
  profileSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12, borderBottomWidth: 1 },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600' },
  profileUsername: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '600' },
  statLabel: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 24 },
  navScroll: { flex: 1 },
  navSection: { paddingTop: 16, paddingHorizontal: 12 },
  navSectionTitle: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 8, borderRadius: 12, gap: 12 },
  navIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  navBadge: { backgroundColor: '#EF4444', borderRadius: 9999, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  navBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  drawerFooter: { alignItems: 'center', paddingTop: 24, paddingBottom: 8, gap: 2 },
  footerAppName: { fontSize: 13, fontWeight: '600' },
  footerVersion: { fontSize: 10, fontWeight: '500' },
});
