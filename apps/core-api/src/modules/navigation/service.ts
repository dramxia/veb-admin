import { CommonStatus, UserStatus, type Menu } from '@/generated/client';
import type { MenuNode, UserNavigation } from '@veb/api-contracts';
import { createMenuHierarchy } from '@/lib/menu-hierarchy';
import { prisma } from '@/lib/prisma';
import { NotFoundError, PermissionError } from '@/lib/errors';

const ADMIN_MODULE_ROOT_PATH = '/admin';

function compareText(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortMenus<T extends { id: string; sort: number; name: string }>(
  items: T[],
) {
  return items.sort(
    (a, b) =>
      a.sort - b.sort || compareText(a.name, b.name) || compareText(a.id, b.id),
  );
}

function buildTree(items: Menu[]) {
  const map = new Map<string, MenuNode>();
  const roots: MenuNode[] = [];

  for (const item of items) {
    if (item.type === 'BUTTON') continue;
    map.set(item.id, {
      id: item.id,
      moduleId: item.moduleId,
      parentId: item.parentId,
      name: item.name,
      description: item.description,
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

function findLandingPath(nodes: MenuNode[]): string | null {
  for (const node of nodes) {
    if (
      node.type === 'PAGE' &&
      node.path &&
      normalizeRequestedPath(node.path) !== ADMIN_MODULE_ROOT_PATH
    ) {
      return node.path;
    }
    const childPath = findLandingPath(node.children);
    if (childPath) return childPath;
  }
  return null;
}

function normalizeRequestedPath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export type PermissionSnapshot = {
  roleCodes: string[];
  moduleIds: string[];
  permissionCodes: string[];
};

/**
 * Computes effective access role by role. A menu permission only survives when
 * that same role owns its enabled module, preventing cross-role privilege joins.
 */
export async function getUserPermissionSnapshot(
  userId: string,
): Promise<PermissionSnapshot> {
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
              modules: {
                where: { module: { status: CommonStatus.ENABLED } },
                select: { moduleId: true },
              },
              menus: { select: { menuId: true, moduleId: true } },
            },
          },
        },
      },
    },
  });

  if (!user || user.status !== UserStatus.ENABLED) {
    return { roleCodes: [], moduleIds: [], permissionCodes: [] };
  }

  const roleCodes = [...new Set(user.roles.map((item) => item.role.code))];
  if (roleCodes.includes('superadmin')) {
    const modules = await prisma.appModule.findMany({
      where: { status: CommonStatus.ENABLED },
      select: { id: true, menus: true },
    });
    const menus = modules.flatMap((module) => module.menus);
    const hierarchy = createMenuHierarchy(menus);
    return {
      roleCodes,
      moduleIds: modules.map((module) => module.id),
      permissionCodes: [
        ...new Set(
          menus
            .filter(
              (menu) =>
                menu.type !== 'DIR' &&
                Boolean(menu.permissionCode) &&
                hierarchy.isEnabled(menu.id),
            )
            .map((menu) => menu.permissionCode!),
        ),
      ],
    };
  }

  const moduleIds = new Set<string>();
  for (const { role } of user.roles) {
    for (const assignment of role.modules) moduleIds.add(assignment.moduleId);
  }
  const menus = moduleIds.size
    ? await prisma.menu.findMany({
        where: { moduleId: { in: [...moduleIds] } },
      })
    : [];
  const hierarchy = createMenuHierarchy(menus);
  const menuById = hierarchy.byId;
  const permissionCodes = new Set<string>();

  for (const { role } of user.roles) {
    const roleModuleIds = new Set(
      role.modules.map((assignment) => assignment.moduleId),
    );
    for (const assignment of role.menus) {
      if (!roleModuleIds.has(assignment.moduleId)) continue;
      const menu = menuById.get(assignment.menuId);
      if (
        menu &&
        menu.moduleId === assignment.moduleId &&
        menu.type !== 'DIR' &&
        menu.permissionCode &&
        hierarchy.isEnabled(menu.id)
      ) {
        permissionCodes.add(menu.permissionCode);
      }
    }
  }

  return {
    roleCodes,
    moduleIds: [...moduleIds],
    permissionCodes: [...permissionCodes],
  };
}

export async function getUserNavigation(
  userId: string,
): Promise<UserNavigation> {
  const snapshot = await getUserPermissionSnapshot(userId);
  if (!snapshot.moduleIds.length) {
    return {
      modules: [],
      permissionCodes: snapshot.permissionCodes,
      roleCodes: snapshot.roleCodes,
    };
  }

  const modules = await prisma.appModule.findMany({
    where: {
      id: { in: snapshot.moduleIds },
      status: CommonStatus.ENABLED,
    },
    orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    include: { menus: true },
  });

  const allowed = new Set(snapshot.permissionCodes);
  const resolvedModules = modules.flatMap((module) => {
    const hierarchy = createMenuHierarchy(module.menus);
    const accessibleMenus = module.menus.filter(
      (menu) =>
        menu.type !== 'BUTTON' &&
        hierarchy.isEnabled(menu.id) &&
        hierarchy.isVisible(menu.id) &&
        (menu.type === 'DIR' ||
          Boolean(menu.permissionCode && allowed.has(menu.permissionCode))),
    );
    const menus = pruneEmptyDirs(buildTree(accessibleMenus));
    const landingPath = findLandingPath(menus);
    if (!landingPath) return [];
    return [
      {
        id: module.id,
        code: module.code,
        name: module.name,
        description: module.description,
        icon: module.icon,
        sort: module.sort,
        status: module.status,
        isSystem: module.isSystem,
        landingPath,
        menus,
      },
    ];
  });

  return {
    modules: resolvedModules,
    permissionCodes: snapshot.permissionCodes,
    roleCodes: snapshot.roleCodes,
  };
}

export async function getMenuByPath(pathname: string) {
  const normalized = normalizeRequestedPath(pathname);
  const pages = await prisma.menu.findMany({
    where: { type: 'PAGE', path: { not: null } },
  });
  const routablePages = pages.filter((page): page is Menu & { path: string } =>
    Boolean(page.path),
  );
  const exact = routablePages.find((page) => page.path === normalized);
  if (exact) return exact;

  // A one-segment module landing page (for example /admin) is exact-only. If
  // it acted as a prefix it would turn every unknown workspace URL into that
  // module's dashboard instead of a 404.
  return (
    routablePages
      .filter(
        (page) =>
          page.path.split('/').filter(Boolean).length > 1 &&
          normalized.startsWith(`${page.path}/`),
      )
      .sort(
        (a, b) => b.path.length - a.path.length || compareText(a.id, b.id),
      )[0] ?? null
  );
}

export async function resolveUserPage(userId: string, pathname: string) {
  const page = await getMenuByPath(pathname);
  if (!page) throw new NotFoundError('页面不存在');

  const snapshot = await getUserPermissionSnapshot(userId);
  if (
    !snapshot.moduleIds.includes(page.moduleId) ||
    !page.permissionCode ||
    !snapshot.permissionCodes.includes(page.permissionCode)
  ) {
    throw new PermissionError();
  }
  if (!page.path || !page.component) throw new NotFoundError('页面组件未配置');

  return {
    id: page.id,
    moduleId: page.moduleId,
    path: page.path,
    component: page.component,
  };
}
