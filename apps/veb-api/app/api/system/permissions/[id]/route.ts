export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { permissionUpdateSchema } from '@/lib/validation';
import {
  deletePermission,
  getPermission,
  updatePermission,
} from '@/src/modules/permissions/service';

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:permission:view');
    return ok(await getPermission(params.id));
  },
);

export const PATCH = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:permission:update');
    const data = await readJson(request, permissionUpdateSchema);
    return ok(await updatePermission(params.id, data));
  },
  {
    action: 'permission.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:permission:delete');
    return ok(await deletePermission(params.id));
  },
  {
    action: 'permission.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
