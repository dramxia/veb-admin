export const dynamic = 'force-dynamic';

import type { Prisma } from '@prisma/client';
import { ok, parsePage, readJson, withApi } from '@/lib/api';
import { createContentSlug, normalizeSlug } from '@/lib/content';
import { isPrismaUniqueError } from '@/lib/content-data';
import { ConflictError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { tagSchema } from '@/lib/validation';

const tagSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { articles: true } },
} satisfies Prisma.TagSelect;

export const GET = withApi(async (request: Request) => {
  await requirePermission('content:tag:view');
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip } = parsePage(searchParams);
  const keyword = searchParams.get('keyword')?.trim();
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
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
      select: tagSelect,
    }),
  ]);
  return ok({
    items: items.map(({ _count, ...tag }) => ({
      ...tag,
      articleCount: _count.articles,
    })),
    total,
    page,
    pageSize,
  });
});

export const POST = withApi(
  async (request: Request) => {
    await requirePermission('content:tag:create');
    const data = await readJson(request, tagSchema);
    const slug =
      normalizeSlug(data.slug || '') || createContentSlug(data.name, 'tag');
    try {
      const tag = await prisma.tag.create({
        data: { name: data.name, slug },
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
  { action: 'tag.create' },
);
