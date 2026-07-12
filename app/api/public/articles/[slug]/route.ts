export const dynamic = 'force-dynamic';

import { ok, withApi } from '@/lib/api';
import { requirePublishedArticle, serializeArticle } from '@/lib/content-data';

export const GET = withApi(
  async (_request: Request, { params }: { params: { slug: string } }) => {
    return ok(serializeArticle(await requirePublishedArticle(params.slug)));
  },
);
