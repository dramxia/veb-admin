export const dynamic = 'force-dynamic';

import type { ReactNode } from 'react';
import type { MenuNode, ProfileDto, UserNavigation } from '@veb/api-contracts';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { requestVebPage } from '@/lib/server-api';

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, navigation] = await Promise.all([
    requestVebPage<ProfileDto>('/api/v1/me'),
    requestVebPage<UserNavigation>('/api/v1/navigation'),
  ]);
  const menus = navigation.menus as MenuNode[];
  const user = { ...profile, roles: navigation.roleCodes };

  return (
    <WorkspaceShell
      user={user}
      menus={menus}
      permissionCodes={navigation.permissionCodes}
    >
      {children}
    </WorkspaceShell>
  );
}
