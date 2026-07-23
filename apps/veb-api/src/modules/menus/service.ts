import type { z } from 'zod';
import { Prisma, type Menu } from '@/generated/client';
import { ConflictError, NotFoundError, ParamError } from '@/lib/errors';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { menuSchema, menuUpdateSchema } from '@/lib/validation';

type MenuCreateData = z.infer<typeof menuSchema>;
type MenuUpdateData = z.infer<typeof menuUpdateSchema>;
type MenuTreeItem = Menu & { children: MenuTreeItem[] };

async function getMenuDepth(
  tx: Prisma.TransactionClient,
  parentId: string | null | undefined,
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
      select: { parentId: true },
    });
    if (!parent) throw new ParamError('父菜单不存在');
    depth += 1;
    cursor = parent.parentId;
  }
  return depth;
}

async function validateMenu(
  tx: Prisma.TransactionClient,
  data: Pick<
    MenuCreateData,
    'type' | 'permissionCode' | 'parentId' | 'externalUrl'
  >,
  currentMenuId?: string,
) {
  if ((await getMenuDepth(tx, data.parentId, currentMenuId)) > 4) {
    throw new ParamError('菜单深度不能超过 4 级');
  }
  if (data.type === 'PAGE' && !data.permissionCode) {
    throw new ParamError('PAGE 类型菜单必须绑定权限码');
  }
  if (data.type === 'LINK' && !data.externalUrl) {
    throw new ParamError('LINK 类型菜单必须设置外链地址');
  }
  if (data.permissionCode) {
    const permission = await tx.permission.findUnique({
      where: { code: data.permissionCode },
    });
    if (!permission || permission.type !== 'MENU') {
      throw new ParamError('菜单必须绑定 MENU 类型权限码');
    }
  }
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

export async function listMenus() {
  const items = await prisma.menu.findMany({
    orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
  });
  return { items };
}

export async function getMenuTree() {
  const items = await prisma.menu.findMany({
    orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
  });
  return { items: buildTree(items) };
}

export async function createMenu(data: MenuCreateData) {
  await validateMenu(prisma, data);
  const menu = await prisma.menu.create({ data });
  invalidatePermissionCache();
  return menu;
}

export async function getMenu(id: string) {
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) throw new NotFoundError('菜单不存在');
  return menu;
}

export async function updateMenu(id: string, data: MenuUpdateData) {
  const menu = await prisma.$transaction(
    async (tx) => {
      const old = await tx.menu.findUnique({ where: { id } });
      if (!old) throw new NotFoundError('菜单不存在');

      if (!old.isSystem) {
        await validateMenu(
          tx,
          {
            type: data.type !== undefined ? data.type : old.type,
            permissionCode:
              data.permissionCode !== undefined
                ? data.permissionCode
                : old.permissionCode,
            parentId:
              data.parentId !== undefined ? data.parentId : old.parentId,
            externalUrl:
              data.externalUrl !== undefined
                ? data.externalUrl
                : old.externalUrl,
          },
          id,
        );
      }

      const safeData = old.isSystem
        ? { name: data.name, icon: data.icon }
        : data;
      return tx.menu.update({ where: { id }, data: safeData });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  invalidatePermissionCache();
  return menu;
}

export async function deleteMenu(id: string) {
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) throw new NotFoundError('菜单不存在');
  if (menu.isSystem) throw new ConflictError('内置菜单不可删除');
  await prisma.menu.delete({ where: { id } });
  invalidatePermissionCache();
  return { id };
}
