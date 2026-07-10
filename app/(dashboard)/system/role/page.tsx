export const dynamic = 'force-dynamic';

import { Badge, HStack, Text, VStack } from '@chakra-ui/react';
import { ShieldCheck } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
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
      eyebrow="RBAC"
      title="角色管理"
      description="维护角色、启停状态、权限集合和用户绑定，抽屉式分配适合批量勾选。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{roles.length} 个角色</Badge>
          <Badge colorScheme="cyan">{permissions.length} 个权限</Badge>
          <Badge colorScheme="gray">{users.length} 个用户</Badge>
        </HStack>
      }
      sideSlot={
        <GlassPanel variant="soft" p={5}>
          <VStack align="stretch" spacing={3}>
            <ShieldCheck size={28} color="#0f5ed7" />
            <Text color="surface.900" fontWeight="900">
              授权关系一屏维护
            </Text>
            <Text color="surface.600" lineHeight="1.8">
              分配权限和分配用户从原生输入框升级为可搜索、可勾选的侧向抽屉。
            </Text>
          </VStack>
        </GlassPanel>
      }
    >
      <RoleTable roles={roles} permissions={permissions} users={users} />
    </WorkspaceCanvas>
  );
}
