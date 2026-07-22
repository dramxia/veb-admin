import {
  adminArticleDetailSchema,
  adminArticleListItemSchema,
  adminTagSchema,
  publicArticleDetailSchema,
  publicArticleListItemSchema,
  publicTagSchema,
} from '@veb/api-contracts';
import { parseOutput } from '@/lib/contracts';

type TagRecord = {
  id: string;
  name: string;
  slug: string;
};

type ArticleRecord = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  authorId: string | null;
  authorUsername: string | null;
  authorNickname: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contentMarkdown?: string;
  tags: { tag: TagRecord }[];
  _count: { likes: number };
};

function adminAuthor(article: ArticleRecord) {
  if (!article.authorId || !article.authorUsername) {
    return null;
  }
  return {
    id: article.authorId,
    username: article.authorUsername,
    nickname: article.authorNickname,
  };
}

export function serializeAdminArticle(article: ArticleRecord) {
  const base = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    status: article.status,
    author: adminAuthor(article),
    publishedAt: article.publishedAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    tags: article.tags.map(({ tag }) => tag),
    likeCount: article._count.likes,
    commentCount: 0,
  };
  return article.contentMarkdown === undefined
    ? parseOutput(adminArticleListItemSchema, base)
    : parseOutput(adminArticleDetailSchema, {
        ...base,
        contentMarkdown: article.contentMarkdown,
      });
}

export function serializePublicArticle(article: ArticleRecord) {
  if (!article.publishedAt) {
    throw new Error('Published article is missing publishedAt');
  }
  const base = {
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    authorNickname: article.authorNickname,
    publishedAt: article.publishedAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    tags: article.tags.map(({ tag }) => ({ name: tag.name, slug: tag.slug })),
    likeCount: article._count.likes,
    commentCount: 0,
  };
  return article.contentMarkdown === undefined
    ? parseOutput(publicArticleListItemSchema, base)
    : parseOutput(publicArticleDetailSchema, {
        ...base,
        contentMarkdown: article.contentMarkdown,
      });
}

export function serializeAdminTag(
  tag: TagRecord & {
    createdAt: Date;
    updatedAt: Date;
    _count: { articles: number };
  },
) {
  const { _count, ...data } = tag;
  return parseOutput(adminTagSchema, {
    ...data,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    articleCount: _count.articles,
  });
}

export function serializePublicTag(
  tag: TagRecord & { _count: { articles: number } },
) {
  return parseOutput(publicTagSchema, {
    name: tag.name,
    slug: tag.slug,
    articleCount: tag._count.articles,
  });
}
