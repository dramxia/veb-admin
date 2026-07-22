import { signServiceRequest, verifyServiceToken } from '@veb/service-auth';
import { getBlogApiEnv, getJwksEnv } from '@/lib/env';
import { prisma } from '@/lib/prisma';

export function getLivenessStatus() {
  return {
    service: 'veb-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

export async function getHealthStatus() {
  await prisma.$queryRaw`SELECT 1`;
  return {
    service: 'veb-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

export async function getReadinessStatus(requestId: string) {
  if (!process.env.AUTH_SECRET?.trim()) {
    throw new Error('AUTH_SECRET is required');
  }
  await prisma.$queryRaw`SELECT 1`;
  const blogEnv = getBlogApiEnv();
  const jwksEnv = getJwksEnv();
  const path = '/api/health/ready';
  const token = await signServiceRequest(
    {
      audience: 'veb-api-readiness',
      permission: 'health:check',
      method: 'GET',
      path,
      requestId,
      subject: 'veb-api',
    },
    {
      privateKeyPem: blogEnv.SERVICE_AUTH_PRIVATE_KEY,
      keyId: blogEnv.SERVICE_AUTH_KEY_ID,
      issuer: blogEnv.SERVICE_AUTH_ISSUER,
    },
  );
  await verifyServiceToken(token, {
    audience: 'veb-api-readiness',
    issuer: blogEnv.SERVICE_AUTH_ISSUER,
    publicKeyPem: jwksEnv.SERVICE_AUTH_PUBLIC_KEY,
    permission: 'health:check',
    method: 'GET',
    path,
    requestId,
  });
  return {
    service: 'veb-api',
    status: 'ready',
    timestamp: new Date().toISOString(),
  };
}
