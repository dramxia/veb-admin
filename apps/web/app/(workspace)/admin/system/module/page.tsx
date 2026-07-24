export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import type { AppModuleDto, PageResult } from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requestVebPage } from '@/lib/server-api';
import { ModuleTable } from './module-table';

export default async function ModulePage() {
  const { items: modules } = await requestVebPage<PageResult<AppModuleDto>>(
    '/api/v1/system/modules?pageSize=100',
  );

  return (
    <WorkspaceCanvas
      eyebrow="访问控制"
      title="模块管理"
      description="维护应用模块分组；模块入口由其首个可访问页面自动确定。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{modules.length} 个模块</Badge>
          <Badge colorScheme="gray">
            {modules.filter((module) => module.status === 'ENABLED').length}{' '}
            个启用
          </Badge>
        </HStack>
      }
    >
      <ModuleTable modules={modules} />
    </WorkspaceCanvas>
  );
}
