import { ok, withApi } from '@/lib/api';
import { assertRuntimeConfiguration } from '@/lib/env';
import { checkDatabaseReady } from '@/modules/content/service';

export const live = withApi(async () =>
  ok({ service: 'blog-api', status: 'ok' }),
);

export const ready = withApi(async () => {
  assertRuntimeConfiguration();
  await checkDatabaseReady();
  return ok({ service: 'blog-api', status: 'ready' });
});
