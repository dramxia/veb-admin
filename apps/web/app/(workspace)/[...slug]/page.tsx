export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getMenuPageLoader } from '@/app/_modules/admin-page-manifest';
import { AdminShell } from '@/components/layout/admin-shell';
import { normalizePathname } from '@/components/layout/app-modules';
import { getWorkspacePage } from '@/lib/workspace-navigation';

export default async function DynamicWorkspacePage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const pathname = normalizePathname(`/${params.slug?.join('/') ?? ''}`);
  const menu = await getWorkspacePage(pathname);
  if (!menu) notFound();

  const loader = getMenuPageLoader(menu.component);
  if (!loader) notFound();

  const Module = (await loader()).default;
  return (
    <AdminShell>
      <Module />
    </AdminShell>
  );
}
