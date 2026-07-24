import type { z } from 'zod';
import { Prisma, type Menu, type MenuType } from '@/generated/client';
import { ConflictError, NotFoundError, ParamError } from '@/lib/errors';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { withSerializableRetry } from '@/lib/prisma-transaction';
import { menuSchema, menuUpdateSchema } from '@/lib/validation';

type MenuCreateData = z.infer<typeof menuSchema>;
type MenuUpdateData = z.infer<typeof menuUpdateSchema>;
type MenuTreeItem = Menu & { children: MenuTreeItem[] };

type MenuState = Pick<
  Menu,
  | 'moduleId'
  | 'parentId'
  | 'type'
  | 'path'
  | 'component'
  | 'icon'
  | 'permissionCode'
  | 'visible'
  | 'externalUrl'
>;

const NAVIGATION_TYPES: MenuType[] = ['DIR', 'PAGE', 'LINK'];

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function rethrowMenuWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
      if (target.includes('path')) throw new ConflictError('页面路径已存在');
      if (target.includes('permissionCode'))
        throw new ConflictError('权限码已存在');
      throw new ConflictError('菜单数据已存在');
    }
    if (error.code === 'P2003')
      throw new ConflictError('菜单仍有关联数据，不能执行该操作');
    if (error.code === 'P2025') throw new NotFoundError('菜单不存在');
  }
  throw error;
}

function normalizeCreateData(
  data: MenuCreateData,
): Prisma.MenuUncheckedCreateInput {
  const common = {
    moduleId: data.moduleId,
    name: data.name,
    description: data.description ?? null,
    sort: data.sort,
    status: data.status,
    isSystem: false,
  };

  switch (data.type) {
    case 'DIR':
      return {
        ...common,
        type: data.type,
        parentId: data.parentId ?? null,
        path: null,
        component: null,
        icon: data.icon ?? null,
        permissionCode: null,
        visible: data.visible,
        externalUrl: null,
      };
    case 'PAGE':
      return {
        ...common,
        type: data.type,
        parentId: data.parentId ?? null,
        path: data.path,
        component: data.component,
        icon: data.icon ?? null,
        permissionCode: data.permissionCode,
        visible: data.visible,
        externalUrl: null,
      };
    case 'LINK':
      return {
        ...common,
        type: data.type,
        parentId: data.parentId ?? null,
        path: null,
        component: null,
        icon: data.icon ?? null,
        permissionCode: data.permissionCode,
        visible: data.visible,
        externalUrl: data.externalUrl,
      };
    case 'BUTTON':
      return {
        ...common,
        type: data.type,
        parentId: data.parentId,
        path: null,
        component: null,
        icon: null,
        permissionCode: data.permissionCode,
        visible: false,
        externalUrl: null,
      };
  }
}

function normalizeUpdateState(old: Menu, data: MenuUpdateData): MenuState {
  const common = {
    moduleId: old.moduleId,
    parentId: data.parentId !== undefined ? data.parentId : old.parentId,
    type: data.type,
  };

  switch (data.type) {
    case 'DIR':
      return {
        ...common,
        path: null,
        component: null,
        icon: data.icon !== undefined ? data.icon : old.icon,
        permissionCode: null,
        visible: data.visible !== undefined ? data.visible : old.visible,
        externalUrl: null,
      };
    case 'PAGE':
      return {
        ...common,
        path: data.path !== undefined ? data.path : old.path,
        component:
          data.component !== undefined ? data.component : old.component,
        icon: data.icon !== undefined ? data.icon : old.icon,
        permissionCode:
          data.permissionCode !== undefined
            ? data.permissionCode
            : old.permissionCode,
        visible: data.visible !== undefined ? data.visible : old.visible,
        externalUrl: null,
      };
    case 'LINK':
      return {
        ...common,
        path: null,
        component: null,
        icon: data.icon !== undefined ? data.icon : old.icon,
        permissionCode:
          data.permissionCode !== undefined
            ? data.permissionCode
            : old.permissionCode,
        visible: data.visible !== undefined ? data.visible : old.visible,
        externalUrl:
          data.externalUrl !== undefined ? data.externalUrl : old.externalUrl,
      };
    case 'BUTTON':
      return {
        ...common,
        path: null,
        component: null,
        icon: null,
        permissionCode:
          data.permissionCode !== undefined
            ? data.permissionCode
            : old.permissionCode,
        visible: false,
        externalUrl: null,
      };
  }
}

