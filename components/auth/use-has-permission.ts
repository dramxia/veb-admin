'use client';

import { useMemo } from 'react';
import { useMenuStore } from '@/stores/menu-store';

export type PermissionCode = string | string[];

export function useHasPermission(code: PermissionCode) {
  const permissionCodes = useMenuStore((state) => state.permissionCodes);

  return useMemo(() => {
    const codes = Array.isArray(code) ? code : [code];
    return codes.some((item) => permissionCodes.has(item));
  }, [code, permissionCodes]);
}
