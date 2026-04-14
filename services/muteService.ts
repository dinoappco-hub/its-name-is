import { getSupabaseClient } from '@/template';

const getClient = () => getSupabaseClient();

export async function fetchMutedUsers(userId: string): Promise<{ data: string[]; error: string | null }> {
  try {
    const { data, error } = await getClient()
      .from('muted_users')
      .select('muted_user_id')
      .eq('user_id', userId);

    if (error) return { data: [], error: error.message };
    return { data: (data || []).map((m: any) => m.muted_user_id), error: null };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}

export async function muteUser(userId: string, mutedUserId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await getClient()
      .from('muted_users')
      .insert({ user_id: userId, muted_user_id: mutedUserId });

    if (error) {
      if (error.code === '23505') return { error: null }; // Already muted
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function unmuteUser(userId: string, mutedUserId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await getClient()
      .from('muted_users')
      .delete()
      .eq('user_id', userId)
      .eq('muted_user_id', mutedUserId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}
