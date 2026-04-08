import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

export const REPORT_REASONS = [
  { key: 'inappropriate', label: 'Inappropriate Content', icon: 'block' as const },
  { key: 'offensive_name', label: 'Offensive Name', icon: 'report' as const },
  { key: 'spam', label: 'Spam or Misleading', icon: 'content-copy' as const },
  { key: 'harassment', label: 'Harassment or Bullying', icon: 'person-off' as const },
  { key: 'copyright', label: 'Copyright Violation', icon: 'copyright' as const },
  { key: 'other', label: 'Other', icon: 'more-horiz' as const },
] as const;

export async function submitReport(params: {
  reporterId: string;
  objectId: string;
  nameId?: string;
  reason: string;
  description: string;
}): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: params.reporterId,
        object_id: params.objectId,
        name_id: params.nameId || null,
        reason: params.reason,
        description: params.description,
      });

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to submit report' };
  }
}

export async function hasUserReported(reporterId: string, objectId: string): Promise<boolean> {
  try {
    const { count } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', reporterId)
      .eq('object_id', objectId);

    return (count || 0) > 0;
  } catch {
    return false;
  }
}

// ──────────────────────── Admin Functions ────────────────────────

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  reporterAvatar: string;
  objectId: string;
  objectImageUrl: string;
  nameId: string | null;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

export async function fetchAllReports(): Promise<{ data: Report[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:user_profiles!reporter_id(id, username, email, avatar_url),
        object:object_submissions!object_id(id, image_url)
      `)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    const reports: Report[] = (data || []).map((r: any) => ({
      id: r.id,
      reporterId: r.reporter?.id || r.reporter_id,
      reporterUsername: r.reporter?.username || r.reporter?.email?.split('@')[0] || 'Unknown',
      reporterAvatar: r.reporter?.avatar_url || `https://api.dicebear.com/7.x/initials/png?seed=user`,
      objectId: r.object_id,
      objectImageUrl: r.object?.image_url || '',
      nameId: r.name_id,
      reason: r.reason,
      description: r.description || '',
      status: r.status,
      createdAt: r.created_at,
    }));

    return { data: reports, error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch reports' };
  }
}

export async function updateReportStatus(reportId: string, status: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to update report' };
  }
}
