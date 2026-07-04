export const dynamic = 'force-dynamic';

import { Badge, HStack, Text, VStack } from '@chakra-ui/react';
import { FileBox } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
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
      eyebrow="Storage"
      title="文件管理"
      description="上传、预览、下载与删除本地存储文件，上传区和数据舱保持轻量分层。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="green">{files.length} 个文件</Badge>
          <Badge colorScheme="gray">Local Storage</Badge>
        </HStack>
      }
      sideSlot={
        <GlassPanel variant="soft" p={5}>
          <VStack align="stretch" spacing={3}>
            <FileBox size={28} color="#168654" />
            <Text color="surface.900" fontWeight="900">
              资产轻量管理
            </Text>
            <Text color="surface.600" lineHeight="1.8">
              文件操作继续走现有上传限制和 API 权限守卫，视觉层只优化操作入口。
            </Text>
          </VStack>
        </GlassPanel>
      }
    >
      <FileTable files={files.map((file) => ({ ...file, url: storage.url(file) }))} />
    </WorkspaceCanvas>
  );
}
