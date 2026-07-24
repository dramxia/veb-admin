export const dynamic = 'force-dynamic';

import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getMenuPageLoader } from '@/app/_modules/admin-page-manifest';
import { normalizePathname } from '@/components/layout/app-modules';
import { getWorkspacePage } from '@/lib/workspace-navigation';

const GLOBAL_WORKSPACE_PATHS = new Set([
  '/',
  '/profile',
  '/admin/profile',
  // The middleware performs the permanent redirect to the unified menu page.
  '/admin/system/permission',
]);

export default async function WorkspaceTemplate({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = normalizePathname(headers().get('x-veb-pathname') ?? '/');
  if (!GLOBAL_WORKSPACE_PATHS.has(pathname)) {
    const page = await getWorkspacePage(pathname);
    if (!page || !getMenuPageLoader(page.component)) notFound();
  }

  return children;
}
