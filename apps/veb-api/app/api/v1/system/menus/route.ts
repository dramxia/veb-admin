export const dynamic = 'force-dynamic';

import { menuListQuerySchema } from '@veb/api-contracts';
import { ok, readJson, readQuery, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { menuSchema } from '@/lib/validation';
import { createMenu, listMenus } from '@/src/modules/menus/service';

export const GET = withApi(async (request: Request) => {
  await requirePermission('system:menu:view');
  const query = readQuery(request, menuListQuerySchema);
  return ok(await listMenus(query));
});

export const POST = withApi(
  async (request: Request) => {
    await requirePermission('system:menu:create');
    const data = await readJson(request, menuSchema);
    return ok(await createMenu(data));
  },
  { action: 'menu.create' },
);
