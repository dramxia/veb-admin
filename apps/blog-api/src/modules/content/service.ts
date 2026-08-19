import { ArticleStatus, Prisma, type PrismaClient } from '@/generated/prisma';
import {
  type ArticleUpdateInput,
  type InternalArticleCreateInput,
  type TagCreateInput,
  type TagUpdateInput,
  articleLikeSchema,
  likeStateSchema,
  likeStatsSchema,
  pageResultSchema,
} from '@veb/api-contracts';
import {
  ConflictError,
  isPrismaUniqueError,
  NotFoundError,
  ParamError,
  parseOutput,
} from '@veb/api-kit';
import { prisma } from '@/lib/prisma';
import {
  createContentSlug,
  maskVisitorHash,
  normalizeSlug,
  validatePublishableArticle,
} from '@/lib/content';
import {
  serializeAdminArticle,
  serializeAdminTag,
  serializePublicArticle,
  serializePublicTag,
} from './serializers';

const articleListSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  status: true,
  authorId: true,
  authorUsername: true,
  authorNickname: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
    orderBy: { tag: { name: 'asc' } },
  },
  _count: { select: { likes: true } },
} satisfies Prisma.ArticleSelect;

const articleDetailSelect = {
  ...articleListSelect,
  contentMarkdown: true,
} satisfies Prisma.ArticleSelect;

const tagSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { articles: true } },
} satisfies Prisma.TagSelect;

export type PageOptions = { page: number; pageSize: number; skip: number };

export type ArticleCreateCommand = InternalArticleCreateInput;
export type ArticleUpdateCommand = ArticleUpdateInput;
export type TagCreateCommand = TagCreateInput;
export type TagUpdateCommand = TagUpdateInput;

function publishedWhere(now = new Date()): Prisma.ArticleWhereInput {
  return { status: ArticleStatus.PUBLISHED, publishedAt: { lte: now } };
}

async function ensureTagIds(tagIds: string[] = []) {
  const uniqueIds = [...new Set(tagIds)];
  if (!uniqueIds.length) return uniqueIds;
  const count = await prisma.tag.count({ where: { id: { in: uniqueIds } } });
  if (count !== uniqueIds.length) throw new ParamError('包含不存在的标签');
  return uniqueIds;
}

async function requirePublishedArticle(slug: string) {
  const article = await prisma.article.findFirst({
    where: { slug: slug.toLowerCase(), ...publishedWhere() },
    select: articleDetailSelect,
  });
  if (!article) throw new NotFoundError('文章不存在');
  return article;
}

export async function listPublicArticles(page: PageOptions, tag?: string) {
  const where: Prisma.ArticleWhereInput = {
    ...publishedWhere(),
    ...(tag
      ? { tags: { some: { tag: { slug: tag.trim().toLowerCase() } } } }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      skip: page.skip,
      take: page.pageSize,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: articleListSelect,
    }),
  ]);
  return {
    items: items.map(serializePublicArticle),
    total,
    page: page.page,
    pageSize: page.pageSize,
  };
}

export async function getPublicArticle(slug: string) {
  return serializePublicArticle(await requirePublishedArticle(slug));
}

export async function listPublicTags() {
  const where: Prisma.TagWhereInput = {
    articles: { some: { article: publishedWhere() } },
  };
  const tags = await prisma.tag.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { articles: { where: { article: publishedWhere() } } },
      },
    },
  });
  return tags.map(serializePublicTag);
}

export async function getPublicTag(slug: string) {
  const tag = await prisma.tag.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { articles: { where: { article: publishedWhere() } } },
      },
    },
  });
  if (!tag || tag._count.articles === 0) {
    throw new NotFoundError('标签不存在');
  }
  return serializePublicTag(tag);
}

export async function getLikeState(articleId: string, visitorKeyHash?: string) {
  const [likeCount, liked] = await Promise.all([
    prisma.articleLike.count({ where: { articleId } }),
    visitorKeyHash
      ? prisma.articleLike.findUnique({
          where: { articleId_visitorKeyHash: { articleId, visitorKeyHash } },
          select: { id: true },
        })
      : null,
  ]);
  return parseOutput(likeStateSchema, { liked: Boolean(liked), likeCount });
}

