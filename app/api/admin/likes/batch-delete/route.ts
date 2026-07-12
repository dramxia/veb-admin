export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';
import { likeBatchDeleteSchema } from '@/lib/validation';

export const POST = withApi(
  async (request: Request) => {
    await requirePermission('content:like:delete');
    const { ids } = await readJson(request, likeBatchDeleteSchema);
    const result = await prisma.articleLike.deleteMany({
      where: { id: { in: [...new Set(ids)] } },
    });
    return ok({ count: result.count });
  },
  { action: 'article-like.batch-delete' },
);
