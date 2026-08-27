export const dynamic = 'force-dynamic';

import { appModuleListQuerySchema } from '@veb/api-contracts';
import {
  ok,
  pageOptions,
  readJson,
  readQuery,
  defineApiRoute,
} from '@/lib/api';
import { appModuleSchema } from '@/lib/validation';
import { createAppModule, listAppModules } from '@/src/modules/modules/service';

export const GET = defineApiRoute(
  { access: 'private', permission: 'system:module:view' },
  async (request: Request) => {
    const query = readQuery(request, appModuleListQuerySchema);
    return ok(await listAppModules({ ...query, ...pageOptions(query) }));
  },
);

export const POST = defineApiRoute(
  { access: 'private', permission: 'system:module:create' },
  async (request: Request) => {
    const data = await readJson(request, appModuleSchema);
    return ok(await createAppModule(data));
  },
  { action: 'module.create' },
);
