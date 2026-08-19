export const dynamic = 'force-dynamic';

import { userListQuerySchema } from '@veb/api-contracts';
import { ok, pageOptions, readJson, readQuery, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { userCreateSchema } from '@/lib/validation';
import { createUser, listUsers } from '@/src/modules/users/service';

export const GET = withApi(async (request: Request) => {
  await requirePermission('system:user:view');
  const query = readQuery(request, userListQuerySchema);
  return ok(await listUsers({ ...query, ...pageOptions(query) }));
});

export const POST = withApi(
  async (request: Request) => {
    const actor = await requirePermission('system:user:create');
    const data = await readJson(request, userCreateSchema);

    return ok(await createUser(actor.id, data));
  },
  { action: 'user.create' },
);
