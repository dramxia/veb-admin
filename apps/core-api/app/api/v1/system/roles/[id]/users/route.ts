export const dynamic = 'force-dynamic';

import { ok, readJson, defineApiRoute } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/session';
import { assignUsersSchema } from '@/lib/validation';
import {
  assignRoleUsers,
  getRoleUserAssignmentDetail,
} from '@/src/modules/roles/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:role:assign-user' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await getRoleUserAssignmentDetail(params.id));
  },
);

export const POST = defineApiRoute(
  { access: 'private', permission: 'system:role:assign-user' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const actor = getAuthenticatedUser();
    const data = await readJson(request, assignUsersSchema);
    return ok(await assignRoleUsers(actor.id, params.id, data.userIds));
  },
  {
    action: 'role.assign-user',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
