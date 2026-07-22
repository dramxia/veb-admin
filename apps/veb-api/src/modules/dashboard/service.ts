import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const [userCount, roleCount, permissionCount, menuCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.menu.count(),
  ]);
  return { userCount, roleCount, permissionCount, menuCount };
}
