import { PermissionError } from './errors';
import { getMenuByPath, getUserPermissionSnapshot } from './menu';
import { requireUser } from './session';

function toCodes(code: string | string[]) {
  return Array.isArray(code) ? code : [code];
}

export async function hasPermission(userId: string, code: string | string[]) {
  const snapshot = await getUserPermissionSnapshot(userId);
  if (snapshot.roleCodes.includes('superadmin')) return true;

  const permissions = new Set(snapshot.permissionCodes);
  return toCodes(code).some((item) => permissions.has(item));
}

export async function requirePermission(code: string | string[]) {
  const user = await requireUser();
  const allowed = await hasPermission(user.id, code);
  if (!allowed) throw new PermissionError();
  return user;
}

export async function assertPermission(
  userId: string,
  code: string | string[],
) {
  const allowed = await hasPermission(userId, code);
  if (!allowed) throw new PermissionError();
}

export async function canAccess(userId: string, pathname: string) {
  if (
    pathname === '/' ||
    pathname === '/admin' ||
    pathname === '/admin/profile'
  )
    return true;

  const snapshot = await getUserPermissionSnapshot(userId);
  if (snapshot.roleCodes.includes('superadmin')) return true;

  const menu = await getMenuByPath(pathname);
  if (!menu) return false;
  if (!menu.permissionCode) return true;

  return snapshot.permissionCodes.includes(menu.permissionCode);
}
