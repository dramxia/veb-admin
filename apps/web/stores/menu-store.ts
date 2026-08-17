'use client';

import { create } from 'zustand';
import type { MenuNode } from '@veb/api-contracts';

type MenuStoreState = {
  menus: MenuNode[];
  permissionCodes: Set<string>;
  setAll: (payload: { menus: MenuNode[]; permissionCodes: string[] }) => void;
};

export const useMenuStore = create<MenuStoreState>((set) => ({
  menus: [],
  permissionCodes: new Set<string>(),
  setAll: (payload) =>
    set({
      menus: payload.menus,
      permissionCodes: new Set(payload.permissionCodes),
    }),
}));
