import { PermissionError } from './errors';
import { getMenuByPath, getUserPermissionSnapshot } from './menu';
import { requireUser } from './session';

function toCodes(code: string | string[]) {
  return Array.isArray(code) ? code : [code];
}

export async function hasPermission(userId: string, code: string | string[]) {
  const snapshot = await getUserPermissionSnapshot(userId);
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
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (
    normalized === '/' ||
    normalized === '/profile' ||
    normalized === '/admin/profile'
  )
    return true;

  const snapshot = await getUserPermissionSnapshot(userId);
  const menu = await getMenuByPath(normalized);
  if (!menu || !snapshot.moduleIds.includes(menu.moduleId)) return false;
  return Boolean(
    menu.permissionCode &&
    snapshot.permissionCodes.includes(menu.permissionCode),
  );
}
