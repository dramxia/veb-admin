'use client';

import { create } from 'zustand';
import type { MenuNode } from '@/lib/menu';

type MenuStoreState = {
  menus: MenuNode[];
  permissionCodes: Set<string>;
  setAll: (payload: { menus: MenuNode[]; permissionCodes: string[] }) => void;
  hasPermission: (code: string | string[]) => boolean;
};

export const useMenuStore = create<MenuStoreState>((set, get) => ({
  menus: [],
  permissionCodes: new Set<string>(),
  setAll: (payload) => set({ menus: payload.menus, permissionCodes: new Set(payload.permissionCodes) }),
  hasPermission: (code) => {
    const codes = Array.isArray(code) ? code : [code];
    const permissions = get().permissionCodes;
    return codes.some((item) => permissions.has(item));
  },
}));
