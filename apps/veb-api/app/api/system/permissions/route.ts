export const dynamic = 'force-dynamic';

import { permissionListQuerySchema } from '@veb/api-contracts';
import { ok, pageOptions, readJson, readQuery, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { permissionSchema } from '@/lib/validation';
import {
  createPermission,
  listPermissions,
} from '@/src/modules/permissions/service';

export const GET = withApi(async (request: Request) => {
  await requirePermission('system:permission:view');
  const query = readQuery(request, permissionListQuerySchema);
  return ok(await listPermissions({ ...query, ...pageOptions(query) }));
});

export const POST = withApi(
  async (request: Request) => {
    await requirePermission('system:permission:create');
    const data = await readJson(request, permissionSchema);
    return ok(await createPermission(data));
  },
  { action: 'permission.create' },
);
