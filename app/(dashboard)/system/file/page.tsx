export const dynamic = 'force-dynamic';

import { Heading, Text } from '@chakra-ui/react';
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
    <div>
      <Heading size="lg" mb={2}>文件管理</Heading>
      <Text color="gray.500" mb={4}>上传、预览、下载与删除本地存储文件。</Text>
      <FileTable files={files.map((file) => ({ ...file, url: storage.url(file) }))} />
    </div>
  );
}
