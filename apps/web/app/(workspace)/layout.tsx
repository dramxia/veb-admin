export const dynamic = 'force-dynamic';

import type { ReactNode } from 'react';
import type { ProfileDto } from '@veb/api-contracts';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { normalizePathname } from '@/components/layout/app-modules';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { requestVebPage } from '@/lib/server-api';
import {
  getWorkspaceNavigation,
  getWorkspacePage,
} from '@/lib/workspace-navigation';

const GLOBAL_PATHS = new Set(['/', '/profile', '/admin']);

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = normalizePathname(headers().get('x-veb-pathname') ?? '/');
  const pagePromise = GLOBAL_PATHS.has(pathname)
    ? Promise.resolve(null)
    : getWorkspacePage(pathname);
  const [profile, navigation, page] = await Promise.all([
    requestVebPage<ProfileDto>('/api/v1/me'),
    getWorkspaceNavigation(),
    pagePromise,
  ]);
  if (!GLOBAL_PATHS.has(pathname) && !page) notFound();

  const user = { ...profile, roles: navigation.roleCodes };

  return (
    <WorkspaceShell
      user={user}
      modules={navigation.modules}
      permissionCodes={navigation.permissionCodes}
      activeModuleId={page?.moduleId}
    >
      {children}
    </WorkspaceShell>
  );
}
