export const dynamic = 'force-dynamic';

import { Heading, Text } from '@chakra-ui/react';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';
import { MenuTree } from './menu-tree';

export default async function MenuPage() {
  await requirePermission('system:menu:view');
  const [menus, permissions] = await Promise.all([
    prisma.menu.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] }),
    prisma.permission.findMany({ where: { type: 'MENU' }, orderBy: { code: 'asc' }, select: { code: true, name: true } }),
  ]);
  return (
    <div>
      <Heading size="lg" mb={2}>菜单管理</Heading>
      <Text color="gray.500" mb={4}>维护后台菜单树、路由路径与菜单权限绑定。</Text>
      <MenuTree menus={menus} permissions={permissions} />
    </div>
  );
}
