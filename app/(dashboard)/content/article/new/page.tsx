export const dynamic = 'force-dynamic';

import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { ArticleEditor } from '../article-editor';

export default async function NewArticlePage() {
  await requirePermission('content:article:create');
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });
  return (
    <WorkspaceCanvas
      eyebrow="内容管理"
      title="新增文章"
      description="编写 Markdown 内容并保存为草稿或直接发布。"
    >
      <ArticleEditor tags={tags} />
    </WorkspaceCanvas>
  );
}
