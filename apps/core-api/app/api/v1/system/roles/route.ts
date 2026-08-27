export const dynamic = 'force-dynamic';

import { roleListQuerySchema } from '@veb/api-contracts';
import {
  ok,
  pageOptions,
  readJson,
  readQuery,
  defineApiRoute,
} from '@/lib/api';
import { roleSchema } from '@/lib/validation';
import { createRole, listRoles } from '@/src/modules/roles/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:role:view' },
  async (request: Request) => {
    const query = readQuery(request, roleListQuerySchema);
    return ok(await listRoles({ ...query, ...pageOptions(query) }));
  },
);

export const POST = defineApiRoute(
  { access: 'private', permission: 'system:role:create' },
  async (request: Request) => {
    const data = await readJson(request, roleSchema);
    return ok(await createRole(data));
  },
  { action: 'role.create' },
);
