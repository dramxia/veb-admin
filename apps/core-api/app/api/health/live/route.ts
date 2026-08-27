export const dynamic = 'force-dynamic';

import { defineApiRoute, ok } from '@/lib/api';
import { getLivenessStatus } from '@/src/modules/health/service';

export const GET = defineApiRoute({ access: 'public' }, async () =>
  ok(getLivenessStatus()),
);
