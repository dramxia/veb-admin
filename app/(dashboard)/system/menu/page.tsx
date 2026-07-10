export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';
import { MenuTree } from './menu-tree';

export default async function MenuPage() {
  await requirePermission('system:menu:view');
  const [menus, permissions] = await Promise.all([
    prisma.menu.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] }),
    prisma.permission.findMany({
      where: { type: 'MENU' },
      orderBy: { code: 'asc' },
      select: { code: true, name: true },
    }),
  ]);
  return (
    <WorkspaceCanvas
      eyebrow="导航配置"
      title="菜单管理"
      description="维护导航层级、页面入口与菜单权限绑定。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{menus.length} 个菜单节点</Badge>
          <Badge colorScheme="gray">{permissions.length} 个菜单权限码</Badge>
        </HStack>
      }
    >
      <MenuTree menus={menus} permissions={permissions} />
    </WorkspaceCanvas>
  );
}
