export const dynamic = 'force-dynamic';

import { ok, readJson, defineApiRoute } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/session';
import { assignRolesSchema } from '@/lib/validation';
import { assignUserRoles } from '@/src/modules/users/service';

export const POST = defineApiRoute(
  { access: 'private', permission: 'system:user:assign-role' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const actor = getAuthenticatedUser();
    const data = await readJson(request, assignRolesSchema);
    return ok(await assignUserRoles(actor.id, params.id, data.roleIds));
  },
  {
    action: 'user.assign-role',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
