export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';
import { RoleTable } from './role-table';

export default async function RolePage() {
  await requirePermission('system:role:view');
  const [roles, permissions, users] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { users: true, permissions: true } } },
    }),
    prisma.permission.findMany({
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
      select: { id: true, code: true, name: true, type: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, nickname: true },
    }),
  ]);
  return (
    <WorkspaceCanvas
      eyebrow="访问控制"
      title="角色管理"
      description="维护角色状态、权限集合与用户绑定。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{roles.length} 个角色</Badge>
          <Badge colorScheme="cyan">{permissions.length} 个权限</Badge>
          <Badge colorScheme="gray">{users.length} 个用户</Badge>
        </HStack>
      }
    >
      <RoleTable roles={roles} permissions={permissions} users={users} />
    </WorkspaceCanvas>
  );
}
