import { describe, expect, it } from 'vitest';
import type { MenuDto, MenuNode } from '@veb/api-contracts';
import {
  flattenNavigableMenus,
  getCurrentMenu,
  getHref,
  getRouteLabel,
  isMenuBranchActive,
  normalizeMenuPath,
} from '@/components/layout/navigation-utils';

function createMenu(
  id: string,
  path: string | null,
  options?: {
    type?: MenuDto['type'];
    children?: MenuNode[];
    externalUrl?: string | null;
  },
): MenuNode {
  const type = options?.type ?? 'PAGE';
  return {
    id,
    moduleId: 'module-admin',
    parentId: null,
    name: id,
    description: null,
    path,
    component: type === 'PAGE' ? 'example/page' : null,
    icon: null,
    sort: 0,
    type,
    permissionCode: type === 'DIR' ? null : `${id}:view`,
    visible: true,
    status: 'ENABLED',
    externalUrl: options?.externalUrl ?? null,
    children: options?.children ?? [],
  } as MenuNode;
}

describe('workspace navigation', () => {
  it('keeps canonical absolute PAGE paths stable', () => {
    expect(normalizeMenuPath('/admin')).toBe('/admin');
    expect(normalizeMenuPath('/admin/system/user/')).toBe('/admin/system/user');
    expect(normalizeMenuPath(null)).toBe('');
  });

  it('uses PAGE paths and LINK URLs without a module path prefix', () => {
    expect(getHref(createMenu('users', '/admin/system/user'))).toBe(
      '/admin/system/user',
    );
    expect(
      getHref(
        createMenu('docs', null, {
          type: 'LINK',
          externalUrl: 'https://example.com/docs',
        }),
      ),
    ).toBe('https://example.com/docs');
    expect(getHref(createMenu('directory', null, { type: 'DIR' }))).toBe('');
    expect(getHref(createMenu('create', null, { type: 'BUTTON' }))).toBe('');
  });

  it('selects the deepest PAGE for nested application routes', () => {
    const operation = createMenu('operation', '/admin/system/log/operation');
    const menus = [
      createMenu('dashboard', '/admin'),
      createMenu('system', null, {
        type: 'DIR',
        children: [
          createMenu('logs', null, {
            type: 'DIR',
            children: [operation],
          }),
        ],
      }),
    ];

    expect(getCurrentMenu('/admin/system/log/operation/42', menus)?.id).toBe(
      'operation',
    );
    expect(getRouteLabel('/admin/system/log/operation/42', menus)).toBe(
      'operation',
    );
    expect(
      isMenuBranchActive('/admin/system/log/operation/42', menus[1]!),
    ).toBe(true);
  });

  it('never treats LINK or BUTTON nodes as route owners', () => {
    const menus = [
      createMenu('docs', '/admin/docs', {
        type: 'LINK',
        externalUrl: 'https://example.com/docs',
      }),
      createMenu('edit', '/admin/docs', { type: 'BUTTON' }),
    ];

    expect(getCurrentMenu('/admin/docs', menus)).toBeUndefined();
    expect(isMenuBranchActive('/admin/docs', menus[0]!)).toBe(false);
  });

  it('excludes BUTTON nodes from flattened navigation data', () => {
    const button = createMenu('edit', null, { type: 'BUTTON' });
    const page = createMenu('users', '/admin/system/user', {
      children: [button],
    });
    const directory = createMenu('system', null, {
      type: 'DIR',
      children: [page],
    });

    expect(flattenNavigableMenus([directory]).map(({ id }) => id)).toEqual([
      'users',
    ]);
  });
});
