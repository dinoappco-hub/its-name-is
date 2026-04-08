import { getSupabaseClient } from '@/template';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import {
  UserProfile,
  DbObjectSubmission,
  DbSuggestedName,
  DbVote,
  ObjectSubmission,
  SuggestedName,
  toUser,
} from './types';

const supabase = getSupabaseClient();

// ──────────────────────────── Image Upload ────────────────────────────

export async function uploadObjectImage(userId: string, uri: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from('object-images')
        .upload(fileName, blob, { contentType, upsert: false });
      if (error) return { url: null, error: error.message };
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const { error } = await supabase.storage
        .from('object-images')
        .upload(fileName, decode(base64), { contentType, upsert: false });
      if (error) return { url: null, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('object-images')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err.message || 'Upload failed' };
  }
}

// ──────────────────────────── Fetch Objects ────────────────────────────

export async function fetchObjects(): Promise<{ data: ObjectSubmission[]; error: string | null }> {
  try {
    // Fetch all objects with their submitter profiles
    const { data: objects, error: objErr } = await supabase
      .from('object_submissions')
      .select('*, user_profiles!user_id(*)')
      .order('created_at', { ascending: false });

    if (objErr) return { data: [], error: objErr.message };
    if (!objects || objects.length === 0) return { data: [], error: null };

    const objectIds = objects.map((o: any) => o.id);

    // Fetch all names for these objects
    const { data: names, error: nameErr } = await supabase
      .from('suggested_names')
      .select('*, user_profiles!user_id(*)')
      .in('object_id', objectIds);

    if (nameErr) return { data: [], error: nameErr.message };

    const nameIds = (names || []).map((n: any) => n.id);

    // Fetch all votes for these names
    let votes: any[] = [];
    if (nameIds.length > 0) {
      const { data: voteData, error: voteErr } = await supabase
        .from('votes')
        .select('*')
        .in('name_id', nameIds);

      if (voteErr) return { data: [], error: voteErr.message };
      votes = voteData || [];
    }

    // Get current user for vote state
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const currentUserId = authUser?.id || '';

    // Build UI objects
    const result: ObjectSubmission[] = objects.map((obj: any) => {
      const profile: UserProfile = obj.user_profiles;
      const objNames = (names || []).filter((n: any) => n.object_id === obj.id);

      const suggestedNames: SuggestedName[] = objNames.map((n: any) => {
        const nameVotes = votes.filter((v: any) => v.name_id === n.id);
        const upCount = nameVotes.filter((v: any) => v.direction === 'up').length;
        const downCount = nameVotes.filter((v: any) => v.direction === 'down').length;
        const userVoteRecord = nameVotes.find((v: any) => v.user_id === currentUserId);

        return {
          id: n.id,
          name: n.name,
          submittedBy: toUser(n.user_profiles),
          votes: upCount - downCount,
          userVote: userVoteRecord ? (userVoteRecord.direction as 'up' | 'down') : null,
          submittedAt: n.created_at,
        };
      });

      const totalVotes = suggestedNames.reduce((sum, n) => sum + Math.max(0, n.votes), 0);

      return {
        id: obj.id,
        imageUri: obj.image_url,
        description: obj.description,
        category: obj.category || 'random',
        suggestedNames,
        submittedBy: toUser(profile),
        submittedAt: obj.created_at,
        isFeatured: obj.is_featured,
        totalVotes,
        viewCount: obj.view_count,
      };
    });

    return { data: result, error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch objects' };
  }
}

// ──────────────────────────── Create Submission ────────────────────────────

export async function createSubmission(
  userId: string,
  imageUrl: string,
  name: string,
  description: string,
  category: string = 'random',
): Promise<{ data: { objectId: string; nameId: string } | null; error: string | null }> {
  try {
    // Insert object
    const { data: obj, error: objErr } = await supabase
      .from('object_submissions')
      .insert({ user_id: userId, image_url: imageUrl, description, category })
      .select('id')
      .single();

    if (objErr) return { data: null, error: objErr.message };

    // Insert initial name suggestion
    const { data: nameData, error: nameErr } = await supabase
      .from('suggested_names')
      .insert({ object_id: obj.id, user_id: userId, name })
      .select('id')
      .single();

    if (nameErr) return { data: null, error: nameErr.message };

    // Auto-upvote own name
    await supabase
      .from('votes')
      .insert({ name_id: nameData.id, user_id: userId, direction: 'up' });

    return { data: { objectId: obj.id, nameId: nameData.id }, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Submission failed' };
  }
}

// ──────────────────────────── Suggest Name ────────────────────────────

export async function suggestName(
  objectId: string,
  userId: string,
  name: string,
): Promise<{ data: { nameId: string } | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('suggested_names')
      .insert({ object_id: objectId, user_id: userId, name })
      .select('id')
      .single();

    if (error) return { data: null, error: error.message };

    // Auto-upvote own suggestion
    await supabase
      .from('votes')
      .insert({ name_id: data.id, user_id: userId, direction: 'up' });

    return { data: { nameId: data.id }, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to suggest name' };
  }
}

// ──────────────────────────── Vote ────────────────────────────

export async function castVote(
  nameId: string,
  userId: string,
  direction: 'up' | 'down',
): Promise<{ action: 'added' | 'changed' | 'removed'; error: string | null }> {
  try {
    // Check existing vote
    const { data: existing } = await supabase
      .from('votes')
      .select('id, direction')
      .eq('name_id', nameId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      if (existing.direction === direction) {
        // Same direction = toggle off (remove vote)
        const { error } = await supabase.from('votes').delete().eq('id', existing.id);
        return { action: 'removed', error: error?.message || null };
      } else {
        // Different direction = update
        const { error } = await supabase.from('votes').update({ direction }).eq('id', existing.id);
        return { action: 'changed', error: error?.message || null };
      }
    } else {
      // No existing vote = insert
      const { error } = await supabase
        .from('votes')
        .insert({ name_id: nameId, user_id: userId, direction });
      return { action: 'added', error: error?.message || null };
    }
  } catch (err: any) {
    return { action: 'added', error: err.message || 'Vote failed' };
  }
}

// ──────────────────────────── View Count ────────────────────────────

export async function incrementViewCount(objectId: string): Promise<void> {
  await supabase.rpc('increment_view_count', { obj_id: objectId });
}

// ──────────────────────────── User Stats ────────────────────────────

export async function getUserStats(userId: string): Promise<{ submissions: number; votesReceived: number }> {
  try {
    const { count: submissions } = await supabase
      .from('object_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Count upvotes received on user's name suggestions
    const { data: userNames } = await supabase
      .from('suggested_names')
      .select('id')
      .eq('user_id', userId);

    let votesReceived = 0;
    if (userNames && userNames.length > 0) {
      const nameIds = userNames.map(n => n.id);
      const { count } = await supabase
        .from('votes')
        .select('id', { count: 'exact', head: true })
        .in('name_id', nameIds)
        .eq('direction', 'up')
        .neq('user_id', userId); // Exclude self-votes
      votesReceived = count || 0;
    }

    return { submissions: submissions || 0, votesReceived };
  } catch {
    return { submissions: 0, votesReceived: 0 };
  }
}

// ──────────────────────────── Submissions Today ────────────────────────────

export async function getSubmissionsToday(userId: string): Promise<number> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('object_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString());

    return count || 0;
  } catch {
    return 0;
  }
}

// ──────────────────────────── Update User Profile ────────────────────────────

export async function uploadAvatarImage(userId: string, uri: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar_${Date.now()}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from('object-images')
        .upload(fileName, blob, { contentType, upsert: false });
      if (error) return { url: null, error: error.message };
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const { error } = await supabase.storage
        .from('object-images')
        .upload(fileName, decode(base64), { contentType, upsert: false });
      if (error) return { url: null, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('object-images')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err.message || 'Avatar upload failed' };
  }
}

export async function updateUserProfile(
  userId: string,
  updates: { display_name?: string; username?: string; avatar_url?: string },
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Profile update failed' };
  }
}

