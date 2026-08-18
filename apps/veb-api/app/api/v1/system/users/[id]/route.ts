export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { userUpdateSchema } from '@/lib/validation';
import { deleteUser, getUser, updateUser } from '@/src/modules/users/service';

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:user:view');
    return ok(await getUser(params.id));
  },
);

export const PATCH = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:user:update');
    const data = await readJson(request, userUpdateSchema);
    return ok(await updateUser(params.id, data));
  },
  {
    action: 'user.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:user:delete');
    return ok(await deleteUser(params.id));
  },
  {
    action: 'user.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
