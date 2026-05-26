export const dynamic = 'force-dynamic';

import { Heading, Text } from '@chakra-ui/react';
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
        roles: { select: { role: { select: { id: true, code: true, name: true } } } },
      },
    }),
    prisma.role.findMany({ orderBy: { sort: 'asc' }, select: { id: true, code: true, name: true } }),
  ]);

  return (
    <div>
      <Heading size="lg" mb={2}>用户管理</Heading>
      <Text color="gray.500" mb={4}>管理账号、状态、密码与角色分配。</Text>
      <UserTable users={users} roles={roles} />
    </div>
  );
}
