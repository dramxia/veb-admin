export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { defineApiRoute, ok } from '@/lib/api';
import { getReadinessStatus } from '@/src/modules/health/service';

export const GET = defineApiRoute({ access: 'public' }, async () =>
  ok(await getReadinessStatus()),
);
