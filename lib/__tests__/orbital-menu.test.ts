import { describe, expect, it } from 'vitest';
import type { MenuNode } from '@/lib/menu';
import {
  buildOrbitalMenuEntries,
  getCubicBezierPoint,
  getFlightControlPoints,
  getOrbitalPageIndex,
  ORBITAL_SLOTS,
  paginateOrbitalEntries,
} from '@/components/layout/orbital-menu-utils';

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

describe('orbital menu helpers', () => {
  it('flattens navigable pages while preserving tree order', () => {
    const menus = [
      createMenu('dashboard', '/'),
      createMenu('system', '/system', {
        type: 'DIR',
        children: [
          createMenu('user', '/system/user'),
          createMenu('logs', '/system/log', {
            type: 'DIR',
            children: [createMenu('operation', '/system/log/operation')],
          }),
        ],
      }),
      createMenu('docs', '/docs', {
        type: 'LINK',
        externalUrl: 'https://example.com/docs',
      }),
    ];

    const entries = buildOrbitalMenuEntries(menus);

    expect(entries.map((entry) => entry.menu.id)).toEqual([
      'dashboard',
      'user',
      'operation',
      'docs',
    ]);
    expect(entries.at(-1)).toMatchObject({
      href: 'https://example.com/docs',
      external: true,
    });
  });

  it('paginates at eight entries and resets slots on each page', () => {
    const entries = buildOrbitalMenuEntries(
      Array.from({ length: 10 }, (_, index) =>
        createMenu(`menu-${index}`, `/menu-${index}`),
      ),
    );

    const pages = paginateOrbitalEntries(entries);

    expect(pages.map((page) => page.length)).toEqual([8, 2]);
    expect(pages[0]?.[0]?.slot).toEqual(ORBITAL_SLOTS[0]);
    expect(pages[1]?.[0]?.slot).toEqual(ORBITAL_SLOTS[0]);
  });

  it('opens the page that contains the most specific current route', () => {
    const entries = buildOrbitalMenuEntries(
      Array.from({ length: 10 }, (_, index) =>
        createMenu(`menu-${index}`, `/menu-${index}`),
      ),
    );

    expect(getOrbitalPageIndex(entries, '/menu-8/detail')).toBe(1);
    expect(getOrbitalPageIndex(entries, '/unknown')).toBe(0);
  });

  it('keeps a menu color stable when its position changes', () => {
    const target = createMenu('stable-menu', '/stable');
    const original = buildOrbitalMenuEntries([target])[0];
    const reordered = buildOrbitalMenuEntries([
      createMenu('before', '/before'),
      target,
    ])[1];

    expect(reordered?.tone).toEqual(original?.tone);
  });

  it('creates a curved flight path with exact endpoints', () => {
    const start = { x: 1000, y: 760 };
    const end = { x: 600, y: 400 };
    const { first, second } = getFlightControlPoints(start, end);
    const midpoint = getCubicBezierPoint(start, first, second, end, 0.5);

    expect(getCubicBezierPoint(start, first, second, end, 0)).toEqual(start);
    expect(getCubicBezierPoint(start, first, second, end, 1)).toEqual(end);
    expect(midpoint.x).not.toBe((start.x + end.x) / 2);
    expect(midpoint.y).toBeLessThan((start.y + end.y) / 2);
  });
});
