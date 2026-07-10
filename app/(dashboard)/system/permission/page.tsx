export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';
import { PermissionTable } from './permission-table';

export default async function PermissionPage() {
  await requirePermission('system:permission:view');
  const permissions = await prisma.permission.findMany({
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });

  return (
    <WorkspaceCanvas
      eyebrow="系统管理"
      title="权限管理"
      description="维护菜单和按钮权限码，为页面、操作与接口授权提供统一基础。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{permissions.length} 个权限码</Badge>
          <Badge colorScheme="gray">菜单 / 按钮</Badge>
        </HStack>
      }
    >
      <PermissionTable permissions={permissions} />
    </WorkspaceCanvas>
  );
}
