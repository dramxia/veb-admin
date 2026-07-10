export type MenuHierarchySource = {
  id: string;
  name: string;
  parentId: string | null;
  sort: number;
};

export type MenuStructureState = 'normal' | 'orphan' | 'cycle';

export type MenuHierarchyRow<TMenu extends MenuHierarchySource> = {
  childCount: number;
  depth: number;
  menu: TMenu;
  structure: MenuStructureState;
};

type IndexedMenu<TMenu extends MenuHierarchySource> = {
  index: number;
  menu: TMenu;
};

function compareMenus<TMenu extends MenuHierarchySource>(
  left: IndexedMenu<TMenu>,
  right: IndexedMenu<TMenu>,
) {
  return (
    left.menu.sort - right.menu.sort ||
    left.menu.name.localeCompare(right.menu.name, 'zh-CN') ||
    left.index - right.index
  );
}

function findCyclicIds<TMenu extends MenuHierarchySource>(
  menusById: Map<string, IndexedMenu<TMenu>>,
) {
  const cyclicIds = new Set<string>();
  const processedIds = new Set<string>();

  for (const { menu } of menusById.values()) {
    if (processedIds.has(menu.id)) continue;

    const path: string[] = [];
    const pathIndexes = new Map<string, number>();
    let currentId: string | null = menu.id;

    while (currentId && menusById.has(currentId)) {
      const cycleStart = pathIndexes.get(currentId);
      if (cycleStart !== undefined) {
        path.slice(cycleStart).forEach((id) => cyclicIds.add(id));
        break;
      }
      if (processedIds.has(currentId)) break;

      pathIndexes.set(currentId, path.length);
      path.push(currentId);
      currentId = menusById.get(currentId)?.menu.parentId ?? null;
    }

    path.forEach((id) => processedIds.add(id));
  }

  return cyclicIds;
}

/**
 * 以兄弟节点排序为基础执行前序深度优先遍历，父节点后立即跟随完整子树。
 * 孤儿节点和循环节点也会安全展示，避免异常数据导致节点丢失或死循环。
 */
export function buildMenuHierarchy<TMenu extends MenuHierarchySource>(
  menus: TMenu[],
): MenuHierarchyRow<TMenu>[] {
  const indexedMenus = menus.map((menu, index) => ({ index, menu }));
  const menusById = new Map(
    indexedMenus.map((item) => [item.menu.id, item] as const),
  );
  const childrenByParentId = new Map<string | null, IndexedMenu<TMenu>[]>();

  for (const item of indexedMenus) {
    const parentId =
      item.menu.parentId && menusById.has(item.menu.parentId)
        ? item.menu.parentId
        : null;
    const siblings = childrenByParentId.get(parentId) ?? [];
    siblings.push(item);
    childrenByParentId.set(parentId, siblings);
  }

  for (const siblings of childrenByParentId.values()) {
    siblings.sort(compareMenus);
  }

  const cyclicIds = findCyclicIds(menusById);
  const visitedIds = new Set<string>();
  const rows: MenuHierarchyRow<TMenu>[] = [];

  function visit(item: IndexedMenu<TMenu>, depth: number) {
    if (visitedIds.has(item.menu.id)) return;
    visitedIds.add(item.menu.id);

    const hasMissingParent = Boolean(
      item.menu.parentId && !menusById.has(item.menu.parentId),
    );
    const structure: MenuStructureState = cyclicIds.has(item.menu.id)
      ? 'cycle'
      : hasMissingParent
        ? 'orphan'
        : 'normal';
    const children = (childrenByParentId.get(item.menu.id) ?? []).filter(
      (child) => !visitedIds.has(child.menu.id),
    );

    rows.push({
      childCount: children.length,
      depth,
      menu: item.menu,
      structure,
    });
    children.forEach((child) => visit(child, depth + 1));
  }

  (childrenByParentId.get(null) ?? []).forEach((root) => visit(root, 0));

  // 无根循环不会出现在正常根节点集合中，先展示循环分量，确保其正常后代
  // 不会被错误提升为根节点。
  [...indexedMenus]
    .filter((item) => cyclicIds.has(item.menu.id))
    .sort(compareMenus)
    .forEach((item) => visit(item, 0));

  // 最后补充孤儿节点等未访问数据。
  [...indexedMenus].sort(compareMenus).forEach((item) => visit(item, 0));

  return rows;
}

export function collectDescendantIds<TMenu extends MenuHierarchySource>(
  menus: TMenu[],
  menuId: string,
) {
  const childrenByParentId = new Map<string, string[]>();
  for (const menu of menus) {
    if (!menu.parentId) continue;
    const childIds = childrenByParentId.get(menu.parentId) ?? [];
    childIds.push(menu.id);
    childrenByParentId.set(menu.parentId, childIds);
  }

  const descendants = new Set<string>();
  const visited = new Set<string>([menuId]);
  const pending = [...(childrenByParentId.get(menuId) ?? [])];

  while (pending.length > 0) {
    const currentId = pending.pop();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    descendants.add(currentId);
    pending.push(...(childrenByParentId.get(currentId) ?? []));
  }

  return descendants;
}