async function getNavigationDepth(
  tx: Prisma.TransactionClient,
  parentId: string | null,
  moduleId: string,
  currentMenuId?: string,
) {
  let depth = 1;
  let cursor = parentId;
  const visited = new Set<string>(currentMenuId ? [currentMenuId] : []);

  while (cursor) {
    if (visited.has(cursor)) {
      throw new ParamError(
        currentMenuId ? '不能将菜单移动到自身或其后代' : '菜单父级存在循环',
      );
    }
    visited.add(cursor);
    const parent = await tx.menu.findUnique({
      where: { id: cursor },
      select: { parentId: true, moduleId: true, type: true },
    });
    if (!parent) throw new ParamError('父菜单不存在');
    if (parent.moduleId !== moduleId)
      throw new ParamError('父菜单必须与当前菜单属于同一模块');
    if (parent.type !== 'DIR') throw new ParamError('导航节点的父级必须是目录');
    depth += 1;
    cursor = parent.parentId;
  }
  return depth;
}

async function getNavigationSubtreeDepth(
  tx: Prisma.TransactionClient,
  menuId: string,
  moduleId: string,
) {
  const items = await tx.menu.findMany({
    where: { moduleId, type: { in: NAVIGATION_TYPES } },
    select: { id: true, parentId: true },
  });
  const children = new Map<string, string[]>();
  for (const item of items) {
    if (!item.parentId) continue;
    const siblings = children.get(item.parentId) ?? [];
    siblings.push(item.id);
    children.set(item.parentId, siblings);
  }

  const visit = (id: string, visiting: Set<string>): number => {
    if (visiting.has(id)) throw new ParamError('菜单父级存在循环');
    const next = new Set(visiting);
    next.add(id);
    return (children.get(id) ?? []).reduce(
      (max, childId) => Math.max(max, 1 + visit(childId, next)),
      0,
    );
  };
  return visit(menuId, new Set());
}

async function validateMenuState(
  tx: Prisma.TransactionClient,
  state: MenuState,
  currentMenuId?: string,
) {
  const appModule = await tx.appModule.findUnique({
    where: { id: state.moduleId },
    select: { id: true },
  });
  if (!appModule) throw new ParamError('所属模块不存在');

  const parent = state.parentId
    ? await tx.menu.findUnique({
        where: { id: state.parentId },
        select: { id: true, moduleId: true, type: true },
      })
    : null;
  if (state.parentId && !parent) throw new ParamError('父菜单不存在');
  if (parent && parent.moduleId !== state.moduleId)
    throw new ParamError('父菜单必须与当前菜单属于同一模块');
  if (currentMenuId && parent?.id === currentMenuId)
    throw new ParamError('不能将菜单移动到自身或其后代');

  if (state.type === 'BUTTON') {
    if (!parent || parent.type !== 'PAGE')
      throw new ParamError('按钮必须直属页面');
    if (
      state.path !== null ||
      state.component !== null ||
      state.icon !== null ||
      state.externalUrl !== null ||
      state.visible
    ) {
      throw new ParamError('按钮不能设置路由、组件、图标、外链或导航可见性');
    }
    if (!state.permissionCode) throw new ParamError('按钮必须设置权限码');
    return;
  }

  if (parent && parent.type !== 'DIR')
    throw new ParamError('目录、页面和外链的父级只能是目录');

  const depth = await getNavigationDepth(
    tx,
    state.parentId,
    state.moduleId,
    currentMenuId,
  );
  const descendantDepth =
    currentMenuId && state.type === 'DIR'
      ? await getNavigationSubtreeDepth(tx, currentMenuId, state.moduleId)
      : 0;
  if (depth + descendantDepth > 4)
    throw new ParamError('菜单深度不能超过 4 级');

  if (state.type === 'DIR') {
    if (
      state.path !== null ||
      state.component !== null ||
      state.permissionCode !== null ||
      state.externalUrl !== null
    ) {
      throw new ParamError('目录不能设置路径、组件、权限码或外链');
    }
    return;
  }

  if (!state.permissionCode) throw new ParamError('页面和外链必须设置权限码');
  if (state.type === 'PAGE') {
    if (!state.path || !state.component)
      throw new ParamError('页面必须设置路径和组件');
    if (state.externalUrl !== null) throw new ParamError('页面不能设置外链');
    return;
  }

  if (state.path !== null || state.component !== null)
    throw new ParamError('外链不能设置页面路径或组件');
  if (!state.externalUrl || !isHttpUrl(state.externalUrl))
    throw new ParamError('外链必须设置有效的 HTTP(S) 地址');
}

