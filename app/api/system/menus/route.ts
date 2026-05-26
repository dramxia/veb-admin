export const dynamic = 'force-dynamic';

import { ok, readJson, withApi } from '@/lib/api';
import { ParamError } from '@/lib/errors';
import { requirePermission } from '@/lib/permission';
import { invalidatePermissionCache } from '@/lib/permission-cache';
import { prisma } from '@/lib/prisma';
import { menuSchema } from '@/lib/validation';


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
  if (await getMenuDepth(data.parentId) > 4) throw new ParamError('菜单深度不能超过 4 级');
  if (data.type === 'PAGE' && !data.permissionCode) throw new ParamError('PAGE 类型菜单必须绑定权限码');
  if (data.permissionCode) {
    const permission = await prisma.permission.findUnique({ where: { code: data.permissionCode } });
    if (!permission || permission.type !== 'MENU') throw new ParamError('菜单必须绑定 MENU 类型权限码');
  }
}

export const GET = withApi(async () => {
  await requirePermission('system:menu:view');
  const items = await prisma.menu.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] });
  return ok({ items });
});

export const POST = withApi(async (request: Request) => {
  await requirePermission('system:menu:create');
  const data = await readJson(request, menuSchema);
  await validateMenu(data);
  const menu = await prisma.menu.create({ data });
  invalidatePermissionCache();
  return ok(menu);
}, { action: 'menu.create' });
