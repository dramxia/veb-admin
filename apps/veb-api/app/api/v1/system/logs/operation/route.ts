export const dynamic = 'force-dynamic';

import { operationLogQuerySchema } from '@veb/api-contracts';
import { ok, pageOptions, readQuery, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import {
  listOperationLogs,
  operationLogFiltersFromQuery,
} from '@/src/modules/operation-logs/service';

export const GET = withApi(async (request: Request) => {
  await requirePermission('log:operation:view');
  const query = readQuery(request, operationLogQuerySchema);
  return ok(
    await listOperationLogs({
      ...pageOptions(query),
      ...operationLogFiltersFromQuery(query),
    }),
  );
});
