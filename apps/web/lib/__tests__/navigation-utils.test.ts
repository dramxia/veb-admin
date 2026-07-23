import { describe, expect, it } from 'vitest';
import type { MenuNode } from '@veb/api-contracts';
import {
  getCurrentMenu,
  getHref,
  getRouteLabel,
  isMenuBranchActive,
  normalizeAdminMenuPath,
} from '@/components/layout/navigation-utils';

function createMenu(
  id: string,
  path: string,
  options?: {
    type?: MenuNode['type'];
    children?: MenuNode[];
    externalUrl?: string | null;
  },
): MenuNode {
  return {
    id,
    parentId: null,
    name: id,
    path,
    component: null,
    icon: null,
    sort: 0,
    type: options?.type ?? 'PAGE',
    permissionCode: null,
    visible: true,
    status: 'ENABLED',
    externalUrl: options?.externalUrl ?? null,
    children: options?.children ?? [],
  };
}

describe('admin navigation compatibility', () => {
  it('normalizes legacy and relative menu paths into the admin namespace', () => {
    expect(normalizeAdminMenuPath('/')).toBe('/admin');
    expect(normalizeAdminMenuPath('/system/user')).toBe('/admin/system/user');
    expect(normalizeAdminMenuPath('content/article/')).toBe(
      '/admin/content/article',
    );
  });

  it('keeps already migrated paths stable and removes trailing slashes', () => {
    expect(normalizeAdminMenuPath('/admin')).toBe('/admin');
    expect(normalizeAdminMenuPath('/admin/system/user/')).toBe(
      '/admin/system/user',
    );
  });

  it('normalizes internal links while preserving explicit external links', () => {
    expect(getHref(createMenu('legacy', '/system/user'))).toBe(
      '/admin/system/user',
    );
    expect(
      getHref(
        createMenu('docs', '/docs', {
          type: 'LINK',
          externalUrl: 'https://example.com/docs',
        }),
      ),
    ).toBe('https://example.com/docs');
    expect(
      getHref(
        createMenu('legacy-docs', 'https://legacy.example.com/docs', {
          type: 'LINK',
        }),
      ),
    ).toBe('https://legacy.example.com/docs');
  });

  it('selects the deepest legacy-backed menu on an admin route', () => {
    const operation = createMenu('operation', '/system/log/operation');
    const menus = [
      createMenu('dashboard', '/'),
      createMenu('system', '/system', {
        type: 'DIR',
        children: [
          createMenu('logs', '/system/log', {
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

  it('ranks mixed legacy and migrated menus by their normalized paths', () => {
    const legacyChild = createMenu('legacy-child', '/system/user');
    const migratedParent = createMenu('migrated-parent', '/admin/system', {
      type: 'DIR',
      children: [legacyChild],
    });

    expect(
      getCurrentMenu('/admin/system/user/detail', [migratedParent])?.id,
    ).toBe('legacy-child');
    expect(getRouteLabel('/admin/system/user/detail', [migratedParent])).toBe(
      'legacy-child',
    );
  });

  it('uses the dashboard label for the admin module home', () => {
    expect(getRouteLabel('/admin', [])).toBe('仪表盘');
  });
});
