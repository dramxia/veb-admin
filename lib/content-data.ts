import { ArticleStatus, type Prisma } from '@prisma/client';
import { NotFoundError, ParamError } from './errors';
import { prisma } from './prisma';

export const articleListSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, username: true, nickname: true } },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
    orderBy: { tag: { name: 'asc' } },
  },
  _count: { select: { likes: true } },
} satisfies Prisma.ArticleSelect;

export const articleDetailSelect = {
  ...articleListSelect,
  contentMarkdown: true,
} satisfies Prisma.ArticleSelect;

export function serializeArticle<
  T extends {
    tags: { tag: { id: string; name: string; slug: string } }[];
    _count: { likes: number };
  },
>(article: T) {
  const { _count, tags, ...rest } = article;
  return {
    ...rest,
    tags: tags.map((item) => item.tag),
    likeCount: _count.likes,
    commentCount: 0,
  };
}

export async function requirePublishedArticle(slug: string) {
  const article = await prisma.article.findFirst({
    where: {
      slug,
      status: ArticleStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
    },
    select: articleDetailSelect,
  });
  if (!article) throw new NotFoundError('文章不存在');
  return article;
}

export async function ensureTagIds(tagIds: string[]) {
  const uniqueIds = [...new Set(tagIds)];
  if (!uniqueIds.length) return uniqueIds;
  const count = await prisma.tag.count({ where: { id: { in: uniqueIds } } });
  if (count !== uniqueIds.length) throw new ParamError('包含不存在的标签');
  return uniqueIds;
}

export function parseOptionalDate(value: string | null, fieldName: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new ParamError(`${fieldName}格式无效`);
  return date;
}

export function isPrismaUniqueError(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'P2002',
  );
}
