export const dynamic = 'force-dynamic';

import { Heading, Text } from '@chakra-ui/react';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';
import { RoleTable } from './role-table';

export default async function RolePage() {
  await requirePermission('system:role:view');
  const [roles, permissions, users] = await Promise.all([
    prisma.role.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }], include: { _count: { select: { users: true, permissions: true } } } }),
    prisma.permission.findMany({ orderBy: [{ type: 'asc' }, { code: 'asc' }], select: { id: true, code: true, name: true, type: true } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, username: true, nickname: true } }),
  ]);
  return (
    <div>
      <Heading size="lg" mb={2}>角色管理</Heading>
      <Text color="gray.500" mb={4}>管理角色、启停、权限与用户绑定。</Text>
      <RoleTable roles={roles} permissions={permissions} users={users} />
    </div>
  );
}
