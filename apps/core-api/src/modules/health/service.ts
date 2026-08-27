import { prisma } from '@/lib/prisma';

export function getLivenessStatus() {
  return {
    service: 'core-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

export async function getHealthStatus() {
  await prisma.$queryRaw`SELECT 1`;
  return {
    service: 'core-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

export async function getReadinessStatus() {
  if (!process.env.AUTH_SECRET?.trim()) {
    throw new Error('AUTH_SECRET is required');
  }
  await prisma.$queryRaw`SELECT 1`;
  return {
    service: 'core-api',
    status: 'ready',
    timestamp: new Date().toISOString(),
  };
}
