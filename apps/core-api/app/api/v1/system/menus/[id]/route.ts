export const dynamic = 'force-dynamic';

import { ok, readJson, defineApiRoute } from '@/lib/api';
import { menuUpdateSchema } from '@/lib/validation';
import { deleteMenu, getMenu, updateMenu } from '@/src/modules/menus/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:menu:view' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await getMenu(params.id));
  },
);

export const PATCH = defineApiRoute(
  { access: 'private', permission: 'system:menu:update' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const data = await readJson(request, menuUpdateSchema);

    return ok(await updateMenu(params.id, data));
  },
  {
    action: 'menu.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = defineApiRoute(
  { access: 'private', permission: 'system:menu:delete' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await deleteMenu(params.id));
  },
  {
    action: 'menu.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
