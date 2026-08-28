export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type {
  AdminArticleDetail,
  AdminTag,
  PageResult,
} from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { isServerApiError, requestCorePage } from '@/lib/server-api';
import { ArticleEditor } from '../../article-editor';

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  let article: AdminArticleDetail;
  try {
    [article] = await Promise.all([
      requestCorePage<AdminArticleDetail>(
        `/api/v1/blog/manage/articles/${encodeURIComponent(params.id)}`,
      ),
    ]);
  } catch (error) {
    if (isServerApiError(error, 404)) notFound();
    throw error;
  }
  const { items: tags } = await requestCorePage<PageResult<AdminTag>>(
    '/api/v1/blog/manage/tags?pageSize=100',
  );
  return (
    <WorkspaceCanvas
      fillHeight
      eyebrow="内容管理"
      title="编辑文章"
      description="更新正文、标签和公开状态。"
    >
      <ArticleEditor article={article} tags={tags} />
    </WorkspaceCanvas>
  );
}
