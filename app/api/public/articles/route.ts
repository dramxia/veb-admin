export const dynamic = 'force-dynamic';

import { ArticleStatus, type Prisma } from '@prisma/client';
import { ok, parsePage, withApi } from '@/lib/api';
import { articleListSelect, serializeArticle } from '@/lib/content-data';
import { prisma } from '@/lib/prisma';

export const GET = withApi(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const { page, skip } = parsePage(searchParams);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(searchParams.get('pageSize') ?? 10)),
  );
  const tag = searchParams.get('tag')?.trim().toLowerCase();
  const where: Prisma.ArticleWhereInput = {
    status: ArticleStatus.PUBLISHED,
    publishedAt: { lte: new Date() },
    ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: articleListSelect,
    }),
  ]);
  return ok({ items: items.map(serializeArticle), total, page, pageSize });
});
