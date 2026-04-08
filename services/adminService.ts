import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

// ──────────────────────── Activity Log ────────────────────────

export interface ActivityLogEntry {
  id: string;
  adminId: string;
  adminUsername: string;
  adminAvatar: string;
  actionType: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export async function logAdminAction(params: {
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  details: string;
}): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: params.adminId,
        action_type: params.actionType,
        target_type: params.targetType,
        target_id: params.targetId,
        details: params.details,
      });

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to log action' };
  }
}

export async function fetchActivityLog(limit: number = 50): Promise<{ data: ActivityLogEntry[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select(`
        *,
        admin:user_profiles!admin_id(id, username, email, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { data: [], error: error.message };

    const entries: ActivityLogEntry[] = (data || []).map((r: any) => ({
      id: r.id,
      adminId: r.admin_id,
      adminUsername: r.admin?.username || r.admin?.email?.split('@')[0] || 'Admin',
      adminAvatar: r.admin?.avatar_url || 'https://api.dicebear.com/7.x/initials/png?seed=admin',
      actionType: r.action_type,
      targetType: r.target_type,
      targetId: r.target_id,
      details: r.details,
      createdAt: r.created_at,
    }));

    return { data: entries, error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch activity log' };
  }
}

// ──────────────────────── Fetch Admin User IDs ────────────────────────

export async function fetchAdminUserIds(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('is_admin', true);

    if (error || !data) return [];
    return data.map((u: any) => u.id);
  } catch {
    return [];
  }
}

// ──────────────────────── Ban / Unban Users ────────────────────────

export async function banUser(userId: string, reason: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_banned: true,
        ban_reason: reason,
        banned_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to ban user' };
  }
}

export async function unbanUser(userId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
      })
      .eq('id', userId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to unban user' };
  }
}

// ──────────────────────── Moderation Queue ────────────────────────

export interface FlaggedSubmission {
  id: string;
  imageUrl: string;
  description: string;
  category: string;
  userId: string;
  username: string;
  userAvatar: string;
  isBanned: boolean;
  reportCount: number;
  flagReason: string | null;
  createdAt: string;
}

export async function fetchFlaggedSubmissions(): Promise<{ data: FlaggedSubmission[]; error: string | null }> {
  try {
    // Get submissions that are flagged OR have 2+ reports
    const { data: flagged, error: flagErr } = await supabase
      .from('object_submissions')
      .select('*, user_profiles!user_id(id, username, email, avatar_url, is_banned)')
      .eq('is_flagged', true)
      .order('created_at', { ascending: false });

    // Get submissions with multiple reports
    const { data: reportedObjects, error: repErr } = await supabase
      .from('reports')
      .select('object_id')
      .eq('status', 'pending');

    // Count reports per object
    const reportCounts = new Map<string, number>();
    (reportedObjects || []).forEach((r: any) => {
      reportCounts.set(r.object_id, (reportCounts.get(r.object_id) || 0) + 1);
    });

    // Get objects with 2+ reports that are not already flagged
    const multiReportIds = Array.from(reportCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([id]) => id);

    let multiReportedObjects: any[] = [];
    if (multiReportIds.length > 0) {
      const { data: mrObjs } = await supabase
        .from('object_submissions')
        .select('*, user_profiles!user_id(id, username, email, avatar_url, is_banned)')
        .in('id', multiReportIds)
        .eq('is_flagged', false);
      multiReportedObjects = mrObjs || [];
    }

    // Also get submissions from banned users
    const { data: bannedUserSubs } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('is_banned', true);

    const bannedUserIds = (bannedUserSubs || []).map((u: any) => u.id);
    let bannedSubmissions: any[] = [];
    if (bannedUserIds.length > 0) {
      const { data: bSubs } = await supabase
        .from('object_submissions')
        .select('*, user_profiles!user_id(id, username, email, avatar_url, is_banned)')
        .in('user_id', bannedUserIds)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(20);
      bannedSubmissions = bSubs || [];
    }

    // Merge all unique results
    const allObjects = [...(flagged || []), ...multiReportedObjects, ...bannedSubmissions];
    const seen = new Set<string>();
    const unique = allObjects.filter(o => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });

    const result: FlaggedSubmission[] = unique.map((obj: any) => ({
      id: obj.id,
      imageUrl: obj.image_url,
      description: obj.description,
      category: obj.category,
      userId: obj.user_id,
      username: obj.user_profiles?.username || obj.user_profiles?.email?.split('@')[0] || 'unknown',
      userAvatar: obj.user_profiles?.avatar_url || 'https://api.dicebear.com/7.x/initials/png?seed=user',
      isBanned: obj.user_profiles?.is_banned || false,
      reportCount: reportCounts.get(obj.id) || 0,
      flagReason: obj.flag_reason || (reportCounts.get(obj.id) ? `${reportCounts.get(obj.id)} reports` : obj.user_profiles?.is_banned ? 'Banned user' : null),
      createdAt: obj.created_at,
    }));

    return { data: result, error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch moderation queue' };
  }
}

export async function flagSubmission(objectId: string, reason: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('object_submissions')
      .update({ is_flagged: true, flag_reason: reason })
      .eq('id', objectId);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to flag submission' };
  }
}

export async function unflagSubmission(objectId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('object_submissions')
      .update({ is_flagged: false, flag_reason: null })
      .eq('id', objectId);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to unflag submission' };
  }
}

// ──────────────────────── Fetch Users for Admin ────────────────────────

export interface AdminUserEntry {
  id: string;
  username: string;
  email: string;
  avatar: string;
  isBanned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  isAdmin: boolean;
  createdAt: string;
  submissionCount: number;
}

export async function fetchUsersForAdmin(search?: string): Promise<{ data: AdminUserEntry[]; error: string | null }> {
  try {
    let query = supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    // Get submission counts
    const userIds = (data || []).map((u: any) => u.id);
    const { data: submissions } = await supabase
      .from('object_submissions')
      .select('user_id')
      .in('user_id', userIds);

    const subCounts = new Map<string, number>();
    (submissions || []).forEach((s: any) => {
      subCounts.set(s.user_id, (subCounts.get(s.user_id) || 0) + 1);
    });

    const entries: AdminUserEntry[] = (data || []).map((u: any) => ({
      id: u.id,
      username: u.username || u.email.split('@')[0],
      email: u.email,
      avatar: u.avatar_url || `https://api.dicebear.com/7.x/initials/png?seed=${u.username || u.email}`,
      isBanned: u.is_banned || false,
      banReason: u.ban_reason || null,
      bannedAt: u.banned_at || null,
      isAdmin: u.is_admin || false,
      createdAt: u.created_at,
      submissionCount: subCounts.get(u.id) || 0,
    }));

    return { data: entries, error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch users' };
  }
}
