export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import type { MenuManagementList } from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requestCorePage } from '@/lib/server-api';
import { MenuTree } from './menu-tree';

export default async function MenuPage() {
  const { items: menus, modules } = await requestCorePage<MenuManagementList>(
    '/api/v1/system/menus',
  );
  return (
    <WorkspaceCanvas
      eyebrow="导航与访问控制"
      title="菜单与权限"
      description="在模块树中统一维护目录、页面、外链以及页面下的按钮权限。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">
            {menus.filter((menu) => menu.type !== 'BUTTON').length} 个导航节点
          </Badge>
          <Badge colorScheme="orange">
            {menus.filter((menu) => menu.type === 'BUTTON').length} 个按钮
          </Badge>
        </HStack>
      }
    >
      <MenuTree menus={menus} modules={modules} />
    </WorkspaceCanvas>
  );
}
