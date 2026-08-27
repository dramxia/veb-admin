export const dynamic = 'force-dynamic';

import { operationLogQuerySchema } from '@veb/api-contracts';
import { ok, pageOptions, readQuery, defineApiRoute } from '@/lib/api';
import {
  listOperationLogs,
  operationLogFiltersFromQuery,
} from '@/src/modules/operation-logs/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'log:operation:view' },
  async (request: Request) => {
    const query = readQuery(request, operationLogQuerySchema);
    return ok(
      await listOperationLogs({
        ...pageOptions(query),
        ...operationLogFiltersFromQuery(query),
      }),
    );
  },
);
