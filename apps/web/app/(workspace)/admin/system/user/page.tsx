export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import type { PageResult, RoleDto, VebUser } from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requestCorePage } from '@/lib/server-api';
import { UserTable } from './user-table';

export default async function UserPage() {
  const [userPage, rolePage] = await Promise.all([
    requestCorePage<PageResult<VebUser>>('/api/v1/system/users?pageSize=100'),
    requestCorePage<PageResult<RoleDto>>('/api/v1/system/roles?pageSize=100'),
  ]);
  const users = userPage.items;
  const roles = rolePage.items;

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
