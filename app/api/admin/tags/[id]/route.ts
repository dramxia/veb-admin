export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { createContentSlug, normalizeSlug } from '@/lib/content';
import { isPrismaUniqueError } from '@/lib/content-data';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { tagUpdateSchema } from '@/lib/validation';

const tagSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { articles: true } },
};

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:tag:view');
    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
      select: tagSelect,
    });
    if (!tag) throw new NotFoundError('标签不存在');
    const { _count, ...data } = tag;
    return ok({ ...data, articleCount: _count.articles });
  },
);

export const PATCH = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:tag:update');
    const data = await readJson(request, tagUpdateSchema);
    const current = await prisma.tag.findUnique({
      where: { id: params.id },
      select: { name: true },
    });
    if (!current) throw new NotFoundError('标签不存在');
    const slug =
      data.slug === undefined
        ? undefined
        : normalizeSlug(data.slug || '') ||
          createContentSlug(data.name || current.name, 'tag');
    try {
      const tag = await prisma.tag.update({
        where: { id: params.id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(slug !== undefined ? { slug } : {}),
        },
        select: tagSelect,
      });
      const { _count, ...result } = tag;
      return ok({ ...result, articleCount: _count.articles });
    } catch (error) {
      if (isPrismaUniqueError(error))
        throw new ConflictError('标签名称或 slug 已存在');
      throw error;
    }
  },
  {
    action: 'tag.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:tag:delete');
    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!tag) throw new NotFoundError('标签不存在');
    await prisma.tag.delete({ where: { id: params.id } });
    return ok({ id: params.id });
  },
  {
    action: 'tag.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
