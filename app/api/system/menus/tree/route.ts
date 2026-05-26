export const dynamic = 'force-dynamic';

import { ok, withApi } from '@/lib/api';
import { requirePermission } from '@/lib/permission';
import { prisma } from '@/lib/prisma';

type MenuItem = Awaited<ReturnType<typeof prisma.menu.findMany>>[number] & { children?: MenuItem[] };

function buildTree(items: MenuItem[]) {
  const map = new Map<string, MenuItem>();
  const roots: MenuItem[] = [];
  for (const item of items) map.set(item.id, { ...item, children: [] });
  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) map.get(item.parentId)!.children!.push(item);
    else roots.push(item);
  }
  return roots;
}

export const GET = withApi(async () => {
  await requirePermission('system:menu:view');
  const items = await prisma.menu.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] });
  return ok({ items: buildTree(items) });
});
