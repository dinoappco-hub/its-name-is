import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/template';
import { User, ObjectSubmission, SuggestedName, toUser } from '../services/types';
import {
  fetchObjects,
  createSubmission,
  suggestName,
  castVote,
  uploadObjectImage,
  deleteSubmission as deleteSubmissionService,
  updateSubmissionDescription as updateDescriptionService,
  incrementViewCount,
  getUserStats,
  getSubmissionsToday,
  fetchUserProfile,
  uploadAvatarImage,
  updateUserProfile,
} from '../services/objectService';
import { useNotifications } from '../hooks/useNotifications';

interface AppContextType {
  currentUser: User;
  objects: ObjectSubmission[];
  submissionsToday: number;
  loading: boolean;
  refreshing: boolean;
  addSubmission: (imageUri: string, name: string, description: string, category?: string) => Promise<{ error: string | null }>;
  addNameSuggestion: (objectId: string, name: string) => Promise<{ error: string | null }>;
  vote: (objectId: string, nameId: string, direction: 'up' | 'down') => void;
  searchObjects: (query: string) => ObjectSubmission[];
  getUserObjects: (userId: string) => ObjectSubmission[];
  refreshObjects: () => Promise<void>;
  trackView: (objectId: string) => void;
  updateProfile: (params: { displayName: string; username: string; avatarLocalUri?: string }) => Promise<{ error: string | null }>;
  deleteSubmission: (objectId: string) => Promise<{ error: string | null }>;
  updateDescription: (objectId: string, description: string) => Promise<{ error: string | null }>;
}

