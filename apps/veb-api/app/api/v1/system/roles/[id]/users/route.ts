export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { assignUsersSchema } from '@/lib/validation';
import {
  assignRoleUsers,
  getRoleUserAssignmentDetail,
} from '@/src/modules/roles/service';

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:role:assign-user');
    return ok(await getRoleUserAssignmentDetail(params.id));
  },
);

export const POST = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    const actor = await requirePermission('system:role:assign-user');
    const data = await readJson(request, assignUsersSchema);
    return ok(await assignRoleUsers(actor.id, params.id, data.userIds));
  },
  {
    action: 'role.assign-user',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
