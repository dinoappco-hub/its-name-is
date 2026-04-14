import { getSupabaseClient } from '@/template';

const getClient = () => getSupabaseClient();

export async function registerPushToken(userId: string): Promise<{ token: string | null; error: string | null }> {
  // Push token registration disabled — expo-notifications native module
  // causes a fatal prototype crash on current build. Remote push via
  // edge function still works; local on-device delivery resumes once
  // the native module is properly linked in an EAS build.
  return { token: null, error: 'Push token registration not available in this build' };
}

export async function removePushToken(userId: string): Promise<void> {
  // No-op — see registerPushToken comment
}

export async function sendPushNotification(params: {
  targetUserId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<{ error: string | null }> {
  try {
    const supabase = getClient();
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
