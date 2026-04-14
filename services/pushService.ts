import { getSupabaseClient } from '@/template';

export async function registerPushToken(_userId: string): Promise<{ token: string | null; error: string | null }> {
  return { token: null, error: null };
}

export async function removePushToken(_userId: string): Promise<void> {
  // no-op fallback
}

export async function sendPushNotification(params: {
  targetUserId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseClient();
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
