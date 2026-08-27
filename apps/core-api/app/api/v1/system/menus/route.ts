export const dynamic = 'force-dynamic';

import { menuListQuerySchema } from '@veb/api-contracts';
import { ok, readJson, readQuery, defineApiRoute } from '@/lib/api';
import { menuSchema } from '@/lib/validation';
import { createMenu, listMenus } from '@/src/modules/menus/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:menu:view' },
  async (request: Request) => {
    const query = readQuery(request, menuListQuerySchema);
    return ok(await listMenus(query));
  },
);

export const POST = defineApiRoute(
  { access: 'private', permission: 'system:menu:create' },
  async (request: Request) => {
    const data = await readJson(request, menuSchema);
    return ok(await createMenu(data));
  },
  { action: 'menu.create' },
);
