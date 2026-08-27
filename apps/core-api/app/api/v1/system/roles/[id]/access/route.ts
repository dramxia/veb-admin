export const dynamic = 'force-dynamic';

import { ok, readJson, defineApiRoute, withOperationPayload } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/session';
import { roleAccessSchema } from '@/lib/validation';
import {
  assignRoleAccessWithAudit,
  getRoleAccessDetail,
} from '@/src/modules/roles/service';
import {
  assertRoleAccessAssignable,
  assertRolesAssignable,
} from '@/src/modules/role-assignment/policy';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:role:assign-access' },
  async (_request: Request, { params }: { params: { id: string } }) => {
    return ok(await getRoleAccessDetail(params.id));
  },
);

export const PUT = defineApiRoute(
  { access: 'private', permission: 'system:role:assign-access' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const actor = getAuthenticatedUser();
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
