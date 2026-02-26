'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { UserProfile } from '@/lib/types';
import { loadUserProfile, saveUserProfile } from '@/lib/storage';

interface UserContextValue {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  setProfile: () => {},
  isLoaded: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = loadUserProfile();
    if (saved) setProfileState(saved);
    setIsLoaded(true);
  }, []);

  const setProfile = (p: UserProfile) => {
    saveUserProfile(p);
    setProfileState(p);
  };

  return (
    <UserContext.Provider value={{ profile, setProfile, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
