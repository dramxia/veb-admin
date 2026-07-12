export const dynamic = 'force-dynamic';

import type { Prisma } from '@prisma/client';
import { ok, parsePage, withApi } from '@/lib/api';
import { maskVisitorHash } from '@/lib/content';
import { parseOptionalDate } from '@/lib/content-data';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';

export const GET = withApi(async (request: Request) => {
  await requirePermission('content:like:view');
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip } = parsePage(searchParams);
  const articleId = searchParams.get('articleId')?.trim();
  const keyword = searchParams.get('keyword')?.trim();
  const from = parseOptionalDate(searchParams.get('from'), '开始时间');
  const to = parseOptionalDate(searchParams.get('to'), '结束时间');
  const where: Prisma.ArticleLikeWhereInput = {
    ...(articleId ? { articleId } : {}),
    ...(keyword
      ? {
          OR: [
            { visitorKeyHash: { contains: keyword } },
            { article: { title: { contains: keyword, mode: 'insensitive' } } },
          ],
        }
      : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.articleLike.count({ where }),
    prisma.articleLike.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        articleId: true,
        visitorKeyHash: true,
        createdAt: true,
        article: { select: { title: true, slug: true } },
      },
    }),
  ]);
  return ok({
    items: items.map(({ visitorKeyHash, ...item }) => ({
      ...item,
      visitorHashMasked: maskVisitorHash(visitorKeyHash),
    })),
    total,
    page,
    pageSize,
  });
});
