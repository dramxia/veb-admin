export const dynamic = 'force-dynamic';

import { Badge } from '@chakra-ui/react';
import type {
  AdminArticleListItem,
  ArticleLike,
  PageResult,
} from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { requestVebPage } from '@/lib/server-api';
import { LikeManager } from './like-manager';

export default async function LikePage() {
  const [likes, articlePage] = await Promise.all([
    requestVebPage<PageResult<ArticleLike>>('/api/v1/blog/likes?pageSize=20'),
    requestVebPage<PageResult<AdminArticleListItem>>(
      '/api/v1/blog/articles?pageSize=100',
    ),
  ]);
  const articles = articlePage.items.map(({ id, title }) => ({ id, title }));
  return (
    <WorkspaceCanvas
      eyebrow="内容管理"
      title="喜欢记录"
      description="查看文章喜欢趋势并清理异常记录。"
      heroSlot={<Badge colorScheme="red">{likes.total} 条喜欢</Badge>}
    >
      <LikeManager initial={likes} articles={articles} />
    </WorkspaceCanvas>
  );
}
