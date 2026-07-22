'use client';

import type { ReactNode } from 'react';
import { useHasPermission, type PermissionCode } from './use-has-permission';

type AuthProps = {
  code: PermissionCode;
  children: ReactNode;
  fallback?: ReactNode;
};

export function Auth({ code, children, fallback = null }: AuthProps) {
  const hasPermission = useHasPermission(code);

  if (!hasPermission) return <>{fallback}</>;

  return <>{children}</>;
}
