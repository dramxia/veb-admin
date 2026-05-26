export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { ConflictError, NotFoundError, ParamError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { menuUpdateSchema } from '@/lib/validation';


async function getMenuDepth(parentId?: string | null) {
  let depth = 1;
  let cursor = parentId;
  const visited = new Set<string>();
  while (cursor) {
    if (visited.has(cursor)) throw new ParamError('菜单父级存在循环');
    visited.add(cursor);
    const parent = await prisma.menu.findUnique({ where: { id: cursor }, select: { parentId: true } });
    if (!parent) throw new ParamError('父菜单不存在');
    depth += 1;
    cursor = parent.parentId;
  }
  return depth;
}

async function validateMenu(data: { type?: string; permissionCode?: string | null; parentId?: string | null }) {
  if (data.parentId !== undefined && await getMenuDepth(data.parentId) > 4) throw new ParamError('菜单深度不能超过 4 级');
  if (data.type === 'PAGE' && !data.permissionCode) throw new ParamError('PAGE 类型菜单必须绑定权限码');
  if (data.permissionCode) {
    const permission = await prisma.permission.findUnique({ where: { code: data.permissionCode } });
    if (!permission || permission.type !== 'MENU') throw new ParamError('菜单必须绑定 MENU 类型权限码');
  }
}

export const GET = withApi(async (_request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:menu:view');
  const menu = await prisma.menu.findUnique({ where: { id: params.id } });
  if (!menu) throw new NotFoundError('菜单不存在');
  return ok(menu);
});

export const PATCH = withApi(async (request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:menu:update');
  const old = await prisma.menu.findUnique({ where: { id: params.id } });
  if (!old) throw new NotFoundError('菜单不存在');
  const data = await readJson(request, menuUpdateSchema);
  await validateMenu({
    type: data.type ?? old.type,
    permissionCode: data.permissionCode ?? old.permissionCode,
    parentId: data.parentId ?? old.parentId,
  });
  const safeData = old.isSystem ? { name: data.name, icon: data.icon } : data;
  const menu = await prisma.menu.update({ where: { id: params.id }, data: safeData });
  invalidatePermissionCache();
  return ok(menu);
}, { action: 'menu.update', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });

export const DELETE = withApi(async (_request: Request, { params }: { params: { id: string } }) => {
  await requirePermission('system:menu:delete');
  const menu = await prisma.menu.findUnique({ where: { id: params.id } });
  if (!menu) throw new NotFoundError('菜单不存在');
  if (menu.isSystem) throw new ConflictError('内置菜单不可删除');
  await prisma.menu.delete({ where: { id: params.id } });
  invalidatePermissionCache();
  return ok({ id: params.id });
}, { action: 'menu.delete', target: (_request, ctx) => (ctx as { params: { id: string } }).params.id });