export async function getPublishedArticleIdentity(slug: string) {
  const article = await requirePublishedArticle(slug);
  return { id: article.id };
}

export async function likeArticle(articleId: string, visitorKeyHash: string) {
  await prisma.articleLike.upsert({
    where: { articleId_visitorKeyHash: { articleId, visitorKeyHash } },
    update: {},
    create: { articleId, visitorKeyHash },
  });
  return getLikeState(articleId, visitorKeyHash);
}

export async function unlikeArticle(
  articleId: string,
  visitorKeyHash?: string,
) {
  if (visitorKeyHash) {
    await prisma.articleLike.deleteMany({
      where: { articleId, visitorKeyHash },
    });
  }
  return getLikeState(articleId, visitorKeyHash);
}

export async function listAdminArticles(
  page: PageOptions,
  filters: {
    keyword?: string;
    status?: string;
    tagId?: string;
    authorId?: string;
  },
) {
  if (
    filters.status &&
    !Object.values(ArticleStatus).includes(filters.status as ArticleStatus)
  ) {
    throw new ParamError('文章状态无效');
  }
  const where: Prisma.ArticleWhereInput = {
    ...(filters.keyword
      ? {
          OR: [
            { title: { contains: filters.keyword, mode: 'insensitive' } },
            { summary: { contains: filters.keyword, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(filters.status ? { status: filters.status as ArticleStatus } : {}),
    ...(filters.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}),
    ...(filters.authorId ? { authorId: filters.authorId } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      skip: page.skip,
      take: page.pageSize,
      orderBy: { createdAt: 'desc' },
      select: articleListSelect,
    }),
  ]);
  return {
    items: items.map(serializeAdminArticle),
    total,
    page: page.page,
    pageSize: page.pageSize,
  };
}

export async function listArticleAuthors() {
  const snapshots = await prisma.article.findMany({
    where: {
      authorId: { not: null },
      authorUsername: { not: null },
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      authorId: true,
      authorUsername: true,
      authorNickname: true,
    },
  });
  const authors = new Map<
    string,
    { id: string; username: string; nickname: string | null }
  >();
  for (const snapshot of snapshots) {
    if (!snapshot.authorId || !snapshot.authorUsername) continue;
    if (!authors.has(snapshot.authorId)) {
      authors.set(snapshot.authorId, {
        id: snapshot.authorId,
        username: snapshot.authorUsername,
        nickname: snapshot.authorNickname,
      });
    }
  }
  return {
    items: [...authors.values()].sort((left, right) =>
      left.username.localeCompare(right.username),
    ),
  };
}

export async function createArticle(input: ArticleCreateCommand) {
  validatePublishableArticle(input);
  const tagIds = await ensureTagIds(input.tagIds);
  const slug =
    normalizeSlug(input.slug || '') ||
    createContentSlug(input.title, 'article');
  try {
    const article = await prisma.article.create({
      data: {
        title: input.title,
        slug,
        summary: input.summary || null,
        contentMarkdown: input.contentMarkdown || '',
        status: input.status,
        authorId: input.author.id,
        authorUsername: input.author.username,
        authorNickname: input.author.nickname || null,
        publishedAt:
          input.status === ArticleStatus.PUBLISHED ? new Date() : null,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
      select: articleDetailSelect,
    });
    return serializeAdminArticle(article);
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      throw new ConflictError('文章 slug 已存在');
    }
    throw error;
  }
}

export async function getAdminArticle(id: string) {
  const article = await prisma.article.findUnique({
    where: { id },
    select: articleDetailSelect,
  });
  if (!article) throw new NotFoundError('文章不存在');
  return serializeAdminArticle(article);
}

export async function updateArticle(id: string, input: ArticleUpdateCommand) {
  const current = await prisma.article.findUnique({
    where: { id },
    select: {
      title: true,
      slug: true,
      summary: true,
      contentMarkdown: true,
      status: true,
    },
  });
  if (!current) throw new NotFoundError('文章不存在');
  const next = { ...current, ...input };
  validatePublishableArticle(next);
  const tagIds =
    input.tagIds === undefined ? undefined : await ensureTagIds(input.tagIds);
  const slug =
    input.slug === undefined
      ? undefined
      : normalizeSlug(input.slug || '') ||
        createContentSlug(next.title, 'article');
  try {
    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(input.summary !== undefined
          ? { summary: input.summary || null }
          : {}),
        ...(input.contentMarkdown !== undefined
          ? { contentMarkdown: input.contentMarkdown }
          : {}),
        ...(input.status !== undefined
          ? {
              status: input.status,
              publishedAt:
                input.status === ArticleStatus.DRAFT
                  ? null
                  : current.status === ArticleStatus.PUBLISHED
                    ? undefined
                    : new Date(),
            }
          : {}),
        ...(tagIds !== undefined
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      select: articleDetailSelect,
    });
    return serializeAdminArticle(article);
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      throw new ConflictError('文章 slug 已存在');
    }
    throw error;
  }
}

