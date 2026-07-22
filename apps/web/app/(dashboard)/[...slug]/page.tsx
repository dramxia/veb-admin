export const dynamic = 'force-dynamic';

import type { MenuNode, UserNavigation } from '@veb/api-contracts';
import { notFound, redirect } from 'next/navigation';
import { getModuleLoader } from '@/app/_modules/manifest';
import { requestVebPage } from '@/lib/server-api';

function flattenMenus(menus: MenuNode[]): MenuNode[] {
  return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children)]);
}

export default async function DynamicMenuPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const pathname = `/${params.slug?.join('/') ?? ''}`.replace(/\/$/, '') || '/';
  const navigation = await requestVebPage<UserNavigation>('/api/v1/navigation');
  const menu = flattenMenus(navigation.menus as MenuNode[])
    .filter(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
  if (!menu) redirect('/403');
  if (menu.type === 'LINK' && menu.externalUrl) redirect(menu.externalUrl);

  const loader = getModuleLoader(menu.component);
  if (!loader) notFound();

  const Module = (await loader()).default;
  return <Module />;
}
