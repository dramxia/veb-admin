export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getMenuByPath } from '@/lib/menu';
import { canAccess } from '@/lib/permission';
import { getModuleLoader } from '@/app/_modules/manifest';

export default async function DynamicMenuPage({ params }: { params: { slug?: string[] } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const pathname = `/${params.slug?.join('/') ?? ''}`.replace(/\/$/, '') || '/';
  const allowed = await canAccess(session.user.id, pathname);
  if (!allowed) redirect('/403');

  const menu = await getMenuByPath(pathname);
  if (!menu) notFound();
  if (menu.type === 'LINK' && menu.externalUrl) redirect(menu.externalUrl);

  const loader = getModuleLoader(menu.component);
  if (!loader) notFound();

  const Module = (await loader()).default;
  return <Module />;
}
