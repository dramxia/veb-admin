'use client';

import { useEffect } from 'react';
import type { MenuNode } from '@/lib/menu';
import { useAuthStore } from '@/stores/auth-store';
import { useMenuStore } from '@/stores/menu-store';

type UserPayload = {
  id: string;
  username: string;
  nickname?: string | null;
  avatar?: string | null;
  roles: string[];
};

export function MenuStoreInitializer({
  menus,
  permissionCodes,
  user,
}: {
  menus: MenuNode[];
  permissionCodes: string[];
  user: UserPayload;
}) {
  const setAll = useMenuStore((state) => state.setAll);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    setAll({ menus, permissionCodes });
    setUser(user);
  }, [menus, permissionCodes, setAll, setUser, user]);

  return null;
}
