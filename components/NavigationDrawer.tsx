import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform, BackHandler } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  FadeIn,
  FadeInLeft,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, typography } from '../constants/theme';
import { config } from '../constants/config';
import { useApp } from '../contexts/AppContext';
import { useNotifications } from '../hooks/useNotifications';

const SCREEN_W = Dimensions.get('window').width;
const DRAWER_W = Math.min(SCREEN_W * 0.82, 340);

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
  const { currentUser, isPremium, subscriptionEnd } = useApp();
  const { unreadCount } = useNotifications();

  const translateX = useSharedValue(-DRAWER_W);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.8 });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateX.value = withTiming(-DRAWER_W, { duration: 220, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => handler.remove();
  }, [visible, onClose]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleNavigate = useCallback((route: string) => {
    Haptics.selectionAsync();
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 180);
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
        {
          icon: 'notifications',
          label: 'Notifications',
          route: '/notifications',
          badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'edit', label: 'Edit Profile', route: '/edit-profile' },
        {
          icon: 'workspace-premium',
          label: isPremium ? 'Premium Active' : 'Go Premium',
          route: '/premium',
          color: theme.primary,
          badge: isPremium ? 'PRO' : undefined,
        },
        { icon: 'tune', label: 'Notification Settings', route: '/notification-settings' },
        { icon: 'accessibility-new', label: 'Accessibility', route: '/accessibility' },
        { icon: 'settings', label: 'Settings', route: '/settings' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'auto-stories', label: 'Our Story', route: '/our-story', color: theme.primary },
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
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, drawerStyle, { width: DRAWER_W, paddingTop: insets.top + 8 }]}>
        {/* Profile Header */}
        <Pressable
          style={styles.profileSection}
          onPress={() => handleNavigate('/(tabs)/profile')}
        >
          <View style={[styles.avatarWrap, isPremium && styles.avatarWrapPremium]}>
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} contentFit="cover" />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
              {isPremium ? (
                <MaterialIcons name="verified" size={16} color={theme.primary} />
              ) : null}
            </View>
            {displayUsername ? (
              <Text style={styles.profileUsername} numberOfLines={1}>{displayUsername}</Text>
            ) : null}
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
        </Pressable>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentUser.totalSubmissions}</Text>
            <Text style={styles.statLabel}>Objects</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentUser.totalVotesReceived}</Text>
            <Text style={styles.statLabel}>Votes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{isPremium ? 'PRO' : 'Free'}</Text>
            <Text style={styles.statLabel}>Plan</Text>
          </View>
        </View>

        {/* Navigation Sections */}
        <Animated.ScrollView
          style={styles.navScroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => (
            <View key={section.title} style={styles.navSection}>
              <Text style={styles.navSectionTitle}>{section.title}</Text>
              {section.items.map((item) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                  onPress={() => {
                    if (item.onPress) {
                      Haptics.selectionAsync();
                      item.onPress();
                    } else if (item.route) {
                      handleNavigate(item.route);
                    }
                  }}
                >
                  <View style={[styles.navIcon, { backgroundColor: `${item.color || theme.accent}12` }]}>
                    <MaterialIcons name={item.icon} size={19} color={item.color || theme.accent} />
                  </View>
                  <Text style={styles.navLabel} numberOfLines={1}>{item.label}</Text>
                  {item.badge ? (
                    <View style={[styles.navBadge, typeof item.badge === 'string' && item.badge === 'PRO' && styles.navBadgePro]}>
                      <Text style={[styles.navBadgeText, typeof item.badge === 'string' && item.badge === 'PRO' && styles.navBadgeTextPro]}>
                        {item.badge}
                      </Text>
                    </View>
                  ) : (
                    <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} style={{ opacity: 0.5 }} />
                  )}
                </Pressable>
              ))}
            </View>
          ))}

          {/* Footer */}
          <View style={styles.drawerFooter}>
            <Text style={styles.footerAppName}>{config.appName}</Text>
            <Text style={styles.footerVersion}>v{config.version}</Text>
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: theme.background,
    borderRightWidth: 1,
    borderRightColor: theme.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 16 },
      default: {},
    }),
  },

  // Profile
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  avatarWrapPremium: {
    borderColor: theme.primary,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  profileUsername: {
    ...typography.small,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.bodyBold,
    fontSize: 15,
    color: theme.primary,
  },
  statLabel: {
    ...typography.small,
    color: theme.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.border,
  },

  // Nav
  navScroll: {
    flex: 1,
  },
  navSection: {
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  navSectionTitle: {
    ...typography.captionBold,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
    marginBottom: 6,
    marginLeft: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: theme.radiusMedium,
    gap: 12,
  },
  navItemPressed: {
    backgroundColor: theme.surface,
  },
  navIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  navBadge: {
    backgroundColor: theme.error,
    borderRadius: theme.radiusFull,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  navBadgePro: {
    backgroundColor: theme.primary,
  },
  navBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  navBadgeTextPro: {
    color: theme.background,
  },

  // Footer
  drawerFooter: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
    gap: 2,
  },
  footerAppName: {
    ...typography.captionBold,
    color: theme.primary,
    fontSize: 13,
  },
  footerVersion: {
    ...typography.small,
    color: theme.textMuted,
    fontSize: 10,
  },
});
