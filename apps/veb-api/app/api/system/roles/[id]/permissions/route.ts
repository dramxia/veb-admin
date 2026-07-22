export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { assignPermissionsSchema } from '@/lib/validation';
import { assignRolePermissions } from '@/src/modules/roles/service';

export const POST = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:role:assign-permission');
    const data = await readJson(request, assignPermissionsSchema);
    return ok(await assignRolePermissions(params.id, data.permissionIds));
  },
  {
    action: 'role.assign-permission',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
