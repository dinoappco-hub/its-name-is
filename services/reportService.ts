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
