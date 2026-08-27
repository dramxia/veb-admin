export const dynamic = 'force-dynamic';

import { ok, readJson, defineApiRoute } from '@/lib/api';
import { appModuleUpdateSchema } from '@/lib/validation';
import {
  deleteAppModule,
  getAppModule,
  updateAppModule,
} from '@/src/modules/modules/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:module:view' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await getAppModule(params.id));
  },
);

export const PATCH = defineApiRoute(
  { access: 'private', permission: 'system:module:update' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const data = await readJson(request, appModuleUpdateSchema);
    return ok(await updateAppModule(params.id, data));
  },
  {
    action: 'module.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = defineApiRoute(
  { access: 'private', permission: 'system:module:delete' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await deleteAppModule(params.id));
  },
  {
    action: 'module.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
