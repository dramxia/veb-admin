export const dynamic = 'force-dynamic';

import { ok, readJson, defineApiRoute } from '@/lib/api';
import { userUpdateSchema } from '@/lib/validation';
import { deleteUser, getUser, updateUser } from '@/src/modules/users/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:user:view' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await getUser(params.id));
  },
);

export const PATCH = defineApiRoute(
  { access: 'private', permission: 'system:user:update' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const data = await readJson(request, userUpdateSchema);
    return ok(await updateUser(params.id, data));
  },
  {
    action: 'user.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = defineApiRoute(
  { access: 'private', permission: 'system:user:delete' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await deleteUser(params.id));
  },
  {
    action: 'user.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