export async function deleteArticle(id: string) {
  const result = await prisma.article.deleteMany({ where: { id } });
  if (!result.count) throw new NotFoundError('文章不存在');
  return { id };
}

export async function getArticleTags(id: string) {
  const article = await prisma.article.findUnique({
    where: { id },
    select: {
      tags: {
        orderBy: { tag: { name: 'asc' } },
        select: { tag: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  if (!article) throw new NotFoundError('文章不存在');
  return article.tags.map(({ tag }) => tag);
}

export async function replaceArticleTags(id: string, inputIds: string[]) {
  const tagIds = await ensureTagIds(inputIds);
  if (!(await prisma.article.count({ where: { id } }))) {
    throw new NotFoundError('文章不存在');
  }
  await prisma.$transaction(async (transaction) => {
    await transaction.articleTag.deleteMany({ where: { articleId: id } });
    if (tagIds.length) {
      await transaction.articleTag.createMany({
        data: tagIds.map((tagId) => ({ articleId: id, tagId })),
      });
    }
  });
  return { articleId: id, tagIds };
}

export async function listAdminTags(page: PageOptions, keyword?: string) {
  const where: Prisma.TagWhereInput = keyword
    ? {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { slug: { contains: keyword, mode: 'insensitive' } },
        ],
      }
    : {};
  const [total, items] = await Promise.all([
    prisma.tag.count({ where }),
    prisma.tag.findMany({
      where,
      skip: page.skip,
      take: page.pageSize,
      orderBy: { name: 'asc' },
      select: tagSelect,
    }),
  ]);
  return {
    items: items.map(serializeAdminTag),
    total,
    page: page.page,
    pageSize: page.pageSize,
  };
}

export async function createTag(input: TagCreateCommand) {
  const slug =
    normalizeSlug(input.slug || '') || createContentSlug(input.name, 'tag');
  try {
    const tag = await prisma.tag.create({
      data: { name: input.name, slug },
      select: tagSelect,
    });
    return serializeAdminTag(tag);
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      throw new ConflictError('标签名称或 slug 已存在');
    }
    throw error;
  }
}

export async function getAdminTag(id: string) {
  const tag = await prisma.tag.findUnique({ where: { id }, select: tagSelect });
  if (!tag) throw new NotFoundError('标签不存在');
  return serializeAdminTag(tag);
}

export async function updateTag(id: string, input: TagUpdateCommand) {
  const current = await prisma.tag.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!current) throw new NotFoundError('标签不存在');
  const slug =
    input.slug === undefined
      ? undefined
      : normalizeSlug(input.slug || '') ||
        createContentSlug(input.name || current.name, 'tag');
  try {
    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(slug !== undefined ? { slug } : {}),
      },
      select: tagSelect,
    });
    return serializeAdminTag(tag);
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      throw new ConflictError('标签名称或 slug 已存在');
    }
    throw error;
  }
}

export async function deleteTag(id: string) {
  const result = await prisma.tag.deleteMany({ where: { id } });
  if (!result.count) throw new NotFoundError('标签不存在');
  return { id };
}

