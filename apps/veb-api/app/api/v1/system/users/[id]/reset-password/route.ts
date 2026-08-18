export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { resetPasswordSchema } from '@/lib/validation';
import { resetUserPassword } from '@/src/modules/users/service';

export const POST = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:user:reset-password');
    const data = await readJson(request, resetPasswordSchema);
    return ok(await resetUserPassword(params.id, data.password));
  },
  {
    action: 'user.reset-password',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
