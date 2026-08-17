export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveModuleLandingPath } from '@/components/layout/app-modules';
import { getWorkspaceNavigation } from '@/lib/workspace-navigation';

export default async function LegacyAdminLandingPage() {
  const navigation = await getWorkspaceNavigation();
  const adminModule = navigation.modules.find(
    (module) => module.code === 'admin',
  );
  const destination = adminModule
    ? resolveModuleLandingPath(adminModule, '/admin')
    : undefined;

  if (destination) redirect(destination);
  redirect('/403');
}
