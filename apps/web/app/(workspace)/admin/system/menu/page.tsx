export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import type { MenuDto, PageResult, PermissionDto } from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requestVebPage } from '@/lib/server-api';
import { MenuTree } from './menu-tree';

export default async function MenuPage() {
  const [menuPayload, permissionPage] = await Promise.all([
    requestVebPage<{ items: MenuDto[] }>('/api/v1/system/menus'),
    requestVebPage<PageResult<PermissionDto>>(
      '/api/v1/system/permissions?pageSize=100&type=MENU',
    ),
  ]);
  const menus = menuPayload.items;
  const permissions = permissionPage.items;
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
