import type { MenuNode } from '@veb/api-contracts';
import { normalizePathname } from './app-modules';

export function normalizeMenuPath(path?: string | null) {
  if (!path) return '';
  const value = path.trim();
  if (!value.startsWith('/')) return value;
  return normalizePathname(value);
}

export function getHref(menu: MenuNode) {
  if (menu.type === 'LINK') return menu.externalUrl ?? '';
  if (menu.type !== 'PAGE') return '';
  return normalizeMenuPath(menu.path);
}

export function getMenuRoutePath(menu: MenuNode) {
  return menu.type === 'PAGE' ? normalizeMenuPath(menu.path) : '';
}

export function isExternalHref(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isActive(pathname: string, path: string) {
  if (!path) return false;
  const normalizedPathname = normalizePathname(pathname);
  const normalizedPath = normalizePathname(path);
  if (normalizedPath === '/') return normalizedPathname === '/';
  return (
    normalizedPathname === normalizedPath ||
    normalizedPathname.startsWith(`${normalizedPath}/`)
  );
}

function isMenuActive(pathname: string, menu: MenuNode) {
  const path = getMenuRoutePath(menu);
  return menu.type === 'PAGE' && isActive(pathname, path);
}

export function flattenMenus(menus: readonly MenuNode[]): MenuNode[] {
  return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children)]);
}

export function flattenNavigableMenus(menus: readonly MenuNode[]) {
  return flattenMenus(menus).filter(
    (menu) => menu.type === 'PAGE' || menu.type === 'LINK',
  );
}

export function getCurrentMenu(pathname: string, menus: readonly MenuNode[]) {
  return flattenNavigableMenus(menus)
    .filter((menu) => isMenuActive(pathname, menu))
    .sort(
      (left, right) =>
        getMenuRoutePath(right).length - getMenuRoutePath(left).length,
    )[0];
}

export function getRouteLabel(pathname: string, menus: readonly MenuNode[]) {
  const activeMenu = getCurrentMenu(pathname, menus);
  return (
    activeMenu?.name ?? pathname.split('/').filter(Boolean).at(-1) ?? '工作台'
  );
}

export function isMenuBranchActive(pathname: string, menu: MenuNode) {
  return flattenMenus([menu]).some((item) => isMenuActive(pathname, item));
}
