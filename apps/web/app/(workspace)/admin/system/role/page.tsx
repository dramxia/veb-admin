export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import type {
  PageResult,
  PermissionDto,
  RoleDto,
  VebUser,
} from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requestVebPage } from '@/lib/server-api';
import { RoleTable } from './role-table';

export default async function RolePage() {
  const [rolePage, permissionPage, userPage] = await Promise.all([
    requestVebPage<PageResult<RoleDto>>('/api/v1/system/roles?pageSize=100'),
    requestVebPage<PageResult<PermissionDto>>(
      '/api/v1/system/permissions?pageSize=100',
    ),
    requestVebPage<PageResult<VebUser>>('/api/v1/system/users?pageSize=100'),
  ]);
  const roles = rolePage.items;
  const permissions = permissionPage.items;
  const users = userPage.items;
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
