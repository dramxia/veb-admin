export const dynamic = 'force-dynamic';

import { ok, readJson, defineApiRoute } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/session';
import { profileSchema } from '@/lib/validation';
import { getProfile, updateProfile } from '@/src/modules/profile/service';

export const GET = defineApiRoute({ access: 'private' }, async () => {
  const user = getAuthenticatedUser();
  return ok(await getProfile(user.id));
});

export const PATCH = defineApiRoute(
  { access: 'private' },
  async (request: Request) => {
    const user = getAuthenticatedUser();
    const data = await readJson(request, profileSchema);
    return ok(await updateProfile(user.id, data));
  },
  { action: 'profile.update' },
);
