export const dynamic = 'force-dynamic';

import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import type { AdminTag, PageResult } from '@veb/api-contracts';
import { requestVebPage } from '@/lib/server-api';
import { ArticleEditor } from '../article-editor';

export default async function NewArticlePage() {
  const { items: tags } = await requestVebPage<PageResult<AdminTag>>(
    '/api/v1/blog/tags?pageSize=100',
  );
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