function buildTree(items: Menu[]) {
  const map = new Map<string, MenuTreeItem>();
  const roots: MenuTreeItem[] = [];
  for (const item of items) map.set(item.id, { ...item, children: [] });
  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId))
      map.get(item.parentId)!.children.push(item);
    else roots.push(item);
  }
  return roots;
}

export async function listMenus(query: { moduleId?: string } = {}) {
  const [items, modules] = await Promise.all([
    prisma.menu.findMany({
      where: query.moduleId ? { moduleId: query.moduleId } : undefined,
      orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    }),
    prisma.appModule.findMany({
      select: { id: true, name: true },
      orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    }),
  ]);
  return { items, modules };
}

export async function getMenuTree(query: { moduleId?: string } = {}) {
  const items = await prisma.menu.findMany({
    where: query.moduleId ? { moduleId: query.moduleId } : undefined,
    orderBy: [{ sort: 'asc' }, { name: 'asc' }, { id: 'asc' }],
  });
  return { items: buildTree(items) };
}

export async function createMenu(data: MenuCreateData) {
  try {
    const menu = await withSerializableRetry(async (tx) => {
      const createData = normalizeCreateData(data);
      const state: MenuState = {
        moduleId: data.moduleId,
        parentId: createData.parentId ?? null,
        type: createData.type ?? 'PAGE',
        path: createData.path ?? null,
        component: createData.component ?? null,
        icon: createData.icon ?? null,
        permissionCode: createData.permissionCode ?? null,
        visible: createData.visible ?? true,
        externalUrl: createData.externalUrl ?? null,
      };
      await validateMenuState(tx, state);
      return tx.menu.create({ data: createData });
    });
    invalidatePermissionCache();
    return menu;
  } catch (error) {
    rethrowMenuWriteError(error);
  }
}

export async function getMenu(id: string) {
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) throw new NotFoundError('菜单不存在');
  return menu;
}

export async function updateMenu(id: string, data: MenuUpdateData) {
  try {
    const menu = await withSerializableRetry(async (tx) => {
      const old = await tx.menu.findUnique({ where: { id } });
      if (!old) throw new NotFoundError('菜单不存在');
      if (data.type !== old.type)
        throw new ConflictError('菜单创建后不能修改类型');
      if (
        old.isSystem &&
        Object.entries(data).some(
          ([key, value]) =>
            value !== undefined && !['type', 'name', 'icon'].includes(key),
        )
      ) {
        throw new ConflictError('内置菜单只允许修改名称和图标');
      }

      const state = normalizeUpdateState(old, data);
      await validateMenuState(tx, state, id);

      const safeData: Prisma.MenuUncheckedUpdateInput = old.isSystem
        ? {
            name: data.name,
            icon:
              old.type === 'BUTTON' || !('icon' in data)
                ? undefined
                : data.icon,
          }
        : {
            parentId: state.parentId,
            name: data.name,
            description: data.description,
            path: state.path,
            component: state.component,
            icon: state.icon,
            sort: data.sort,
            permissionCode: state.permissionCode,
            visible: state.visible,
            status: data.status,
            externalUrl: state.externalUrl,
          };
      return tx.menu.update({ where: { id }, data: safeData });
    });
    invalidatePermissionCache();
    return menu;
  } catch (error) {
    rethrowMenuWriteError(error);
  }
}

export async function deleteMenu(id: string) {
  try {
    const result = await withSerializableRetry(async (tx) => {
      const menu = await tx.menu.findUnique({
        where: { id },
        include: { _count: { select: { children: true } } },
      });
      if (!menu) throw new NotFoundError('菜单不存在');
      if (menu.isSystem) throw new ConflictError('内置菜单不可删除');
      if (menu._count.children > 0)
        throw new ConflictError('菜单存在子节点，不能删除');
      await tx.menu.delete({ where: { id } });
      return { id };
    });
    invalidatePermissionCache();
    return result;
  } catch (error) {
    rethrowMenuWriteError(error);
  }
}
