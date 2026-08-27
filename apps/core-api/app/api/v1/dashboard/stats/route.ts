export const dynamic = 'force-dynamic';

import { ok, defineApiRoute } from '@/lib/api';
import { hasPermission } from '@/lib/permission';
import { getAuthenticatedUser } from '@/lib/session';
import { getDashboardStats } from '@/src/modules/dashboard/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'dashboard:view' },
  async () => {
    const user = getAuthenticatedUser();
    const includeRecentOperations = await hasPermission(
      user.id,
      'log:operation:view',
    );
    return ok(await getDashboardStats({ includeRecentOperations }));
  },
);
