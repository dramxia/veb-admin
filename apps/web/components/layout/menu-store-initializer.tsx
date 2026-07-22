'use client';

import { useEffect } from 'react';
import type { MenuNode } from '@veb/api-contracts';
import { type AuthUser, useAuthStore } from '@/stores/auth-store';
import { useMenuStore } from '@/stores/menu-store';

export function MenuStoreInitializer({
  menus,
  permissionCodes,
  user,
}: {
  menus: MenuNode[];
  permissionCodes: string[];
  user: AuthUser;
}) {
  const setAll = useMenuStore((state) => state.setAll);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    setAll({ menus, permissionCodes });
    setUser(user);
  }, [menus, permissionCodes, setAll, setUser, user]);

  return null;
}
