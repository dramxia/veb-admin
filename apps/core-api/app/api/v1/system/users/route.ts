export const dynamic = 'force-dynamic';

import { userListQuerySchema } from '@veb/api-contracts';
import {
  ok,
  pageOptions,
  readJson,
  readQuery,
  defineApiRoute,
} from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/session';
import { userCreateSchema } from '@/lib/validation';
import { createUser, listUsers } from '@/src/modules/users/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:user:view' },
  async (request: Request) => {
    const query = readQuery(request, userListQuerySchema);
    return ok(await listUsers({ ...query, ...pageOptions(query) }));
  },
);

export const POST = defineApiRoute(
  { access: 'private', permission: 'system:user:create' },
  async (request: Request) => {
    const actor = getAuthenticatedUser();
    const data = await readJson(request, userCreateSchema);

    return ok(await createUser(actor.id, data));
  },
  { action: 'user.create' },
);