// ──────────────────────────── Update Submission Description ────────────────────────────

export async function updateSubmissionDescription(
  objectId: string,
  userId: string,
  description: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('object_submissions')
      .update({ description })
      .eq('id', objectId)
      .eq('user_id', userId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to update description' };
  }
}

// ──────────────────────────── Delete Submission ────────────────────────────

export async function deleteSubmission(objectId: string, userId: string): Promise<{ error: string | null }> {
  try {
    // Delete the object (cascade will remove suggested_names, votes, comments, reports)
    const { error } = await supabase
      .from('object_submissions')
      .delete()
      .eq('id', objectId)
      .eq('user_id', userId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete submission' };
  }
}

// Admin: delete any submission (no user_id check, RLS enforced)
export async function adminDeleteSubmission(objectId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('object_submissions')
      .delete()
      .eq('id', objectId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete submission' };
  }
}

// Admin: toggle featured status
export async function adminToggleFeatured(objectId: string, isFeatured: boolean): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('object_submissions')
      .update({ is_featured: isFeatured })
      .eq('id', objectId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to update featured status' };
  }
}

// ──────────────────────────── Fetch User Profile ────────────────────────────

export async function fetchUserProfile(userId: string): Promise<{ data: UserProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as UserProfile, error: null };
}
