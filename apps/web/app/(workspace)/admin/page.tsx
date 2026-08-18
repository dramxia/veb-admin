export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getWorkspaceNavigation } from '@/lib/workspace-navigation';

export default async function AdminLandingPage() {
  const navigation = await getWorkspaceNavigation();
  const adminModule = navigation.modules.find(
    (module) => module.code === 'admin',
  );
  const destination = adminModule?.landingPath;

  if (destination) redirect(destination);
  redirect('/403');
}
