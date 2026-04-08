import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/template';
import { fetchMutedUsers, muteUser as muteUserService, unmuteUser as unmuteUserService } from '../services/muteService';

interface MuteContextType {
  mutedUserIds: string[];
  isUserMuted: (userId: string) => boolean;
  muteUser: (userId: string) => Promise<{ error: string | null }>;
  unmuteUser: (userId: string) => Promise<{ error: string | null }>;
  loadingMutes: boolean;
}

export const MuteContext = createContext<MuteContextType>({} as MuteContextType);

export function MuteProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [mutedUserIds, setMutedUserIds] = useState<string[]>([]);
  const [loadingMutes, setLoadingMutes] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      loadMutes(authUser.id);
    } else {
      setMutedUserIds([]);
    }
  }, [authUser?.id]);

  const loadMutes = async (userId: string) => {
    setLoadingMutes(true);
    const { data } = await fetchMutedUsers(userId);
    setMutedUserIds(data);
    setLoadingMutes(false);
  };

  const isUserMuted = useCallback((userId: string) => {
    return mutedUserIds.includes(userId);
  }, [mutedUserIds]);

  const muteUser = useCallback(async (userId: string): Promise<{ error: string | null }> => {
    if (!authUser?.id) return { error: 'Not authenticated' };
    // Optimistic update
    setMutedUserIds(prev => [...prev, userId]);
    const { error } = await muteUserService(authUser.id, userId);
    if (error) {
      setMutedUserIds(prev => prev.filter(id => id !== userId));
      return { error };
    }
    return { error: null };
  }, [authUser?.id]);

  const unmuteUser = useCallback(async (userId: string): Promise<{ error: string | null }> => {
    if (!authUser?.id) return { error: 'Not authenticated' };
    // Optimistic update
    setMutedUserIds(prev => prev.filter(id => id !== userId));
    const { error } = await unmuteUserService(authUser.id, userId);
    if (error) {
      setMutedUserIds(prev => [...prev, userId]);
      return { error };
    }
    return { error: null };
  }, [authUser?.id]);

  return (
    <MuteContext.Provider value={{ mutedUserIds, isUserMuted, muteUser, unmuteUser, loadingMutes }}>
      {children}
    </MuteContext.Provider>
  );
}