const defaultUser: User = {
  id: '',
  username: 'guest',
  displayName: 'Guest',
  avatar: 'https://api.dicebear.com/7.x/initials/png?seed=guest',
  totalSubmissions: 0,
  totalVotesReceived: 0,
  joinedAt: new Date().toISOString(),
};

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const { addNotification } = useNotifications();

  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [objects, setObjects] = useState<ObjectSubmission[]>([]);
  const [submissionsToday, setSubmissionsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const viewedRef = useRef<Set<string>>(new Set());

  // Load data when auth user changes
  useEffect(() => {
    if (authUser?.id) {
      loadData(authUser.id);
    } else {
      setCurrentUser(defaultUser);
      setObjects([]);
      setSubmissionsToday(0);
      setLoading(false);
    }
  }, [authUser?.id]);

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      const [profileRes, objectsRes, stats, todayCount] = await Promise.all([
        fetchUserProfile(userId),
        fetchObjects(),
        getUserStats(userId),
        getSubmissionsToday(userId),
      ]);

      if (profileRes.data) {
        setCurrentUser(toUser(profileRes.data, stats));
      }

      if (objectsRes.data) {
        setObjects(objectsRes.data);
      }

      setSubmissionsToday(todayCount);
    } catch (err) {
      console.error('Failed to load app data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshObjects = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await fetchObjects();
      if (data) setObjects(data);

      if (authUser?.id) {
        const [stats, todayCount] = await Promise.all([
          getUserStats(authUser.id),
          getSubmissionsToday(authUser.id),
        ]);
        setCurrentUser(prev => ({
          ...prev,
          totalSubmissions: stats.submissions,
          totalVotesReceived: stats.votesReceived,
        }));
        setSubmissionsToday(todayCount);
      }
    } finally {
      setRefreshing(false);
    }
  }, [authUser?.id]);

  const addSubmission = useCallback(async (imageUri: string, name: string, description: string, category: string = 'random'): Promise<{ error: string | null }> => {
    if (!authUser?.id) return { error: 'Not authenticated' };

    const { url, error: uploadErr } = await uploadObjectImage(authUser.id, imageUri);
    if (uploadErr || !url) return { error: uploadErr || 'Image upload failed' };

    const { data, error } = await createSubmission(authUser.id, url, name, description, category);
    if (error) return { error };

    await refreshObjects();
    return { error: null };
  }, [authUser?.id, refreshObjects]);

  const addNameSuggestion = useCallback(async (objectId: string, name: string): Promise<{ error: string | null }> => {
    if (!authUser?.id) return { error: 'Not authenticated' };

    const { error } = await suggestName(objectId, authUser.id, name);
    if (error) return { error };

    const targetObj = objects.find(o => o.id === objectId);
    if (targetObj && targetObj.submittedBy.id !== authUser.id) {
      addNotification({
        type: 'name_suggestion',
        title: 'New Name Suggested',
        body: `@${currentUser.username} suggested "${name}" for your object`,
        objectId,
        objectImageUri: targetObj.imageUri,
        fromUser: {
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
      });
    }

    await refreshObjects();
    return { error: null };
  }, [authUser?.id, objects, currentUser, addNotification, refreshObjects]);

  const vote = useCallback(async (objectId: string, nameId: string, direction: 'up' | 'down') => {
    if (!authUser?.id) return;

    setObjects(prev => prev.map(obj => {
      if (obj.id !== objectId) return obj;
      const updatedNames = obj.suggestedNames.map(n => {
        if (n.id !== nameId) return n;
        let voteChange = 0;
        let newUserVote: 'up' | 'down' | null = direction;
        if (n.userVote === direction) {
          voteChange = direction === 'up' ? -1 : 1;
          newUserVote = null;
        } else if (n.userVote === null) {
          voteChange = direction === 'up' ? 1 : -1;
        } else {
          voteChange = direction === 'up' ? 2 : -2;
        }
        return { ...n, votes: n.votes + voteChange, userVote: newUserVote };
      });
      const totalVotes = updatedNames.reduce((sum, n) => sum + Math.max(0, n.votes), 0);
      return { ...obj, suggestedNames: updatedNames, totalVotes };
    }));

    if (direction === 'up') {
      const targetObj = objects.find(o => o.id === objectId);
      if (targetObj) {
        const targetName = targetObj.suggestedNames.find(n => n.id === nameId);
        if (targetName && targetName.submittedBy.id !== authUser.id && targetName.userVote !== 'up') {
          addNotification({
            type: 'vote',
            title: 'Your Name Got an Upvote',
            body: `@${currentUser.username} upvoted "${targetName.name}"`,
            objectId,
            objectImageUri: targetObj.imageUri,
            fromUser: {
              username: currentUser.username,
              avatar: currentUser.avatar,
            },
          });
        }
      }
    }

    const { error } = await castVote(nameId, authUser.id, direction);
    if (error) {
      await refreshObjects();
    }
  }, [authUser?.id, objects, currentUser, addNotification, refreshObjects]);

  const searchObjects = useCallback((query: string) => {
    if (!query.trim()) return objects;
    const q = query.toLowerCase();
    return objects.filter(obj =>
      obj.description.toLowerCase().includes(q) ||
      obj.suggestedNames.some(n => n.name.toLowerCase().includes(q)) ||
      obj.submittedBy.username.toLowerCase().includes(q)
    );
  }, [objects]);

  const getUserObjects = useCallback((userId: string) => {
    return objects.filter(obj => obj.submittedBy.id === userId);
  }, [objects]);

  const trackView = useCallback((objectId: string) => {
    if (viewedRef.current.has(objectId)) return;
    viewedRef.current.add(objectId);
    incrementViewCount(objectId);
    setObjects(prev => prev.map(o => o.id === objectId ? { ...o, viewCount: o.viewCount + 1 } : o));
  }, []);

  const deleteSubmission = useCallback(async (objectId: string): Promise<{ error: string | null }> => {
    if (!authUser?.id) return { error: 'Not authenticated' };

    // Optimistic removal
    setObjects(prev => prev.filter(o => o.id !== objectId));
    setCurrentUser(prev => ({ ...prev, totalSubmissions: Math.max(0, prev.totalSubmissions - 1) }));

    const { error } = await deleteSubmissionService(objectId, authUser.id);
    if (error) {
      // Revert on failure
      await refreshObjects();
      return { error };
    }
    return { error: null };
  }, [authUser?.id, refreshObjects]);

  const updateDescription = useCallback(async (objectId: string, description: string): Promise<{ error: string | null }> => {
    if (!authUser?.id) return { error: 'Not authenticated' };

    // Optimistic update
    setObjects(prev => prev.map(o => o.id === objectId ? { ...o, description } : o));

    const { error } = await updateDescriptionService(objectId, authUser.id, description);
    if (error) {
      await refreshObjects();
      return { error };
    }
    return { error: null };
  }, [authUser?.id, refreshObjects]);

  const updateProfile = useCallback(async (params: { displayName: string; username: string; avatarLocalUri?: string }): Promise<{ error: string | null }> => {
    if (!authUser?.id) return { error: 'Not authenticated' };

    const updates: { display_name?: string; username?: string; avatar_url?: string } = {
      display_name: params.displayName,
      username: params.username,
    };

    if (params.avatarLocalUri) {
      const { url, error: uploadErr } = await uploadAvatarImage(authUser.id, params.avatarLocalUri);
      if (uploadErr || !url) return { error: uploadErr || 'Avatar upload failed' };
      updates.avatar_url = url;
    }

    const { error } = await updateUserProfile(authUser.id, updates);
    if (error) return { error };

    const newDisplayName = params.displayName;
    const newUsername = params.username;
    const newAvatar = updates.avatar_url;

    // Instant currentUser update
    setCurrentUser(prev => ({
      ...prev,
      displayName: newDisplayName,
      username: newUsername,
      avatar: newAvatar || prev.avatar,
    }));

    // Instant update across all objects referencing this user
    setObjects(prev => prev.map(obj => {
      const patchUser = (u: User) => {
        if (u.id !== authUser.id) return u;
        return { ...u, displayName: newDisplayName, username: newUsername, avatar: newAvatar || u.avatar };
      };

      const patchedSubmittedBy = patchUser(obj.submittedBy);
      const patchedNames = obj.suggestedNames.map(n => ({
        ...n,
        submittedBy: patchUser(n.submittedBy),
      }));

      if (patchedSubmittedBy === obj.submittedBy && patchedNames.every((n, i) => n.submittedBy === obj.suggestedNames[i]?.submittedBy)) {
        return obj;
      }
      return { ...obj, submittedBy: patchedSubmittedBy, suggestedNames: patchedNames };
    }));

    return { error: null };
  }, [authUser?.id]);

  return (
    <AppContext.Provider value={{
      currentUser, objects, submissionsToday,
      loading, refreshing,
      addSubmission, addNameSuggestion, vote,
      searchObjects, getUserObjects, refreshObjects,
      trackView, updateProfile, deleteSubmission, updateDescription,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
