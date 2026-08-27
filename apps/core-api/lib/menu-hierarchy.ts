type MenuHierarchyEntry = {
  id: string;
  moduleId: string;
  parentId: string | null;
  status: string;
  visible: boolean;
};

function createAncestryCheck(
  entries: Map<string, MenuHierarchyEntry>,
  predicate: (entry: MenuHierarchyEntry) => boolean,
) {
  const memo = new Map<string, boolean>();

  const visit = (id: string, visiting: Set<string>): boolean => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;

    const entry = entries.get(id);
    if (!entry || visiting.has(id) || !predicate(entry)) {
      memo.set(id, false);
      return false;
    }
    if (!entry.parentId) {
      memo.set(id, true);
      return true;
    }

    const parent = entries.get(entry.parentId);
    if (!parent || parent.moduleId !== entry.moduleId) {
      memo.set(id, false);
      return false;
    }

    const next = new Set(visiting);
    next.add(id);
    const result = visit(parent.id, next);
    memo.set(id, result);
    return result;
  };

  return (id: string) => visit(id, new Set());
}

export function createMenuHierarchy<T extends MenuHierarchyEntry>(
  entries: T[],
) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return {
    byId,
    isEnabled: createAncestryCheck(byId, (entry) => entry.status === 'ENABLED'),
    isVisible: createAncestryCheck(byId, (entry) => entry.visible),
  };
}
