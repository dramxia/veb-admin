import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    userCount,
    enabledUserCount,
    roleCount,
    enabledRoleCount,
    moduleCount,
    enabledModuleCount,
    permissionCount,
    menuCount,
    operationCount24h,
    failedOperationCount24h,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ENABLED' } }),
    prisma.role.count(),
    prisma.role.count({ where: { status: 'ENABLED' } }),
    prisma.appModule.count(),
    prisma.appModule.count({ where: { status: 'ENABLED' } }),
    prisma.menu.count({ where: { permissionCode: { not: null } } }),
    prisma.menu.count({ where: { type: { in: ['DIR', 'PAGE', 'LINK'] } } }),
    prisma.operationLog.count({ where: { createdAt: { gte: since } } }),
    prisma.operationLog.count({
      where: { createdAt: { gte: since }, status: 'FAILURE' },
    }),
  ]);

  return {
    userCount,
    enabledUserCount,
    roleCount,
    enabledRoleCount,
    moduleCount,
    enabledModuleCount,
    permissionCount,
    menuCount,
    operationCount24h,
    failedOperationCount24h,
  };
}
