export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { menuUpdateSchema } from '@/lib/validation';
import { deleteMenu, getMenu, updateMenu } from '@/src/modules/menus/service';

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:menu:view');
    return ok(await getMenu(params.id));
  },
);

export const PATCH = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:menu:update');
    const data = await readJson(request, menuUpdateSchema);

    return ok(await updateMenu(params.id, data));
  },
  {
    action: 'menu.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:menu:delete');
    return ok(await deleteMenu(params.id));
  },
  {
    action: 'menu.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
