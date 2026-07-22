export const dynamic = 'force-dynamic';

import { menuListQuerySchema } from '@veb/api-contracts';
import { ok, readQuery, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { getMenuTree } from '@/src/modules/menus/service';

export const GET = withApi(async (request: Request) => {
  await requirePermission('system:menu:view');
  readQuery(request, menuListQuerySchema);
  return ok(await getMenuTree());
});
