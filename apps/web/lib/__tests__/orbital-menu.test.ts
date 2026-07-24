import { describe, expect, it } from 'vitest';
import type { MenuDto, MenuNode } from '@veb/api-contracts';
import {
  buildOrbitalMenuEntries,
  getCubicBezierPoint,
  getFlightControlPoints,
  getOrbitalMenuTrail,
  getViewportCoverScale,
  getWheelItemAngle,
  getWheelPlacement,
  getWheelRotationForItem,
  normalizeWheelAngle,
  ORBITAL_STYLES,
  WHEEL_FADE_ANGLE,
} from '@/components/layout/orbital-menu-utils';

function createMenu(
  id: string,
  path: string | null,
  options?: {
    type?: MenuDto['type'];
    children?: MenuNode[];
    externalUrl?: string | null;
  },
): MenuNode {
  return {
    id,
    moduleId: 'module-admin',
    parentId: null,
    name: id,
    description: null,
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
  } as MenuNode;
}

describe('orbital menu helpers', () => {
  it('builds one wheel level without flattening child menus', () => {
    const menus = [
      createMenu('dashboard', '/admin'),
      createMenu('system', '/admin/system', {
        type: 'DIR',
        children: [
          createMenu('user', '/admin/system/user'),
          createMenu('logs', '/admin/system/log', {
            type: 'DIR',
            children: [createMenu('operation', '/admin/system/log/operation')],
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
      'system',
      'docs',
    ]);
    expect(entries[1]?.menu.children.map((menu) => menu.id)).toEqual([
      'user',
      'logs',
    ]);
    expect(entries.at(-1)).toMatchObject({
      href: 'https://example.com/docs',
      external: true,
    });
  });

  it('excludes BUTTON nodes from wheel entries and trails', () => {
    const button = createMenu('edit', null, { type: 'BUTTON' });

    expect(buildOrbitalMenuEntries([button])).toEqual([]);
    expect(getOrbitalMenuTrail([button], button.id)).toEqual([]);
  });

  it('finds the complete menu trail for restoring nested wheels', () => {
    const operation = createMenu('operation', '/admin/system/log/operation');
    const logs = createMenu('logs', '/admin/system/log', {
      type: 'DIR',
      children: [operation],
    });
    const system = createMenu('system', '/admin/system', {
      type: 'DIR',
      children: [createMenu('user', '/admin/system/user'), logs],
    });

    expect(
      getOrbitalMenuTrail([system], operation.id).map((menu) => menu.id),
    ).toEqual(['system', 'logs', 'operation']);
    expect(getOrbitalMenuTrail([system], 'missing')).toEqual([]);
  });

  it('distributes wheel items evenly around the circle', () => {
    expect(getWheelItemAngle(0, 8)).toBe(0);
    expect(getWheelItemAngle(2, 8)).toBe(90);
    expect(getWheelItemAngle(4, 8)).toBe(180);
    expect(getWheelItemAngle(0, 0)).toBe(0);
  });

  it('normalizes angles into the [-180, 180) range', () => {
    expect(normalizeWheelAngle(0)).toBe(0);
    expect(normalizeWheelAngle(190)).toBe(-170);
    expect(normalizeWheelAngle(-270)).toBe(90);
    expect(normalizeWheelAngle(540)).toBe(-180);
  });

  it('shows items on the screen-facing half and hides the rest', () => {
    const count = 8;
    const radius = 80;
    // rotation 180° 把第 0 项转到屏幕正内侧
    const front = getWheelPlacement(0, count, 180, radius);
    // 第 0 项初始角度 0° 指向屏幕外，不可见
    const back = getWheelPlacement(0, count, 0, radius);

    expect(Math.abs(front.angle)).toBe(180);
    expect(front.visible).toBe(true);
    expect(front.opacity).toBe(1);
    expect(front.x).toBeCloseTo(-radius);
    expect(front.y).toBe(0);
    expect(back.visible).toBe(false);
    expect(back.opacity).toBe(0);
  });

  it('keeps invalid or empty wheel geometry hidden', () => {
    expect(getWheelPlacement(0, 0, 180, 80)).toMatchObject({
      x: 0,
      y: 0,
      opacity: 0,
      visible: false,
    });
    expect(getWheelPlacement(0, 1, 180, 0).visible).toBe(false);
    expect(getWheelRotationForItem(0, 0, 42)).toBe(42);
    expect(normalizeWheelAngle(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('fades items gradually while crossing the screen edge', () => {
    const count = 8;
    const radius = 80;
    // 第 0 项转到 90° + 淡出区间的一半
    const halfway = getWheelPlacement(
      0,
      count,
      90 + WHEEL_FADE_ANGLE / 2,
      radius,
    );

    expect(halfway.visible).toBe(true);
    expect(halfway.opacity).toBeGreaterThan(0.4);
    expect(halfway.opacity).toBeLessThan(0.6);
    expect(halfway.scale).toBeLessThan(1);
  });

  it('loops infinitely: rotation + 360° lands on the same spot', () => {
    const first = getWheelPlacement(3, 7, 45, 80);
    const second = getWheelPlacement(3, 7, 45 + 360, 80);

    expect(second.x).toBeCloseTo(first.x);
    expect(second.y).toBeCloseTo(first.y);
    expect(second.angle).toBeCloseTo(first.angle);
  });

  it('rotates the requested item to the front via the shortest path', () => {
    const count = 8;
    // 目标角度 = 180 - index * step
    expect(getWheelRotationForItem(0, count, 0)).toBe(180);
    expect(getWheelRotationForItem(2, count, 0)).toBe(90);
    // 与当前旋转角取最短等价路径:当前 350° 时目标 180° 应取 540° 而非 180°
    const resolved = getWheelRotationForItem(0, count, 350);
    expect(Math.abs(resolved - 350)).toBeLessThanOrEqual(180);
    expect(Math.abs(getWheelPlacement(0, count, resolved, 80).angle)).toBe(180);
  });

  it('assigns a distinct glass style while the style set has capacity', () => {
    const entries = buildOrbitalMenuEntries(
      Array.from({ length: ORBITAL_STYLES.length }, (_, index) =>
        createMenu(`menu-${index}`, `/menu-${index}`),
      ),
    );
    const styles = entries.map((entry) => entry.style);
    const styleSignatures = styles.map(
      (style) => `${style.color}|${style.gradient}|${style.marker}`,
    );

    expect(new Set(styleSignatures).size).toBe(entries.length);
    expect(styles.every((style) => ORBITAL_STYLES.includes(style))).toBe(true);
    expect(
      styles.every((style) => style.gradient.includes('linear-gradient')),
    ).toBe(true);
  });

  it('keeps a menu style stable when the same menus are reordered', () => {
    const target = createMenu('stable-menu', '/stable');
    const before = createMenu('before', '/before');
    const after = createMenu('after', '/after');
    const original = buildOrbitalMenuEntries([before, target, after]).find(
      (entry) => entry.menu.id === target.id,
    );
    const reordered = buildOrbitalMenuEntries([
      after,
      target,
      createMenu('before', '/before'),
    ]).find((entry) => entry.menu.id === target.id);

    expect(original?.style).toBeDefined();
    expect(reordered?.style).toEqual(original?.style);
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

  it('scales the centered orb far enough to cover every viewport corner', () => {
    const center = { x: 320, y: 240 };
    const orbSize = 48;
    const scale = getViewportCoverScale(center, orbSize, {
      width: 1280,
      height: 800,
    });
    const scaledRadius = (orbSize * scale) / 2;
    const farthestCorner = Math.hypot(1280 - center.x, 800 - center.y);

    expect(scaledRadius).toBeGreaterThan(farthestCorner);
    expect(getViewportCoverScale(center, 0, { width: 1280, height: 800 })).toBe(
      1,
    );
  });
});
