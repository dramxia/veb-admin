export const dynamic = 'force-dynamic';

import { Heading, Text } from '@chakra-ui/react';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';
import { PermissionTable } from './permission-table';

export default async function PermissionPage() {
  await requirePermission('system:permission:view');
  const permissions = await prisma.permission.findMany({ orderBy: [{ type: 'asc' }, { code: 'asc' }] });
  return (
    <div>
      <Heading size="lg" mb={2}>权限管理</Heading>
      <Text color="gray.500" mb={4}>维护菜单与按钮权限码。</Text>
      <PermissionTable permissions={permissions} />
    </div>
  );
}
