'use client';

import { useEffect } from 'react';
import type { MenuNode, UserNavigation } from '@veb/api-contracts';
import { type AuthUser, useAuthStore } from '@/stores/auth-store';
import { useMenuStore } from '@/stores/menu-store';

export function MenuStoreInitializer({
  menus,
  modules,
  permissionCodes,
  user,
}: {
  menus: MenuNode[];
  modules: UserNavigation['modules'];
  permissionCodes: string[];
  user: AuthUser;
}) {
  const setAll = useMenuStore((state) => state.setAll);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    setAll({ menus, modules, permissionCodes });
    setUser(user);
  }, [menus, modules, permissionCodes, setAll, setUser, user]);

  return null;
}
