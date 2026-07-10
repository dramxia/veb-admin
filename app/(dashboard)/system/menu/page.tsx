export const dynamic = 'force-dynamic';

import { Badge, HStack, Text, VStack } from '@chakra-ui/react';
import { ListTree } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
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
      eyebrow="Navigation"
      title="菜单管理"
      description="维护后台菜单树、路由路径、组件标识和菜单权限绑定，Dock 会继续使用同一棵菜单树。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{menus.length} 个菜单节点</Badge>
          <Badge colorScheme="gray">{permissions.length} 个 MENU 权限码</Badge>
        </HStack>
      }
      sideSlot={
        <GlassPanel variant="soft" p={5}>
          <VStack align="stretch" spacing={3}>
            <ListTree size={28} color="#0f5ed7" />
            <Text color="surface.900" fontWeight="900">
              菜单即路由
            </Text>
            <Text color="surface.600" lineHeight="1.8">
              页面类型菜单仍需绑定 MENU 权限码，层级深度和权限关系由后端保护。
            </Text>
          </VStack>
        </GlassPanel>
      }
    >
      <MenuTree menus={menus} permissions={permissions} />
    </WorkspaceCanvas>
  );
}
