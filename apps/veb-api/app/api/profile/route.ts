export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { profileSchema } from '@/lib/validation';
import { getProfile, updateProfile } from '@/src/modules/profile/service';

export const GET = withApi(async () => {
  const user = await requireUser();
  return ok(await getProfile(user.id));
});

export const PATCH = withApi(
  async (request: Request) => {
    const user = await requireUser();
    const data = await readJson(request, profileSchema);
    return ok(await updateProfile(user.id, data));
  },
  { action: 'profile.update' },
);
