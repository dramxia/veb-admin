'use client';

import type { ProfileDto } from '@veb/api-contracts';
import { create } from 'zustand';

export type AuthUser = Pick<
  ProfileDto,
  'id' | 'username' | 'nickname' | 'avatar'
> & {
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
