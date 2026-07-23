import { describe, expect, it } from 'vitest';
import {
  buildMenuHierarchy,
  collectDescendantIds,
} from '@/app/(workspace)/admin/system/menu/menu-hierarchy';

type Menu = {
  id: string;
  name: string;
  parentId: string | null;
  sort: number;
};

const menu = (id: string, parentId: string | null, sort: number): Menu => ({
  id,
  name: id,
  parentId,
  sort,
});

describe('menu hierarchy', () => {
  it('按父节点优先的深度顺序输出完整子树', () => {
    const rows = buildMenuHierarchy([
      menu('root-b', null, 2),
      menu('child-a2', 'root-a', 2),
      menu('root-a', null, 1),
      menu('child-a1', 'root-a', 1),
      menu('grandchild', 'child-a1', 1),
    ]);

    expect(rows.map((row) => [row.menu.id, row.depth])).toEqual([
      ['root-a', 0],
      ['child-a1', 1],
      ['grandchild', 2],
      ['child-a2', 1],
      ['root-b', 0],
    ]);
  });

  it('循环节点先于其正常后代展示，且不重复计算回边子项', () => {
    const rows = buildMenuHierarchy([
      menu('a', 'b', 1),
      menu('b', 'a', 2),
      menu('child', 'a', 0),
    ]);
    const byId = new Map(rows.map((row) => [row.menu.id, row]));

    expect(rows.map((row) => row.menu.id)).toEqual(['a', 'child', 'b']);
    expect(byId.get('a')).toMatchObject({ depth: 0, structure: 'cycle' });
    expect(byId.get('child')).toMatchObject({ depth: 1, structure: 'normal' });
    expect(byId.get('b')).toMatchObject({ childCount: 0, structure: 'cycle' });
  });

  it('收集后代时能够安全处理循环数据', () => {
    const descendants = collectDescendantIds(
      [menu('a', 'b', 1), menu('b', 'a', 2), menu('child', 'a', 0)],
      'a',
    );

    expect([...descendants].sort()).toEqual(['b', 'child']);
  });
});
