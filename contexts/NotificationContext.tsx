import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AppNotification, NotificationType } from '../services/notificationTypes';

export type NotificationPreferences = Record<NotificationType, boolean>;

const DEFAULT_PREFS: NotificationPreferences = {
  vote: true,
  name_suggestion: true,
  featured: true,
  milestone: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  preferences: NotificationPreferences;
  updatePreference: (type: NotificationType, enabled: boolean) => void;
  masterEnabled: boolean;
  setMasterEnabled: (enabled: boolean) => void;
}

export const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

const STORAGE_KEY = 'itsnameis_notifications';
const PREFS_KEY = 'itsnameis_notif_prefs';
const MASTER_KEY = 'itsnameis_notif_master';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [masterEnabled, setMasterEnabledState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch {
          // ignore parse errors
        }
      }
    });
    AsyncStorage.getItem(PREFS_KEY).then(stored => {
      if (stored) {
        try {
          setPreferences({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
        } catch {}
      }
    });
    AsyncStorage.getItem(MASTER_KEY).then(stored => {
      if (stored === 'false') setMasterEnabledState(false);
    });
    requestPermissions();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  useEffect(() => {
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    AsyncStorage.setItem(MASTER_KEY, String(masterEnabled));
  }, [masterEnabled]);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  };

  const sendLocalNotification = async (title: string, body: string) => {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: null,
      });
    } catch {
      // silently fail if notifications not available
    }
  };

  const updatePreference = useCallback((type: NotificationType, enabled: boolean) => {
    setPreferences(prev => ({ ...prev, [type]: enabled }));
  }, []);

  const setMasterEnabled = useCallback((enabled: boolean) => {
    setMasterEnabledState(enabled);
  }, []);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    // Check if this notification type is enabled
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
      notifications, unreadCount, addNotification,
      markAsRead, markAllAsRead, clearAll,
      preferences, updatePreference, masterEnabled, setMasterEnabled,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
