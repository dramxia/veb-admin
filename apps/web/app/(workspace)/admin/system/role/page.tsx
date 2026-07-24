export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import type { PageResult, RoleDto } from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requestVebPage } from '@/lib/server-api';
import { RoleTable } from './role-table';

export default async function RolePage() {
  const rolePage = await requestVebPage<PageResult<RoleDto>>(
    '/api/v1/system/roles?pageSize=100',
  );
  const roles = rolePage.items;
  return (
    <WorkspaceCanvas
      eyebrow="访问控制"
      title="角色管理"
      description="一次配置角色可访问的模块、页面与按钮权限，并维护用户绑定。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{roles.length} 个角色</Badge>
        </HStack>
      }
    >
      <RoleTable roles={roles} />
    </WorkspaceCanvas>
  );
}
