export const dynamic = 'force-dynamic';

import { Badge } from '@chakra-ui/react';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { TagManager } from './tag-manager';

export default async function TagPage() {
  await requirePermission('content:tag:view');
  const [total, rows] = await Promise.all([
    prisma.tag.count(),
    prisma.tag.findMany({
      take: 20,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { articles: true } },
      },
    }),
  ]);
  return (
    <WorkspaceCanvas
      eyebrow="内容管理"
      title="标签管理"
      description="维护文章分类标签并查看关联内容。"
      heroSlot={<Badge colorScheme="brand">{total} 个标签</Badge>}
    >
      <TagManager
        initial={{
          items: rows.map(({ _count, ...tag }) => ({
            ...tag,
            articleCount: _count.articles,
          })),
          total,
          page: 1,
          pageSize: 20,
        }}
      />
    </WorkspaceCanvas>
  );
}
