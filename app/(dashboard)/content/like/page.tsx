export const dynamic = 'force-dynamic';

import { Badge } from '@chakra-ui/react';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { maskVisitorHash } from '@/lib/content';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { LikeManager } from './like-manager';

export default async function LikePage() {
  await requirePermission('content:like:view');
  const [total, rows, articles] = await Promise.all([
    prisma.articleLike.count(),
    prisma.articleLike.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        articleId: true,
        visitorKeyHash: true,
        createdAt: true,
        article: { select: { title: true, slug: true } },
      },
    }),
    prisma.article.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    }),
  ]);
  return (
    <WorkspaceCanvas
      eyebrow="内容管理"
      title="喜欢记录"
      description="查看文章喜欢趋势并清理异常记录。"
      heroSlot={<Badge colorScheme="red">{total} 条喜欢</Badge>}
    >
      <LikeManager
        initial={{
          items: rows.map(({ visitorKeyHash, ...item }) => ({
            ...item,
            visitorHashMasked: maskVisitorHash(visitorKeyHash),
          })),
          total,
          page: 1,
          pageSize: 20,
        }}
        articles={articles}
      />
    </WorkspaceCanvas>
  );
}
