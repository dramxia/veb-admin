export const dynamic = 'force-dynamic';

import { ok, readJson, defineApiRoute } from '@/lib/api';
import { roleUpdateSchema } from '@/lib/validation';
import { deleteRole, getRole, updateRole } from '@/src/modules/roles/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:role:view' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await getRole(params.id));
  },
);

export const PATCH = defineApiRoute(
  { access: 'private', permission: 'system:role:update' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const data = await readJson(request, roleUpdateSchema);
    return ok(await updateRole(params.id, data));
  },
  {
    action: 'role.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = defineApiRoute(
  { access: 'private', permission: 'system:role:delete' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await deleteRole(params.id));
  },
  {
    action: 'role.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
