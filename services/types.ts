// Database-aligned types

export interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  created_at: string;
}

// Enriched user for UI display
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isPremium: boolean;
  totalSubmissions: number;
  totalVotesReceived: number;
  joinedAt: string;
}

export interface DbObjectSubmission {
  id: string;
  user_id: string;
  image_url: string;
  description: string;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  user_profiles: UserProfile;
}

export interface DbSuggestedName {
  id: string;
  object_id: string;
  user_id: string;
  name: string;
  created_at: string;
  user_profiles: UserProfile;
}

export interface DbVote {
  id: string;
  name_id: string;
  user_id: string;
  direction: 'up' | 'down';
  created_at: string;
}

// UI-ready types
export interface SuggestedName {
  id: string;
  name: string;
  submittedBy: User;
  votes: number;
  userVote: 'up' | 'down' | null;
  submittedAt: string;
}

export interface ObjectSubmission {
  id: string;
  imageUri: string;
  description: string;
  suggestedNames: SuggestedName[];
  submittedBy: User;
  submittedAt: string;
  isFeatured: boolean;
  totalVotes: number;
  viewCount: number;
}

// Helper to convert DB profile to UI user
export function toUser(profile: UserProfile, stats?: { submissions: number; votesReceived: number }): User {
  return {
    id: profile.id,
    username: profile.username || profile.email.split('@')[0],
    displayName: profile.display_name || profile.username || profile.email.split('@')[0],
    avatar: profile.avatar_url || `https://api.dicebear.com/7.x/initials/png?seed=${profile.username || profile.email}`,
    isPremium: profile.is_premium,
    totalSubmissions: stats?.submissions ?? 0,
    totalVotesReceived: stats?.votesReceived ?? 0,
    joinedAt: profile.created_at,
  };
}
