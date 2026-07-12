export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { articleDetailSelect, serializeArticle } from '@/lib/content-data';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { ArticleEditor } from '../../article-editor';

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  await requirePermission('content:article:update');
  const [row, tags] = await Promise.all([
    prisma.article.findUnique({
      where: { id: params.id },
      select: articleDetailSelect,
    }),
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  if (!row) notFound();
  return (
    <WorkspaceCanvas
      eyebrow="内容管理"
      title="编辑文章"
      description="更新正文、标签和公开状态。"
    >
      <ArticleEditor article={serializeArticle(row)} tags={tags} />
    </WorkspaceCanvas>
  );
}
