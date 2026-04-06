import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

export interface Comment {
  id: string;
  objectId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  replies: Comment[];
}

interface RawComment {
  id: string;
  object_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  user_profiles: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    is_premium: boolean;
  };
}

function mapComment(raw: RawComment): Omit<Comment, 'replies'> {
  return {
    id: raw.id,
    objectId: raw.object_id,
    userId: raw.user_id,
    parentId: raw.parent_id,
    content: raw.content,
    createdAt: raw.created_at,
    user: {
      id: raw.user_profiles?.id || raw.user_id,
      username: raw.user_profiles?.username || 'unknown',
      displayName: raw.user_profiles?.display_name || 'Unknown',
      avatar: raw.user_profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/png?seed=${raw.user_id}`,
    },
  };
}

function buildThreads(flatComments: Omit<Comment, 'replies'>[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  // Create all comment nodes with empty replies
  for (const c of flatComments) {
    map.set(c.id, { ...c, replies: [] });
  }

  // Build tree
  for (const c of flatComments) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function fetchComments(objectId: string): Promise<{ data: Comment[]; error: string | null }> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, object_id, user_id, parent_id, content, created_at, user_profiles(id, username, display_name, avatar_url, is_premium)')
    .eq('object_id', objectId)
    .order('created_at', { ascending: true });

  if (error) return { data: [], error: error.message };

  const flat = (data as unknown as RawComment[]).map(mapComment);
  return { data: buildThreads(flat), error: null };
}

export async function addComment(
  objectId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<{ error: string | null }> {
  const insert: Record<string, unknown> = {
    object_id: objectId,
    user_id: userId,
    content,
  };
  if (parentId) insert.parent_id = parentId;

  const { error } = await supabase.from('comments').insert(insert);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteComment(commentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) return { error: error.message };
  return { error: null };
}
