import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const [userCount, roleCount, permissionCount, menuCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.menu.count({ where: { permissionCode: { not: null } } }),
    prisma.menu.count({ where: { type: { in: ['DIR', 'PAGE', 'LINK'] } } }),
  ]);
  return { userCount, roleCount, permissionCount, menuCount };
}
