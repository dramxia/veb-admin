export const dynamic = 'force-dynamic';

import { ok, defineApiRoute } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/session';
import { getUserNavigation } from '@/src/modules/navigation/service';

export const GET = defineApiRoute({ access: 'private' }, async () => {
  const user = getAuthenticatedUser();
  return ok(await getUserNavigation(user.id));
});
