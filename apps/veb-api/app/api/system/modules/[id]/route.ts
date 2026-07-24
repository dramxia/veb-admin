export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { appModuleUpdateSchema } from '@/lib/validation';
import {
  deleteAppModule,
  getAppModule,
  updateAppModule,
} from '@/src/modules/modules/service';

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:module:view');
    return ok(await getAppModule(params.id));
  },
);

export const PATCH = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:module:update');
    const data = await readJson(request, appModuleUpdateSchema);
    return ok(await updateAppModule(params.id, data));
  },
  {
    action: 'module.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:module:delete');
    return ok(await deleteAppModule(params.id));
  },
  {
    action: 'module.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
