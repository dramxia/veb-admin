export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getMenuPageLoader } from '@/app/_modules/admin-page-manifest';
import { getWorkspacePage } from '@/lib/workspace-navigation';

export default async function DynamicMenuPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const pathname = `/admin/${params.slug?.join('/') ?? ''}`.replace(/\/$/, '');
  const menu = await getWorkspacePage(pathname);
  if (!menu) notFound();

  const loader = getMenuPageLoader(menu.component);
  if (!loader) notFound();

  const Module = (await loader()).default;
  return <Module />;
}
