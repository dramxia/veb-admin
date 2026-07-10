export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage';
import { FileTable } from './file-table';

export default async function FilePage() {
  await requirePermission('system:file:view');
  const storage = getStorage();
  const files = await prisma.file.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { username: true, nickname: true } } },
  });

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
      <FileTable
        files={files.map((file) => ({ ...file, url: storage.url(file) }))}
      />
    </WorkspaceCanvas>
  );
}
