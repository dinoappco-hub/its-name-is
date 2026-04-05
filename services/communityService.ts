import { getSupabaseClient } from '@/template';
import { UserProfile, toUser, User } from './types';

const supabase = getSupabaseClient();

export interface LeaderboardEntry {
  user: User;
  score: number;
  rank: number;
}

export interface CommunityStats {
  totalObjects: number;
  totalNames: number;
  totalVotes: number;
  totalUsers: number;
}

// ──────────────────────────── Community Stats ────────────────────────────

export async function fetchCommunityStats(): Promise<CommunityStats> {
  try {
    const [objRes, nameRes, voteRes, userRes] = await Promise.all([
      supabase.from('object_submissions').select('id', { count: 'exact', head: true }),
      supabase.from('suggested_names').select('id', { count: 'exact', head: true }),
      supabase.from('votes').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalObjects: objRes.count || 0,
      totalNames: nameRes.count || 0,
      totalVotes: voteRes.count || 0,
      totalUsers: userRes.count || 0,
    };
  } catch {
    return { totalObjects: 0, totalNames: 0, totalVotes: 0, totalUsers: 0 };
  }
}

// ──────────────────────────── Top Contributors (by submissions) ────────────────────────────

export async function fetchTopContributors(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // Get all submissions grouped by user
    const { data: submissions, error } = await supabase
      .from('object_submissions')
      .select('user_id, user_profiles!user_id(*)');

    if (error || !submissions) return [];

    // Count submissions per user
    const userCounts = new Map<string, { count: number; profile: UserProfile }>();
    submissions.forEach((s: any) => {
      const existing = userCounts.get(s.user_id);
      if (existing) {
        existing.count++;
      } else {
        userCounts.set(s.user_id, { count: 1, profile: s.user_profiles });
      }
    });

    // Sort by count descending
    const sorted = Array.from(userCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit);

    return sorted.map(([_, entry], idx) => ({
      user: toUser(entry.profile, { submissions: entry.count, votesReceived: 0 }),
      score: entry.count,
      rank: idx + 1,
    }));
  } catch {
    return [];
  }
}

// ──────────────────────────── Top Namers (by number of names suggested) ────────────────────────────

export async function fetchTopNamers(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const { data: names, error } = await supabase
      .from('suggested_names')
      .select('user_id, user_profiles!user_id(*)');

    if (error || !names) return [];

    const userCounts = new Map<string, { count: number; profile: UserProfile }>();
    names.forEach((n: any) => {
      const existing = userCounts.get(n.user_id);
      if (existing) {
        existing.count++;
      } else {
        userCounts.set(n.user_id, { count: 1, profile: n.user_profiles });
      }
    });

    const sorted = Array.from(userCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit);

    return sorted.map(([_, entry], idx) => ({
      user: toUser(entry.profile),
      score: entry.count,
      rank: idx + 1,
    }));
  } catch {
    return [];
  }
}

// ──────────────────────────── Most Voted Users (upvotes received) ────────────────────────────

export async function fetchMostVotedUsers(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // Get all upvotes with name submitter info
    const { data: votes, error } = await supabase
      .from('votes')
      .select('direction, suggested_names!name_id(user_id, user_profiles!user_id(*))')
      .eq('direction', 'up');

    if (error || !votes) return [];

    const userCounts = new Map<string, { count: number; profile: UserProfile }>();
    votes.forEach((v: any) => {
      const nameData = v.suggested_names;
      if (!nameData) return;
      const userId = nameData.user_id;
      const profile = nameData.user_profiles;
      if (!profile) return;

      const existing = userCounts.get(userId);
      if (existing) {
        existing.count++;
      } else {
        userCounts.set(userId, { count: 1, profile });
      }
    });

    const sorted = Array.from(userCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit);

    return sorted.map(([_, entry], idx) => ({
      user: toUser(entry.profile, { submissions: 0, votesReceived: entry.count }),
      score: entry.count,
      rank: idx + 1,
    }));
  } catch {
    return [];
  }
}

// ──────────────────────────── Fetch Public User Profile ────────────────────────────

export async function fetchPublicUserProfile(userId: string): Promise<{
  user: User | null;
  submissions: number;
  namesGiven: number;
  votesReceived: number;
  error: string | null;
}> {
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) return { user: null, submissions: 0, namesGiven: 0, votesReceived: 0, error: 'User not found' };

    // Count submissions
    const { count: submissions } = await supabase
      .from('object_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Count names suggested
    const { count: namesGiven } = await supabase
      .from('suggested_names')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Count upvotes received
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
        .neq('user_id', userId);
      votesReceived = count || 0;
    }

    const user = toUser(profile as UserProfile, { submissions: submissions || 0, votesReceived });

    return { user, submissions: submissions || 0, namesGiven: namesGiven || 0, votesReceived, error: null };
  } catch (err: any) {
    return { user: null, submissions: 0, namesGiven: 0, votesReceived: 0, error: err.message };
  }
}

// ──────────────────────────── Recent Active Users ────────────────────────────

export async function fetchRecentActiveUsers(limit: number = 8): Promise<User[]> {
  try {
    // Get recently active users from submissions
    const { data: recentSubmissions, error } = await supabase
      .from('object_submissions')
      .select('user_id, user_profiles!user_id(*)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !recentSubmissions) return [];

    // Deduplicate by user
    const seen = new Set<string>();
    const users: User[] = [];
    for (const s of recentSubmissions) {
      if (seen.has(s.user_id)) continue;
      seen.add(s.user_id);
      users.push(toUser(s.user_profiles as any));
      if (users.length >= limit) break;
    }

    return users;
  } catch {
    return [];
  }
}
