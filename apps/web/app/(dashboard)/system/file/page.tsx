export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import type { FileDto, PageResult } from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requestVebPage } from '@/lib/server-api';
import { FileTable } from './file-table';

export default async function FilePage() {
  const { items: files } = await requestVebPage<PageResult<FileDto>>(
    '/api/v1/files?pageSize=100',
  );

  return (
    <WorkspaceCanvas
      eyebrow="系统管理"
      title="文件管理"
      description="上传、预览、下载与删除当前存储空间中的文件。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{files.length} 个文件</Badge>
          <Badge colorScheme="gray">本地存储</Badge>
        </HStack>
      }
    >
      <FileTable files={files} />
    </WorkspaceCanvas>
  );
}
