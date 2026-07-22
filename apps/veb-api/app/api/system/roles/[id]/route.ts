export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { roleUpdateSchema } from '@/lib/validation';
import { deleteRole, getRole, updateRole } from '@/src/modules/roles/service';

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:role:view');
    return ok(await getRole(params.id));
  },
);

export const PATCH = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:role:update');
    const data = await readJson(request, roleUpdateSchema);
    return ok(await updateRole(params.id, data));
  },
  {
    action: 'role.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:role:delete');
    return ok(await deleteRole(params.id));
  },
  {
    action: 'role.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
