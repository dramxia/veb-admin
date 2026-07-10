import type { MenuNode } from '@/lib/menu';

export function getHref(menu: MenuNode) {
  return menu.type === 'LINK' ? menu.externalUrl || menu.path : menu.path;
}

export function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
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
    .filter((menu) => isActive(pathname, menu.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export function getRouteLabel(pathname: string, menus: MenuNode[]) {
  if (pathname === '/') return '仪表盘';

  const activeMenu = flattenMenus(menus)
    .filter((menu) => isActive(pathname, menu.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return (
    activeMenu?.name ?? pathname.split('/').filter(Boolean).at(-1) ?? '工作台'
  );
}

export function isMenuBranchActive(pathname: string, menu: MenuNode) {
  return flattenMenus([menu]).some((item) => isActive(pathname, item.path));
}
