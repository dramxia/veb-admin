export const dynamic = 'force-dynamic';

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserMenuAndPermissions } from '@/lib/menu';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { menus, permissionCodes, roleCodes } = await getUserMenuAndPermissions(session.user.id);
  const user = { ...session.user, roles: roleCodes };

  return <DashboardShell user={user} menus={menus} permissionCodes={permissionCodes}>{children}</DashboardShell>;
}
