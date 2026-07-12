export const dynamic = 'force-dynamic';

import { ArticleStatus, type Prisma } from '@prisma/client';
import { ok, parsePage, readJson, withApi } from '@/lib/api';
import {
  createContentSlug,
  normalizeSlug,
  validatePublishableArticle,
} from '@/lib/content';
import {
  articleListSelect,
  ensureTagIds,
  isPrismaUniqueError,
  serializeArticle,
} from '@/lib/content-data';
import { ConflictError, ParamError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { articleCreateSchema } from '@/lib/validation';

export const GET = withApi(async (request: Request) => {
  await requirePermission('content:article:view');
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip } = parsePage(searchParams);
  const keyword = searchParams.get('keyword')?.trim();
  const status = searchParams.get('status');
  const tagId = searchParams.get('tagId')?.trim();
  const authorId = searchParams.get('authorId')?.trim();
  if (status && !Object.values(ArticleStatus).includes(status as ArticleStatus))
    throw new ParamError('文章状态无效');
  const where: Prisma.ArticleWhereInput = {
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { summary: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(status ? { status: status as ArticleStatus } : {}),
    ...(tagId ? { tags: { some: { tagId } } } : {}),
    ...(authorId ? { authorId } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: articleListSelect,
    }),
  ]);
  return ok({ items: items.map(serializeArticle), total, page, pageSize });
});

export const POST = withApi(
  async (request: Request) => {
    const user = await requirePermission('content:article:create');
    const data = await readJson(request, articleCreateSchema);
    if (data.status === ArticleStatus.PUBLISHED)
      await requirePermission('content:article:publish');
    validatePublishableArticle(data);
    const tagIds = await ensureTagIds(data.tagIds);
    const slug =
      normalizeSlug(data.slug || '') ||
      createContentSlug(data.title, 'article');
    try {
      const article = await prisma.article.create({
        data: {
          title: data.title,
          slug,
          summary: data.summary || null,
          contentMarkdown: data.contentMarkdown || '',
          status: data.status,
          authorId: user.id,
          publishedAt:
            data.status === ArticleStatus.PUBLISHED ? new Date() : null,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
        select: articleListSelect,
      });
      return ok(serializeArticle(article));
    } catch (error) {
      if (isPrismaUniqueError(error))
        throw new ConflictError('文章 slug 已存在');
      throw error;
    }
  },
  { action: 'article.create' },
);
