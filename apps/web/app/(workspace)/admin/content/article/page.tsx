export const dynamic = 'force-dynamic';

import { Badge, HStack } from '@chakra-ui/react';
import type {
  AdminArticleListItem,
  AdminTag,
  PageResult,
} from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import type { ContentAuthor } from '@/components/content/admin-types';
import { requestVebPage } from '@/lib/server-api';
import { ArticleManager } from './article-manager';

export default async function ArticlePage() {
  const [articles, tagPage, authorPayload] = await Promise.all([
    requestVebPage<PageResult<AdminArticleListItem>>(
      '/api/v1/blog/articles?pageSize=20',
    ),
    requestVebPage<PageResult<AdminTag>>('/api/v1/blog/tags?pageSize=100'),
    requestVebPage<{ items: ContentAuthor[] }>('/api/v1/blog/articles/authors'),
  ]);
  const tags = tagPage.items;
  const authors = authorPayload.items;
  return (
    <WorkspaceCanvas
      eyebrow="内容管理"
      title="文章管理"
      description="维护文章草稿、发布状态、标签和公开内容。"
      heroSlot={
        <HStack spacing={2}>
          <Badge colorScheme="brand">{articles.total} 篇文章</Badge>
          <Badge colorScheme="gray">{tags.length} 个标签</Badge>
        </HStack>
      }
    >
      <ArticleManager initial={articles} tags={tags} authors={authors} />
    </WorkspaceCanvas>
  );
}
