export const dynamic = 'force-dynamic';

import { Prisma } from '@prisma/client';
import { ok, readJson, withApi } from '@/lib/api';
import { ConflictError, NotFoundError, ParamError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { menuUpdateSchema } from '@/lib/validation';

async function getMenuDepth(
  tx: Prisma.TransactionClient,
  parentId: string | null | undefined,
  currentMenuId: string,
) {
  let depth = 1;
  let cursor = parentId;
  const visited = new Set<string>([currentMenuId]);

  while (cursor) {
    if (visited.has(cursor))
      throw new ParamError('不能将菜单移动到自身或其后代');
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
  data: {
    type: string;
    permissionCode: string | null;
    parentId: string | null;
  },
  currentMenuId: string,
) {
  if ((await getMenuDepth(tx, data.parentId, currentMenuId)) > 4) {
    throw new ParamError('菜单深度不能超过 4 级');
  }
  if (data.type === 'PAGE' && !data.permissionCode) {
    throw new ParamError('PAGE 类型菜单必须绑定权限码');
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

export const GET = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:menu:view');
    const menu = await prisma.menu.findUnique({ where: { id: params.id } });
    if (!menu) throw new NotFoundError('菜单不存在');
    return ok(menu);
  },
);

export const PATCH = withApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:menu:update');
    const data = await readJson(request, menuUpdateSchema);

    const menu = await prisma.$transaction(
      async (tx) => {
        const old = await tx.menu.findUnique({ where: { id: params.id } });
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
            },
            params.id,
          );
        }

        const safeData = old.isSystem
          ? { name: data.name, icon: data.icon }
          : data;
        return tx.menu.update({ where: { id: params.id }, data: safeData });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    invalidatePermissionCache();
    return ok(menu);
  },
  {
    action: 'menu.update',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);

export const DELETE = withApi(
  async (_request: Request, { params }: { params: { id: string } }) => {
    await requirePermission('system:menu:delete');
    const menu = await prisma.menu.findUnique({ where: { id: params.id } });
    if (!menu) throw new NotFoundError('菜单不存在');
    if (menu.isSystem) throw new ConflictError('内置菜单不可删除');
    await prisma.menu.delete({ where: { id: params.id } });
    invalidatePermissionCache();
    return ok({ id: params.id });
  },
  {
    action: 'menu.delete',
    target: (_request, ctx) => (ctx as { params: { id: string } }).params.id,
  },
);
