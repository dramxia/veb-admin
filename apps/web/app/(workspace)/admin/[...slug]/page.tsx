export const dynamic = 'force-dynamic';

import type { MenuNode, UserNavigation } from '@veb/api-contracts';
import { notFound, redirect } from 'next/navigation';
import { getAdminPageLoader } from '@/app/_modules/admin-page-manifest';
import { ADMIN_BASE_PATH } from '@/components/layout/app-modules';
import { normalizeAdminMenuPath } from '@/components/layout/navigation-utils';
import { requestVebPage } from '@/lib/server-api';

function flattenMenus(menus: MenuNode[]): MenuNode[] {
  return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children)]);
}

export default async function DynamicMenuPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const suffix = params.slug?.join('/') ?? '';
  const pathname = `${ADMIN_BASE_PATH}/${suffix}`.replace(/\/$/, '');
  const navigation = await requestVebPage<UserNavigation>('/api/v1/navigation');
  const menu = flattenMenus(navigation.menus as MenuNode[])
    .map((item) => ({ item, path: normalizeAdminMenuPath(item.path) }))
    .filter(({ path: menuPath }) => {
      return (
        pathname === menuPath ||
        (menuPath !== ADMIN_BASE_PATH && pathname.startsWith(`${menuPath}/`))
      );
    })
    .sort((a, b) => b.path.length - a.path.length)[0]?.item;
  if (!menu) redirect('/403');
  if (menu.type === 'LINK' && menu.externalUrl) redirect(menu.externalUrl);

  const loader = getAdminPageLoader(menu.component);
  if (!loader) notFound();

  const Module = (await loader()).default;
  return <Module />;
}
