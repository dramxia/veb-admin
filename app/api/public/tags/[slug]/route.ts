export const dynamic = 'force-dynamic';

import { ArticleStatus } from '@prisma/client';
import { ok, withApi } from '@/lib/api';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export const GET = withApi(
  async (_request: Request, { params }: { params: { slug: string } }) => {
    const tag = await prisma.tag.findUnique({
      where: { slug: params.slug.toLowerCase() },
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
    if (!tag || tag._count.articles === 0)
      throw new NotFoundError('标签不存在');
    const { _count, ...data } = tag;
    return ok({ ...data, articleCount: _count.articles });
  },
);
