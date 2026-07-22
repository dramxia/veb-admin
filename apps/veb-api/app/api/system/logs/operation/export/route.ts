export const dynamic = 'force-dynamic';

import { operationLogQuerySchema } from '@veb/api-contracts';
import { readQuery, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import {
  exportOperationLogs,
  operationLogFiltersFromQuery,
} from '@/src/modules/operation-logs/service';

export const GET = withApi(async (request: Request) => {
  await requirePermission('log:operation:export');
  const query = readQuery(request, operationLogQuerySchema);
  const csv = await exportOperationLogs(operationLogFiltersFromQuery(query));

  return new Response(`\ufeff${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="operation-logs.csv"',
    },
  });
});
