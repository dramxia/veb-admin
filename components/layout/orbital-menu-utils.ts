import type { MenuNode } from '@/lib/menu';
import {
  flattenNavigableMenus,
  getHref,
  isActive,
  isExternalHref,
} from './navigation-utils';

export const ORBITAL_PAGE_SIZE = 8;

export type Point = { x: number; y: number };

export type OrbitalSlot = Point;

export type OrbitalTone = {
  start: string;
  middle: string;
  end: string;
  shadow: string;
};

export type OrbitalMenuEntry = {
  menu: MenuNode;
  href: string;
  external: boolean;
  slot: OrbitalSlot;
  tone: OrbitalTone;
};

export const ORBITAL_SLOTS: readonly OrbitalSlot[] = [
  { x: 72, y: 11 },
  { x: 46, y: 23 },
  { x: 75, y: 33 },
  { x: 36, y: 43 },
  { x: 70, y: 54 },
  { x: 31, y: 64 },
  { x: 57, y: 76 },
  { x: 75, y: 88 },
];

export const ORBITAL_TONES: readonly OrbitalTone[] = [
  {
    start: '#8ed8ff',
    middle: '#2798ff',
    end: '#2453d4',
    shadow: 'rgba(22, 119, 255, 0.42)',
  },
  {
    start: '#8ff3ee',
    middle: '#1fc7c2',
    end: '#087f8c',
    shadow: 'rgba(13, 148, 136, 0.4)',
  },
  {
    start: '#d5b8ff',
    middle: '#8b6cff',
    end: '#5b35c9',
    shadow: 'rgba(109, 93, 252, 0.42)',
  },
  {
    start: '#a7f3c1',
    middle: '#34c878',
    end: '#16834d',
    shadow: 'rgba(22, 163, 74, 0.4)',
  },
  {
    start: '#ffe69a',
    middle: '#f4b63f',
    end: '#c77712',
    shadow: 'rgba(217, 119, 6, 0.4)',
  },
  {
    start: '#ffb8d2',
    middle: '#f06499',
    end: '#bd2f67',
    shadow: 'rgba(219, 39, 119, 0.38)',
  },
  {
    start: '#b9e2ff',
    middle: '#4e91e8',
    end: '#31509d',
    shadow: 'rgba(49, 80, 157, 0.4)',
  },
  {
    start: '#ffd1ad',
    middle: '#f58a5f',
    end: '#bd4939',
    shadow: 'rgba(220, 83, 61, 0.4)',
  },
];

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function buildOrbitalMenuEntries(menus: MenuNode[]): OrbitalMenuEntry[] {
  return flattenNavigableMenus(menus).map((menu, index) => {
    const href = getHref(menu);
    return {
      menu,
      href,
      external: isExternalHref(href),
      slot: ORBITAL_SLOTS[index % ORBITAL_PAGE_SIZE]!,
      tone: ORBITAL_TONES[stableHash(menu.id) % ORBITAL_TONES.length]!,
    };
  });
}

export function paginateOrbitalEntries(
  entries: OrbitalMenuEntry[],
  pageSize = ORBITAL_PAGE_SIZE,
) {
  const pages: OrbitalMenuEntry[][] = [];
  for (let index = 0; index < entries.length; index += pageSize) {
    pages.push(
      entries.slice(index, index + pageSize).map((entry, slotIndex) => ({
        ...entry,
        slot: ORBITAL_SLOTS[slotIndex]!,
      })),
    );
  }
  return pages;
}

export function getOrbitalPageIndex(
  entries: OrbitalMenuEntry[],
  pathname: string,
  pageSize = ORBITAL_PAGE_SIZE,
) {
  const matchingIndex = entries
    .map((entry, index) => ({ entry, index }))
    .filter(
      ({ entry }) => !entry.external && isActive(pathname, entry.menu.path),
    )
    .sort(
      (a, b) => b.entry.menu.path.length - a.entry.menu.path.length,
    )[0]?.index;

  return matchingIndex === undefined ? 0 : Math.floor(matchingIndex / pageSize);
}

export function getFlightControlPoints(start: Point, end: Point) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.hypot(deltaX, deltaY);
  const lift = Math.min(180, Math.max(72, distance * 0.22));

  return {
    first: {
      x: start.x + deltaX * 0.18,
      y: start.y + deltaY * 0.12 - lift,
    },
    second: {
      x: start.x + deltaX * 0.72,
      y: start.y + deltaY * 0.72 - lift * 0.35,
    },
  };
}

export function getCubicBezierPoint(
  start: Point,
  first: Point,
  second: Point,
  end: Point,
  progress: number,
): Point {
  const t = Math.min(1, Math.max(0, progress));
  const inverse = 1 - t;

  return {
    x:
      inverse ** 3 * start.x +
      3 * inverse ** 2 * t * first.x +
      3 * inverse * t ** 2 * second.x +
      t ** 3 * end.x,
    y:
      inverse ** 3 * start.y +
      3 * inverse ** 2 * t * first.y +
      3 * inverse * t ** 2 * second.y +
      t ** 3 * end.y,
  };
}
