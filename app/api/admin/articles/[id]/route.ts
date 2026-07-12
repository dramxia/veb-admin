export const dynamic = 'force-dynamic';

import { ArticleStatus } from '@prisma/client';
import { ok, readJson, withApi } from '@/lib/api';
import {
  createContentSlug,
  normalizeSlug,
  validatePublishableArticle,
} from '@/lib/content';
import {
  articleDetailSelect,
  ensureTagIds,
  isPrismaUniqueError,
  serializeArticle,
} from '@/lib/content-data';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { articleUpdateSchema } from '@/lib/validation';

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:article:view');
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      select: articleDetailSelect,
    });
    if (!article) throw new NotFoundError('文章不存在');
    return ok(serializeArticle(article));
  },
);

export const PATCH = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:article:update');
    const data = await readJson(request, articleUpdateSchema);
    const current = await prisma.article.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        slug: true,
        summary: true,
        contentMarkdown: true,
        status: true,
      },
    });
    if (!current) throw new NotFoundError('文章不存在');
    const next = { ...current, ...data };
    if (
      current.status !== ArticleStatus.PUBLISHED &&
      next.status === ArticleStatus.PUBLISHED
    ) {
      await requirePermission('content:article:publish');
    }
    validatePublishableArticle(next);
    const tagIds =
      data.tagIds === undefined ? undefined : await ensureTagIds(data.tagIds);
    const slug =
      data.slug === undefined
        ? undefined
        : normalizeSlug(data.slug || '') ||
          createContentSlug(next.title, 'article');
    try {
      const article = await prisma.article.update({
        where: { id: params.id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(slug !== undefined ? { slug } : {}),
          ...(data.summary !== undefined
            ? { summary: data.summary || null }
            : {}),
          ...(data.contentMarkdown !== undefined
            ? { contentMarkdown: data.contentMarkdown }
            : {}),
          ...(data.status !== undefined
            ? {
                status: data.status,
                publishedAt:
                  data.status === ArticleStatus.DRAFT
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
      return ok(serializeArticle(article));
    } catch (error) {
      if (isPrismaUniqueError(error))
        throw new ConflictError('文章 slug 已存在');
      throw error;
    }
  },
  {
    action: 'article.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:article:delete');
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!article) throw new NotFoundError('文章不存在');
    await prisma.article.delete({ where: { id: params.id } });
    return ok({ id: params.id });
  },
  {
    action: 'article.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
