export const dynamic = 'force-dynamic';

import { menuListQuerySchema } from '@veb/api-contracts';
import { ok, readQuery, defineApiRoute } from '@/lib/api';
import { getMenuTree } from '@/src/modules/menus/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:menu:view' },
  async (request: Request) => {
    const query = readQuery(request, menuListQuerySchema);
    return ok(await getMenuTree(query));
  },
);
