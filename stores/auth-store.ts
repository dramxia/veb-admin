'use client';

import { create } from 'zustand';

type AuthUser = {
  id: string;
  username: string;
  nickname?: string | null;
  avatar?: string | null;
  roles: string[];
};

type AuthStoreState = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
