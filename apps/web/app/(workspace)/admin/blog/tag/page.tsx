export const dynamic = 'force-dynamic';

import { Badge } from '@chakra-ui/react';
import type { AdminTag, PageResult } from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requestCorePage } from '@/lib/server-api';
import { TagManager } from './tag-manager';

export default async function TagPage() {
  const data = await requestCorePage<PageResult<AdminTag>>(
    '/api/v1/blog/manage/tags?pageSize=20',
  );
  return (
    <WorkspaceCanvas
      eyebrow="内容管理"
      title="标签管理"
      description="维护文章分类标签并查看关联内容。"
      heroSlot={<Badge colorScheme="brand">{data.total} 个标签</Badge>}
    >
      <TagManager initial={data} />
    </WorkspaceCanvas>
  );
}
