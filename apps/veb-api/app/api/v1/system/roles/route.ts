export const dynamic = 'force-dynamic';

import { roleListQuerySchema } from '@veb/api-contracts';
import { ok, pageOptions, readJson, readQuery, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { roleSchema } from '@/lib/validation';
import { createRole, listRoles } from '@/src/modules/roles/service';

export const GET = withApi(async (request: Request) => {
  await requirePermission('system:role:view');
  const query = readQuery(request, roleListQuerySchema);
  return ok(await listRoles({ ...query, ...pageOptions(query) }));
});

export const POST = withApi(
  async (request: Request) => {
    await requirePermission('system:role:create');
    const data = await readJson(request, roleSchema);
    return ok(await createRole(data));
  },
  { action: 'role.create' },
);
