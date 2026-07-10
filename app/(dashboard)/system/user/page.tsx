export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';
import { UserTable } from './user-table';

export default async function UserPage() {
  await requirePermission('system:user:view');
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        status: true,
        createdAt: true,
        roles: {
          select: { role: { select: { id: true, code: true, name: true } } },
        },
      },
    }),
    prisma.role.findMany({
      orderBy: { sort: 'asc' },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <WorkspaceCanvas
      eyebrow="系统管理"
      title="用户管理"
      description="维护账号资料、启停状态、登录密码与角色分配。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{users.length} 个账号</Badge>
          <Badge colorScheme="gray">{roles.length} 个角色</Badge>
        </HStack>
      }
    >
      <UserTable users={users} roles={roles} />
    </WorkspaceCanvas>
  );
}
