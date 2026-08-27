export const dynamic = 'force-dynamic';

import { ok, readJson, defineApiRoute } from '@/lib/api';
import { resetPasswordSchema } from '@/lib/validation';
import { resetUserPassword } from '@/src/modules/users/service';

export const POST = defineApiRoute(
  { access: 'private', permission: 'system:user:reset-password' },
  async (request: Request, { params }: { params: { id: string } }) => {
    const data = await readJson(request, resetPasswordSchema);
    return ok(await resetUserPassword(params.id, data.password));
  },
  {
    action: 'user.reset-password',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
