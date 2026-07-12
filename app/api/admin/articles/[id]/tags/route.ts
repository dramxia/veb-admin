export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { ensureTagIds } from '@/lib/content-data';
import { NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { tagIdsSchema } from '@/lib/validation';

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:tag:assign');
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      select: {
        tags: {
          orderBy: { tag: { name: 'asc' } },
          select: { tag: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
    if (!article) throw new NotFoundError('文章不存在');
    return ok(article.tags.map((item) => item.tag));
  },
);

export const PUT = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:tag:assign');
    const { tagIds: inputIds } = await readJson(request, tagIdsSchema);
    const tagIds = await ensureTagIds(inputIds);
    const exists = await prisma.article.count({ where: { id: params.id } });
    if (!exists) throw new NotFoundError('文章不存在');
    await prisma.$transaction(async (tx) => {
      await tx.articleTag.deleteMany({ where: { articleId: params.id } });
      if (tagIds.length)
        await tx.articleTag.createMany({
          data: tagIds.map((tagId) => ({ articleId: params.id, tagId })),
        });
    });
    return ok({ articleId: params.id, tagIds });
  },
  {
    action: 'article.tags.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
