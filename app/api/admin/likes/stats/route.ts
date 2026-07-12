export const dynamic = 'force-dynamic';

import type { Prisma } from '@prisma/client';
import { ok, withApi } from '@/lib/api';
import { parseOptionalDate } from '@/lib/content-data';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';

export const GET = withApi(async (request: Request) => {
  await requirePermission('content:like:stats');
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('articleId')?.trim();
  const defaultFrom = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
  const from =
    parseOptionalDate(searchParams.get('from'), '开始时间') || defaultFrom;
  const to =
    parseOptionalDate(searchParams.get('to'), '结束时间') || new Date();
  const where: Prisma.ArticleLikeWhereInput = {
    ...(articleId ? { articleId } : {}),
    createdAt: { gte: from, lte: to },
  };
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
    const key = item.createdAt.toISOString().slice(0, 10);
    trend.set(key, (trend.get(key) || 0) + 1);
  }
  return ok({
    total,
    from,
    to,
    articles: distribution.map((item) => ({
      ...articleMap.get(item.articleId),
      articleId: item.articleId,
      count: item._count._all,
    })),
    trend: [...trend].map(([date, count]) => ({ date, count })),
  });
});
