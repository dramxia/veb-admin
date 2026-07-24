'use client';

import { create } from 'zustand';
import type { MenuNode, UserNavigation } from '@veb/api-contracts';
import { filterNavigableMenuTree } from '@/components/layout/navigation-utils';

type WorkspaceModule = UserNavigation['modules'][number];

type MenuStoreState = {
  modules: WorkspaceModule[];
  menus: MenuNode[];
  permissionCodes: Set<string>;
  setAll: (payload: {
    modules: WorkspaceModule[];
    menus: MenuNode[];
    permissionCodes: string[];
  }) => void;
  hasPermission: (code: string | string[]) => boolean;
};

export const useMenuStore = create<MenuStoreState>((set, get) => ({
  modules: [],
  menus: [],
  permissionCodes: new Set<string>(),
  setAll: (payload) =>
    set({
      modules: payload.modules.map((module) => ({
        ...module,
        menus: filterNavigableMenuTree(module.menus),
      })),
      menus: filterNavigableMenuTree(payload.menus),
      permissionCodes: new Set(payload.permissionCodes),
    }),
  hasPermission: (code) => {
    const codes = Array.isArray(code) ? code : [code];
    const permissions = get().permissionCodes;
    return codes.some((item) => permissions.has(item));
  },
}));
