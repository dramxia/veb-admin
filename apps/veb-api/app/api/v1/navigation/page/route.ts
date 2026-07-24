export const dynamic = 'force-dynamic';

import { pageAccessQuerySchema } from '@veb/api-contracts';
import { ok, readQuery, withApi } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { resolveUserPage } from '@/src/modules/navigation/service';

export const GET = withApi(async (request: Request) => {
  const user = await requireUser();
  const { path } = readQuery(request, pageAccessQuerySchema);
  return ok(await resolveUserPage(user.id, path));
});
