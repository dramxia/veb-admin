export const dynamic = 'force-dynamic';

import { pageAccessQuerySchema } from '@veb/api-contracts';
import { ok, readQuery, defineApiRoute } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/session';
import { resolveUserPage } from '@/src/modules/navigation/service';

export const GET = defineApiRoute(
  { access: 'private' },
  async (request: Request) => {
    const user = getAuthenticatedUser();
    const { path } = readQuery(request, pageAccessQuerySchema);
    return ok(await resolveUserPage(user.id, path));
  },
);
