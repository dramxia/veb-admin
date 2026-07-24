export const dynamic = 'force-dynamic';

import { appModuleListQuerySchema } from '@veb/api-contracts';
import { ok, pageOptions, readJson, readQuery, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { appModuleSchema } from '@/lib/validation';
import { createAppModule, listAppModules } from '@/src/modules/modules/service';

export const GET = withApi(async (request: Request) => {
  await requirePermission('system:module:view');
  const query = readQuery(request, appModuleListQuerySchema);
  return ok(await listAppModules({ ...query, ...pageOptions(query) }));
});

export const POST = withApi(
  async (request: Request) => {
    await requirePermission('system:module:create');
    const data = await readJson(request, appModuleSchema);
    return ok(await createAppModule(data));
  },
  { action: 'module.create' },
);
