'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserProfile, UserProfileEntry } from '@/lib/types';
import {
  loadProfiles,
  addProfile,
  updateProfile,
  deleteProfile,
  getActiveProfileId,
  setActiveProfileId,
  getActiveProfile,
} from '@/lib/storage';

interface UserContextValue {
  // 현재 활성 프로필 (기존 코드 호환용)
  profile: UserProfile | null;
  // 다중 프로필
  profiles: UserProfileEntry[];
  activeProfileId: string | null;
  isLoaded: boolean;
  // 액션
  setActiveProfile: (id: string) => void;
  addNewProfile: (profile: UserProfile) => UserProfileEntry;
  editProfile: (id: string, profile: UserProfile) => void;
  removeProfile: (id: string) => void;
  /** 레거시 호환: 활성 프로필을 덮어씀 */
  setProfile: (profile: UserProfile) => void;
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  profiles: [],
  activeProfileId: null,
  isLoaded: false,
  setActiveProfile: () => {},
  addNewProfile: () => ({ id: '', createdAt: '', profile: { name: '', gender: 'other', age: 0 } }),
  editProfile: () => {},
  removeProfile: () => {},
  setProfile: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<UserProfileEntry[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadProfiles();
    const activeId = getActiveProfileId();
    setProfiles(loaded);
    // activeId가 실제로 존재하는 프로필인지 확인
    const validId = loaded.find((p) => p.id === activeId)?.id ?? loaded[0]?.id ?? null;
    setActiveProfileIdState(validId);
    if (validId && validId !== activeId) setActiveProfileId(validId);
    setIsLoaded(true);
  }, []);

  const profile = profiles.find((p) => p.id === activeProfileId)?.profile ?? null;

  const setActiveProfile = useCallback((id: string) => {
    setActiveProfileId(id);
    setActiveProfileIdState(id);
  }, []);

  const addNewProfile = useCallback((p: UserProfile): UserProfileEntry => {
    const entry = addProfile(p);
    setProfiles(loadProfiles());
    setActiveProfileId(entry.id);
    setActiveProfileIdState(entry.id);
    return entry;
  }, []);

  const editProfile = useCallback((id: string, p: UserProfile) => {
    updateProfile(id, p);
    setProfiles(loadProfiles());
  }, []);

  const removeProfile = useCallback((id: string) => {
    deleteProfile(id);
    const updated = loadProfiles();
    setProfiles(updated);
    const newActive = getActiveProfileId();
    setActiveProfileIdState(newActive);
  }, []);

  /** 레거시 호환: 활성 프로필 덮어쓰기 */
  const setProfile = useCallback((p: UserProfile) => {
    if (activeProfileId) {
      editProfile(activeProfileId, p);
    } else {
      addNewProfile(p);
    }
  }, [activeProfileId, editProfile, addNewProfile]);

  return (
    <UserContext.Provider value={{
      profile,
      profiles,
      activeProfileId,
      isLoaded,
      setActiveProfile,
      addNewProfile,
      editProfile,
      removeProfile,
      setProfile,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
