export const dynamic = 'force-dynamic';

import { operationLogQuerySchema } from '@veb/api-contracts';
import { readQuery, defineApiRoute } from '@/lib/api';
import {
  exportOperationLogs,
  operationLogFiltersFromQuery,
} from '@/src/modules/operation-logs/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'log:operation:export' },
  async (request: Request) => {
    const query = readQuery(request, operationLogQuerySchema);
    const csv = await exportOperationLogs(operationLogFiltersFromQuery(query));

    return new Response(`\ufeff${csv}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="operation-logs.csv"',
      },
    });
  },
);
