export const dynamic = 'force-dynamic';

import { ok, parsePage, withApi } from '@/lib/api';
import { articleListSelect, serializeArticle } from '@/lib/content-data';
import { NotFoundError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';

export const GET = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('content:tag:view');
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = parsePage(searchParams);
    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!tag) throw new NotFoundError('标签不存在');
    const where = { tags: { some: { tagId: params.id } } };
    const [total, items] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: articleListSelect,
      }),
    ]);
    return ok({ items: items.map(serializeArticle), total, page, pageSize });
  },
);
