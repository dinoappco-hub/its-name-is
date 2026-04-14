import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useAuth } from '@/template';
import { AppNotification, NotificationType } from '../services/notificationTypes';
import { registerPushToken, removePushToken, sendPushNotification } from '../services/pushService';

// Safe lazy getter for expo-notifications that handles prototype errors
let _notifModule: any = undefined; // undefined = not tried, null = failed
function getNotificationsModule(): any {
  if (_notifModule === undefined) {
    try {
      const mod = require('expo-notifications');
      // Verify the module is actually usable by checking a known export
      if (mod && typeof mod.setNotificationHandler === 'function') {
        _notifModule = mod;
      } else {
        _notifModule = null;
      }
    } catch {
      _notifModule = null;
    }
  }
  return _notifModule;
}

export type NotificationPreferences = Record<NotificationType, boolean>;

const DEFAULT_PREFS: NotificationPreferences = {
  vote: true,
  name_suggestion: true,
  featured: true,
  milestone: true,
  comment: true,
};

// Set handler lazily — fully guarded
let _handlerSet = false;
function ensureNotificationHandler() {
  if (_handlerSet) return;
  _handlerSet = true;
  try {
    const Notifications = getNotificationsModule();
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {
    console.warn('Failed to set notification handler:', e);
  }
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  sendRemotePush: (params: { targetUserId: string; title: string; body: string; data?: Record<string, any> }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  preferences: NotificationPreferences;
  updatePreference: (type: NotificationType, enabled: boolean) => void;
  masterEnabled: boolean;
  setMasterEnabled: (enabled: boolean) => void;
  pushToken: string | null;
}

export const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

const STORAGE_KEY = 'itsnameis_notifications';
const PREFS_KEY = 'itsnameis_notif_prefs';
const MASTER_KEY = 'itsnameis_notif_master';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [masterEnabled, setMasterEnabledState] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const tokenRegistered = useRef(false);

  // Set up notification handler and response listener
  useEffect(() => {
    // Defer to next tick so any prototype error doesn't crash the commit phase
    const timer = setTimeout(() => {
      try {
        ensureNotificationHandler();
        const Notifications = getNotificationsModule();
        if (Notifications && typeof Notifications.addNotificationResponseReceivedListener === 'function') {
          const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
            const data = response?.notification?.request?.content?.data;
            if (data?.objectId) {
              // Navigation handled by app
            }
          });
          // Store for cleanup
          (timer as any).__sub = sub;
        }
      } catch (e) {
        console.warn('Notification setup failed:', e);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      try { (timer as any).__sub?.remove(); } catch {}
    };
  }, []);

  // Register push token when user logs in
  useEffect(() => {
    if (authUser?.id && !tokenRegistered.current) {
      tokenRegistered.current = true;
      registerPushToken(authUser.id).then(({ token }) => {
        if (token) setPushToken(token);
      }).catch(() => {});
    }
    if (!authUser?.id) {
      tokenRegistered.current = false;
      setPushToken(null);
    }
  }, [authUser?.id]);

  // Load persisted data
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try { setNotifications(JSON.parse(stored)); } catch {}
      }
    });
    AsyncStorage.getItem(PREFS_KEY).then(stored => {
      if (stored) {
        try { setPreferences({ ...DEFAULT_PREFS, ...JSON.parse(stored) }); } catch {}
      }
    });
    AsyncStorage.getItem(MASTER_KEY).then(stored => {
      if (stored === 'false') setMasterEnabledState(false);
    });
  }, []);

  // Persist data
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  useEffect(() => {
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    AsyncStorage.setItem(MASTER_KEY, String(masterEnabled));
  }, [masterEnabled]);

  const sendLocalNotification = async (title: string, body: string) => {
    try {
      const Notifications = getNotificationsModule();
      if (!Notifications || typeof Notifications.scheduleNotificationAsync !== 'function') return;
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: null,
      });
    } catch {}
  };

  const updatePreference = useCallback((type: NotificationType, enabled: boolean) => {
    setPreferences(prev => ({ ...prev, [type]: enabled }));
  }, []);

  const setMasterEnabled = useCallback((enabled: boolean) => {
    setMasterEnabledState(enabled);
  }, []);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    if (!masterEnabled || !preferences[notification.type]) return;

    const newNotif: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
    sendLocalNotification(notification.title, notification.body);
  }, [masterEnabled, preferences]);

  const sendRemotePush = useCallback((params: { targetUserId: string; title: string; body: string; data?: Record<string, any> }) => {
    if (params.targetUserId === authUser?.id) return;
    sendPushNotification(params).catch(() => {});
  }, [authUser?.id]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, addNotification, sendRemotePush,
      markAsRead, markAllAsRead, clearAll,
      preferences, updatePreference, masterEnabled, setMasterEnabled,
      pushToken,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
