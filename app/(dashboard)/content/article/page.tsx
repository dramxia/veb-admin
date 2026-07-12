export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { articleListSelect, serializeArticle } from '@/lib/content-data';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { ArticleManager } from './article-manager';

export default async function ArticlePage() {
  await requirePermission('content:article:view');
  const [total, rows, tags, authors] = await Promise.all([
    prisma.article.count(),
    prisma.article.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: articleListSelect,
    }),
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.user.findMany({
      where: { articles: { some: {} } },
      orderBy: { username: 'asc' },
      select: { id: true, username: true, nickname: true },
    }),
  ]);
  return (
    <WorkspaceCanvas
      eyebrow="内容管理"
      title="文章管理"
      description="维护文章草稿、发布状态、标签和公开内容。"
      heroSlot={
        <HStack spacing={2}>
          <Badge colorScheme="brand">{total} 篇文章</Badge>
          <Badge colorScheme="gray">{tags.length} 个标签</Badge>
        </HStack>
      }
    >
      <ArticleManager
        initial={{
          items: rows.map(serializeArticle),
          total,
          page: 1,
          pageSize: 20,
        }}
        tags={tags}
        authors={authors}
      />
    </WorkspaceCanvas>
  );
}
