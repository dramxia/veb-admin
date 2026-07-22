export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { assertRateLimit, getClientIp } from '@/lib/rate-limit';
import { requireUser } from '@/lib/session';
import { changePasswordSchema } from '@/lib/validation';
import { changePassword } from '@/src/modules/profile/service';

export const POST = withApi(
  async (request: Request) => {
    assertRateLimit({
      key: `change-password:${getClientIp(request)}`,
      capacity: 10,
      windowMs: 5000,
    });
    const sessionUser = await requireUser();
    const data = await readJson(request, changePasswordSchema);
    return ok(await changePassword(sessionUser.id, data));
  },
  { action: 'profile.change-password' },
);
