import { getSupabaseClient } from '@/template';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const supabase = getSupabaseClient();

export async function registerPushToken(userId: string): Promise<{ token: string | null; error: string | null }> {
  try {
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
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
      });
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