export async function listTagArticles(id: string, page: PageOptions) {
  if (!(await prisma.tag.count({ where: { id } }))) {
    throw new NotFoundError('标签不存在');
  }
  const where: Prisma.ArticleWhereInput = { tags: { some: { tagId: id } } };
  const [total, items] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      skip: page.skip,
      take: page.pageSize,
      orderBy: { createdAt: 'desc' },
      select: articleListSelect,
    }),
  ]);
  return {
    items: items.map(serializeAdminArticle),
    total,
    page: page.page,
    pageSize: page.pageSize,
  };
}

type LikeFilters = {
  articleId?: string;
  keyword?: string;
  from?: Date;
  to?: Date;
};

function likeWhere(filters: LikeFilters): Prisma.ArticleLikeWhereInput {
  return {
    ...(filters.articleId ? { articleId: filters.articleId } : {}),
    ...(filters.keyword
      ? {
          OR: [
            { visitorKeyHash: { contains: filters.keyword } },
            {
              article: {
                title: { contains: filters.keyword, mode: 'insensitive' },
              },
            },
          ],
        }
      : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };
}

const likeSelect = {
  id: true,
  articleId: true,
  visitorKeyHash: true,
  createdAt: true,
  article: { select: { title: true, slug: true } },
} satisfies Prisma.ArticleLikeSelect;

function serializeLike<
  T extends {
    visitorKeyHash: string;
    createdAt: Date;
  },
>(like: T) {
  const { visitorKeyHash, createdAt, ...data } = like;
  return parseOutput(articleLikeSchema, {
    ...data,
    createdAt: createdAt.toISOString(),
    visitorHashMasked: maskVisitorHash(visitorKeyHash),
  });
}

export async function listLikes(page: PageOptions, filters: LikeFilters) {
  const where = likeWhere(filters);
  const [total, items] = await Promise.all([
    prisma.articleLike.count({ where }),
    prisma.articleLike.findMany({
      where,
      skip: page.skip,
      take: page.pageSize,
      orderBy: { createdAt: 'desc' },
      select: likeSelect,
    }),
  ]);
  return parseOutput(pageResultSchema(articleLikeSchema), {
    items: items.map(serializeLike),
    total,
    page: page.page,
    pageSize: page.pageSize,
  });
}

export async function getLike(id: string) {
  const like = await prisma.articleLike.findUnique({
    where: { id },
    select: likeSelect,
  });
  if (!like) throw new NotFoundError('喜欢记录不存在');
  return serializeLike(like);
}

export async function deleteLike(id: string) {
  const result = await prisma.articleLike.deleteMany({ where: { id } });
  if (!result.count) throw new NotFoundError('喜欢记录不存在');
  return { id };
}

export async function batchDeleteLikes(ids: string[]) {
  const result = await prisma.articleLike.deleteMany({
    where: { id: { in: [...new Set(ids)] } },
  });
  return { count: result.count };
}

export async function getLikeStats(filters: {
  articleId?: string;
  from: Date;
  to: Date;
}) {
  const where = likeWhere(filters);
  const [total, distribution, dates] = await Promise.all([
    prisma.articleLike.count({ where }),
    prisma.articleLike.groupBy({
      by: ['articleId'],
      where,
      _count: { _all: true },
      orderBy: { _count: { articleId: 'desc' } },
    }),
    prisma.articleLike.findMany({
      where,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  const articles = await prisma.article.findMany({
    where: { id: { in: distribution.map((item) => item.articleId) } },
    select: { id: true, title: true, slug: true },
  });
  const articleMap = new Map(articles.map((article) => [article.id, article]));
  const trend = new Map<string, number>();
  for (const item of dates) {
    const date = item.createdAt.toISOString().slice(0, 10);
    trend.set(date, (trend.get(date) || 0) + 1);
  }
  return parseOutput(likeStatsSchema, {
    total,
    from: filters.from.toISOString(),
    to: filters.to.toISOString(),
    articles: distribution.map((item) => ({
      ...articleMap.get(item.articleId),
      articleId: item.articleId,
      count: item._count._all,
    })),
    trend: [...trend].map(([date, count]) => ({ date, count })),
  });
}

export async function checkDatabaseReady(client: PrismaClient = prisma) {
  await client.$queryRaw`SELECT 1`;
}
