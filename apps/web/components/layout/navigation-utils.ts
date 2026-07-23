import type { MenuNode } from '@veb/api-contracts';
import { ADMIN_BASE_PATH } from './app-modules';

export function normalizeAdminMenuPath(path: string) {
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
  if (!normalized || normalized === '/') return ADMIN_BASE_PATH;
  if (
    normalized === ADMIN_BASE_PATH ||
    normalized.startsWith(`${ADMIN_BASE_PATH}/`)
  ) {
    return normalized;
  }
  return `${ADMIN_BASE_PATH}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}

export function getHref(menu: MenuNode) {
  if (menu.type !== 'LINK') return normalizeAdminMenuPath(menu.path);

  const href = menu.externalUrl || menu.path;
  return isExternalHref(href) ? href : normalizeAdminMenuPath(href);
}

export function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function isActive(pathname: string, path: string) {
  if (!path) return false;
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function flattenMenus(menus: MenuNode[]): MenuNode[] {
  return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children)]);
}

export function flattenNavigableMenus(menus: MenuNode[]) {
  return flattenMenus(menus).filter((menu) => menu.type !== 'DIR');
}

export function getCurrentMenu(pathname: string, menus: MenuNode[]) {
  return flattenNavigableMenus(menus)
    .filter((menu) => isActive(pathname, getHref(menu)))
    .sort((a, b) => getHref(b).length - getHref(a).length)[0];
}

export function getRouteLabel(pathname: string, menus: MenuNode[]) {
  if (pathname === ADMIN_BASE_PATH) return '仪表盘';

  const activeMenu = flattenMenus(menus)
    .filter((menu) => isActive(pathname, getHref(menu)))
    .sort((a, b) => getHref(b).length - getHref(a).length)[0];

  return (
    activeMenu?.name ?? pathname.split('/').filter(Boolean).at(-1) ?? '工作台'
  );
}

export function isMenuBranchActive(pathname: string, menu: MenuNode) {
  return flattenMenus([menu]).some((item) => isActive(pathname, getHref(item)));
}
