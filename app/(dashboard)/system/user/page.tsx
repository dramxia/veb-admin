export const dynamic = 'force-dynamic';

import { Badge, HStack, Text, VStack } from '@chakra-ui/react';
import { UserRoundCheck } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
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
      eyebrow="System Access"
      title="用户管理"
      description="管理账号资料、启停状态、登录密码与角色分配，所有按钮仍受权限码控制。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{users.length} 个账号</Badge>
          <Badge colorScheme="gray">{roles.length} 个可分配角色</Badge>
        </HStack>
      }
      sideSlot={
        <GlassPanel variant="soft" p={5}>
          <VStack align="stretch" spacing={3}>
            <UserRoundCheck size={28} color="#0f5ed7" />
            <Text color="surface.900" fontWeight="900">
              账号生命周期
            </Text>
            <Text color="surface.600" lineHeight="1.8">
              新增、资料维护、改密、分配角色和删除都已收敛到玻璃弹层中。
            </Text>
          </VStack>
        </GlassPanel>
      }
    >
      <UserTable users={users} roles={roles} />
    </WorkspaceCanvas>
  );
}
