export const dynamic = 'force-dynamic';

import { ok, withApi } from '@/lib/api';
import { maskVisitorHash } from '@/lib/content';
import { NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';

const select = {
  id: true,
  articleId: true,
  visitorKeyHash: true,
  createdAt: true,
  article: { select: { title: true, slug: true } },
};

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:like:view');
    const like = await prisma.articleLike.findUnique({
      where: { id: params.id },
      select,
    });
    if (!like) throw new NotFoundError('喜欢记录不存在');
    const { visitorKeyHash, ...data } = like;
    return ok({ ...data, visitorHashMasked: maskVisitorHash(visitorKeyHash) });
  },
);

export const DELETE = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:like:delete');
    const like = await prisma.articleLike.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!like) throw new NotFoundError('喜欢记录不存在');
    await prisma.articleLike.delete({ where: { id: params.id } });
    return ok({ id: params.id });
  },
  {
    action: 'article-like.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
