export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { assignRolesSchema } from '@/lib/validation';
import { assignUserRoles } from '@/src/modules/users/service';

export const POST = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    const actor = await requirePermission('system:user:assign-role');
    const data = await readJson(request, assignRolesSchema);
    return ok(await assignUserRoles(actor.id, params.id, data.roleIds));
  },
  {
    action: 'user.assign-role',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
