import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Linking } from 'react-native';
import { useAuth } from '@/template';
import { User, ObjectSubmission, SuggestedName, toUser } from '../services/types';
import {
  fetchObjects,
  createSubmission,
  suggestName,
  castVote,
  uploadObjectImage,
  incrementViewCount,
  getUserStats,
  getSubmissionsToday,
  fetchUserProfile,
  uploadAvatarImage,
  updateUserProfile,
} from '../services/objectService';
import { checkSubscription, SubscriptionStatus } from '../services/subscriptionService';
import { useNotifications } from '../hooks/useNotifications';

interface AppContextType {
  currentUser: User;
  objects: ObjectSubmission[];
  submissionsToday: number;
  isPremium: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  refreshing: boolean;
  checkingSubscription: boolean;
  addSubmission: (imageUri: string, name: string, description: string) => Promise<{ error: string | null }>;
  addNameSuggestion: (objectId: string, name: string) => Promise<{ error: string | null }>;
  vote: (objectId: string, nameId: string, direction: 'up' | 'down') => void;
  searchObjects: (query: string) => ObjectSubmission[];
  getUserObjects: (userId: string) => ObjectSubmission[];
  refreshObjects: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  trackView: (objectId: string) => void;
  updateProfile: (params: { displayName: string; username: string; avatarLocalUri?: string }) => Promise<{ error: string | null }>;
}

const defaultUser: User = {
  id: '',
  username: 'guest',
  displayName: 'Guest',
  avatar: 'https://api.dicebear.com/7.x/initials/png?seed=guest',
  isPremium: false,
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
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const viewedRef = useRef<Set<string>>(new Set());
  const subCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load data when auth user changes
  useEffect(() => {
    if (authUser?.id) {
      loadData(authUser.id);
    } else {
      setCurrentUser(defaultUser);
      setObjects([]);
      setSubmissionsToday(0);
      setIsPremium(false);
      setSubscriptionEnd(null);
      setLoading(false);
    }
  }, [authUser?.id]);

  // Periodic subscription check (every 60 seconds)
  useEffect(() => {
    if (authUser?.id) {
      subCheckIntervalRef.current = setInterval(() => {
        refreshSubscriptionSilent();
      }, 60000);
    }
    return () => {
      if (subCheckIntervalRef.current) {
        clearInterval(subCheckIntervalRef.current);
        subCheckIntervalRef.current = null;
      }
    };
  }, [authUser?.id]);

  // Deep link listener for Stripe redirect
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (event.url.includes('subscription/success')) {
        // User completed checkout — refresh subscription status
        setTimeout(() => refreshSubscriptionSilent(), 2000);
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const refreshSubscriptionSilent = async () => {
    const { data } = await checkSubscription();
    if (data) {
      setIsPremium(data.subscribed);
      setSubscriptionEnd(data.subscriptionEnd);
      setCurrentUser(prev => ({ ...prev, isPremium: data.subscribed }));
    }
  };

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
        setIsPremium(profileRes.data.is_premium);
      }

      if (objectsRes.data) {
        setObjects(objectsRes.data);
      }

      setSubmissionsToday(todayCount);

      // Check Stripe subscription status (async, non-blocking)
      checkSubscription().then(({ data }) => {
        if (data) {
          setIsPremium(data.subscribed);
          setSubscriptionEnd(data.subscriptionEnd);
          setCurrentUser(prev => ({ ...prev, isPremium: data.subscribed }));
        }
      });
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

  const refreshSubscription = useCallback(async () => {
    setCheckingSubscription(true);
    const { data } = await checkSubscription();
    if (data) {
      setIsPremium(data.subscribed);
      setSubscriptionEnd(data.subscriptionEnd);
      setCurrentUser(prev => ({ ...prev, isPremium: data.subscribed }));
    }
    setCheckingSubscription(false);
  }, []);

  const addSubmission = useCallback(async (imageUri: string, name: string, description: string): Promise<{ error: string | null }> => {
    if (!authUser?.id) return { error: 'Not authenticated' };

    const { url, error: uploadErr } = await uploadObjectImage(authUser.id, imageUri);
    if (uploadErr || !url) return { error: uploadErr || 'Image upload failed' };

    const { data, error } = await createSubmission(authUser.id, url, name, description);
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
          isPremium: currentUser.isPremium,
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
              isPremium: currentUser.isPremium,
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

    setCurrentUser(prev => ({
      ...prev,
      displayName: params.displayName,
      username: params.username,
      avatar: updates.avatar_url || prev.avatar,
    }));

    await refreshObjects();
    return { error: null };
  }, [authUser?.id, refreshObjects]);

  return (
    <AppContext.Provider value={{
      currentUser, objects, submissionsToday, isPremium, subscriptionEnd,
      loading, refreshing, checkingSubscription,
      addSubmission, addNameSuggestion, vote,
      searchObjects, getUserObjects, refreshObjects, refreshSubscription,
      trackView, updateProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
