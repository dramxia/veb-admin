import {
  createServiceJwks,
  createServiceJwksResponse,
  importServicePublicKey,
} from '@veb/service-auth';
import { getJwksEnv } from '@/lib/env';

let jwksPromise: ReturnType<typeof createServiceJwks> | undefined;

export async function getJwksResponse() {
  const env = getJwksEnv();
  jwksPromise ??= importServicePublicKey(env.SERVICE_AUTH_PUBLIC_KEY).then(
    (key) => createServiceJwks(key, env.SERVICE_AUTH_KEY_ID),
  );
  return createServiceJwksResponse(await jwksPromise);
}
