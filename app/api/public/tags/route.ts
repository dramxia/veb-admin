export const dynamic = 'force-dynamic';

import { ArticleStatus } from '@prisma/client';
import { ok, withApi } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const GET = withApi(async () => {
  const tags = await prisma.tag.findMany({
    where: {
      articles: {
        some: {
          article: {
            status: ArticleStatus.PUBLISHED,
            publishedAt: { lte: new Date() },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          articles: {
            where: {
              article: {
                status: ArticleStatus.PUBLISHED,
                publishedAt: { lte: new Date() },
              },
            },
          },
        },
      },
    },
  });
  return ok(
    tags.map(({ _count, ...tag }) => ({
      ...tag,
      articleCount: _count.articles,
    })),
  );
});
