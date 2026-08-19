export const dynamic = 'force-dynamic';

import { ok, readJson, withApi, withOperationPayload } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { roleAccessSchema } from '@/lib/validation';
import {
  assignRoleAccessWithAudit,
  getRoleAccessDetail,
} from '@/src/modules/roles/service';
import {
  assertRoleAccessAssignable,
  assertRolesAssignable,
} from '@/src/modules/role-assignment/policy';

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:role:assign-access');
    return ok(await getRoleAccessDetail(params.id));
  },
);

export const PUT = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    const actor = await requirePermission('system:role:assign-access');
    const data = await readJson(request, roleAccessSchema);
    await assertRolesAssignable(actor.id, [params.id]);
    await assertRoleAccessAssignable(actor.id, data.modules);
    const { result, audit } = await assignRoleAccessWithAudit(
      params.id,
      data.modules,
    );
    return withOperationPayload(ok(result), audit);
  },
  {
    action: 'role.assign-access',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
