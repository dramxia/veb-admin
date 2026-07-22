import { CommonStatus, type Menu } from '@/generated/client';
import {
  getCachedPermissions,
  setCachedPermissions,
} from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';

export type MenuNode = Pick<
  Menu,
  | 'id'
  | 'parentId'
  | 'name'
  | 'path'
  | 'component'
  | 'icon'
  | 'sort'
  | 'type'
  | 'permissionCode'
  | 'visible'
  | 'status'
  | 'externalUrl'
> & { children: MenuNode[] };

export type UserMenuAndPermissions = {
  menus: MenuNode[];
  permissionCodes: string[];
  roleCodes: string[];
};

function sortMenus<T extends { sort: number; name: string }>(items: T[]) {
  return items.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}

function buildTree(items: Menu[], options?: { onlyVisible?: boolean }) {
  const filtered = options?.onlyVisible
    ? items.filter((item) => item.visible)
    : items;
  const map = new Map<string, MenuNode>();
  const roots: MenuNode[] = [];

  for (const item of filtered) {
    map.set(item.id, {
      id: item.id,
      parentId: item.parentId,
      name: item.name,
      path: item.path,
      component: item.component,
      icon: item.icon,
      sort: item.sort,
      type: item.type,
      permissionCode: item.permissionCode,
      visible: item.visible,
      status: item.status,
      externalUrl: item.externalUrl,
      children: [],
    });
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId))
      map.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }

  const walk = (nodes: MenuNode[]) => {
    sortMenus(nodes);
    for (const node of nodes) walk(node.children);
  };
  walk(roots);
  return roots;
}

function pruneEmptyDirs(nodes: MenuNode[]): MenuNode[] {
  return nodes
    .map((node) => ({ ...node, children: pruneEmptyDirs(node.children) }))
    .filter((node) => node.type !== 'DIR' || node.children.length > 0);
}

export async function getUserPermissionSnapshot(userId: string) {
  const cached = getCachedPermissions(userId);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      status: true,
      roles: {
        where: { role: { status: CommonStatus.ENABLED } },
        select: {
          role: {
            select: {
              code: true,
              permissions: {
                select: { permission: { select: { code: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.status !== 'ENABLED') {
    return setCachedPermissions(userId, { roleCodes: [], permissionCodes: [] });
  }

  const roleCodes = user.roles.map((item) => item.role.code);
  const permissionCodes = [
    ...new Set(
      user.roles.flatMap((item) =>
        item.role.permissions.map((rp) => rp.permission.code),
      ),
    ),
  ];
  return setCachedPermissions(userId, { roleCodes, permissionCodes });
}

export async function getUserMenuAndPermissions(
  userId: string,
): Promise<UserMenuAndPermissions> {
  const snapshot = await getUserPermissionSnapshot(userId);
  const isSuperadmin = snapshot.roleCodes.includes('superadmin');
  const menus = await prisma.menu.findMany({
    where: { status: CommonStatus.ENABLED },
    orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
  });

  if (isSuperadmin) {
    const permissions = await prisma.permission.findMany({
      select: { code: true },
    });
    return {
      menus: buildTree(menus, { onlyVisible: true }),
      permissionCodes: permissions.map((item) => item.code),
      roleCodes: snapshot.roleCodes,
    };
  }

  const allowed = new Set(snapshot.permissionCodes);
  const accessibleMenus = menus.filter(
    (menu) => !menu.permissionCode || allowed.has(menu.permissionCode),
  );
  return {
    menus: pruneEmptyDirs(buildTree(accessibleMenus, { onlyVisible: true })),
    permissionCodes: snapshot.permissionCodes,
    roleCodes: snapshot.roleCodes,
  };
}

export async function getMenuByPath(pathname: string) {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const menus = await prisma.menu.findMany({
    where: { status: CommonStatus.ENABLED },
  });
  return (
    menus
      .filter(
        (menu) =>
          normalized === menu.path || normalized.startsWith(`${menu.path}/`),
      )
      .sort((a, b) => b.path.length - a.path.length)[0] ?? null
  );
}
