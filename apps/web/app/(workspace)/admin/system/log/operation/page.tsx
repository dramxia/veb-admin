export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import type { OperationLogDto, PageResult } from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { t } from '@/lib/i18n';
import { requestVebPage } from '@/lib/server-api';
import { OperationLogTable } from './log-table';

export default async function OperationLogPage({
  searchParams = {},
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  const query = new URLSearchParams({ pageSize: '50' });
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) query.set(key, value);
  }
  const { items: logs } = await requestVebPage<PageResult<OperationLogDto>>(
    `/api/v1/system/logs/operation?${query}`,
  );

  return (
    <WorkspaceCanvas
      eyebrow="系统管理"
      title={t('log.title')}
      description={t('log.description')}
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{logs.length} 条最近记录</Badge>
          <Badge colorScheme="gray">最多展示 50 条</Badge>
        </HStack>
      }
    >
      <OperationLogTable logs={logs} />
    </WorkspaceCanvas>
  );
}
