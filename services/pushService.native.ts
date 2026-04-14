import { getSupabaseClient } from '@/template';
import { Platform } from 'react-native';

const supabase = getSupabaseClient();

// Safe lazy getters that won't crash if native modules are unavailable
function getDevice(): any {
  try {
    return require('expo-device');
  } catch {
    return null;
  }
}

function getNotifications(): any {
  try {
    const mod = require('expo-notifications');
    if (mod && typeof mod.getPermissionsAsync === 'function') {
      return mod;
    }
    return null;
  } catch {
    return null;
  }
}

function getConstants(): any {
  try {
    const mod = require('expo-constants');
    return mod?.default || mod;
  } catch {
    return null;
  }
}

export async function registerPushToken(userId: string): Promise<{ token: string | null; error: string | null }> {
  try {
    const Device = getDevice();
    const Notifications = getNotifications();
    const Constants = getConstants();

    if (!Device || !Notifications || !Constants) {
      return { token: null, error: 'Push notification modules not available' };
    }

    if (!Device.isDevice) return { token: null, error: 'Push notifications require a physical device' };

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { token: null, error: 'Push notification permission not granted' };
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance?.MAX ?? 4,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
        });
      } catch {}
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform: Platform.OS },
        { onConflict: 'user_id,token' }
      );

    if (error) {
      console.error('Failed to save push token:', error);
      return { token, error: error.message };
    }

    return { token, error: null };
  } catch (err: any) {
    console.error('Push token registration error:', err);
    return { token: null, error: err.message || 'Failed to register push token' };
  }
}

export async function removePushToken(userId: string): Promise<void> {
  try {
    const Notifications = getNotifications();
    const Constants = getConstants();
    if (!Notifications || !Constants) return;
    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', tokenData.data);
  } catch {
    // silently fail
  }
}

export async function sendPushNotification(params: {
  targetUserId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<{ error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        targetUserId: params.targetUserId,
        title: params.title,
        body: params.body,
        data: params.data || {},
      },
    });

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to send push notification' };
  }
}
