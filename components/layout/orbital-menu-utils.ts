import type { MenuNode } from '@/lib/menu';
import {
  flattenNavigableMenus,
  getHref,
  isExternalHref,
} from './navigation-utils';

export type Point = { x: number; y: number };

export type OrbitalMenuMarker =
  | 'dash'
  | 'dot'
  | 'square'
  | 'ring'
  | 'diamond'
  | 'double';

export type OrbitalMenuStyle = {
  color: string;
  surface: string;
  marker: OrbitalMenuMarker;
};

export type OrbitalMenuEntry = {
  menu: MenuNode;
  href: string;
  external: boolean;
  style: OrbitalMenuStyle;
};

export type WheelPlacement = {
  /** 相对转盘圆心的水平偏移(px)，负值指向屏幕内侧 */
  x: number;
  /** 相对转盘圆心的垂直偏移(px) */
  y: number;
  /** 归一化到 [-180, 180) 的当前角度，0° 指向屏幕外(右侧) */
  angle: number;
  /** 依据进入屏幕内侧的深度计算的透明度 0~1 */
  opacity: number;
  /** 依据透明度计算的缩放，营造出入转盘的纵深 */
  scale: number;
  /** 是否处于可见半区(屏幕内侧一半) */
  visible: boolean;
};

/** 菜单项相对圆心的轨道半径占转盘半径的比例 */
export const WHEEL_ORBIT_RATIO = 0.72;

/** 菜单项从屏幕边缘进入时的淡出角度区间(度) */
export const WHEEL_FADE_ANGLE = 26;

const WHEEL_VALUE_PRECISION = 1_000_000;

function roundWheelValue(value: number) {
  const rounded =
    Math.round(value * WHEEL_VALUE_PRECISION) / WHEEL_VALUE_PRECISION;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** 扁平、低饱和的扇区样式；颜色与几何标记共同区分菜单项。 */
export const ORBITAL_STYLES: readonly OrbitalMenuStyle[] = [
  { color: '#54718f', surface: 'rgba(225, 234, 242, 0.76)', marker: 'dash' },
  { color: '#4e7a70', surface: 'rgba(224, 237, 233, 0.76)', marker: 'dot' },
  { color: '#8b7047', surface: 'rgba(241, 234, 219, 0.76)', marker: 'square' },
  { color: '#8c626d', surface: 'rgba(241, 228, 232, 0.76)', marker: 'ring' },
  { color: '#6f7a4e', surface: 'rgba(234, 237, 221, 0.76)', marker: 'diamond' },
  { color: '#6e6a8c', surface: 'rgba(234, 232, 241, 0.76)', marker: 'double' },
  { color: '#527783', surface: 'rgba(226, 236, 239, 0.76)', marker: 'dash' },
  { color: '#8a6855', surface: 'rgba(241, 231, 225, 0.76)', marker: 'dot' },
  { color: '#5d6685', surface: 'rgba(230, 232, 240, 0.76)', marker: 'square' },
  { color: '#57775f', surface: 'rgba(226, 236, 228, 0.76)', marker: 'ring' },
  { color: '#87636f', surface: 'rgba(239, 229, 233, 0.76)', marker: 'diamond' },
  { color: '#837442', surface: 'rgba(240, 235, 219, 0.76)', marker: 'double' },
];

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function buildOrbitalMenuEntries(menus: MenuNode[]): OrbitalMenuEntry[] {
  const navigableMenus = flattenNavigableMenus(menus);
  const assignedStyles = new Map<string, OrbitalMenuStyle>();
  const claimedStyleIndexes = new Set<number>();

  // 排序后再做开放寻址，既不受菜单展示顺序影响，也避免同一转盘内样式碰撞。
  [...new Set(navigableMenus.map((menu) => menu.id))]
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .forEach((menuId) => {
      const preferredIndex = stableHash(menuId) % ORBITAL_STYLES.length;
      let styleIndex = preferredIndex;

      if (claimedStyleIndexes.size < ORBITAL_STYLES.length) {
        for (let offset = 0; offset < ORBITAL_STYLES.length; offset += 1) {
          const candidateIndex =
            (preferredIndex + offset) % ORBITAL_STYLES.length;
          if (!claimedStyleIndexes.has(candidateIndex)) {
            styleIndex = candidateIndex;
            break;
          }
        }
      }

      claimedStyleIndexes.add(styleIndex);
      assignedStyles.set(menuId, ORBITAL_STYLES[styleIndex]!);
    });

  return navigableMenus.map((menu) => {
    const href = getHref(menu);
    return {
      menu,
      href,
      external: isExternalHref(href),
      style: assignedStyles.get(menu.id)!,
    };
  });
}

/** 将角度归一化到 [-180, 180) 区间 */
export function normalizeWheelAngle(angle: number) {
  if (!Number.isFinite(angle)) return 0;
  return ((((angle + 180) % 360) + 360) % 360) - 180;
}

/** 菜单项在转盘上的初始角度，沿圆环均匀分布 */
export function getWheelItemAngle(index: number, count: number) {
  if (!Number.isFinite(index) || !Number.isFinite(count) || count <= 0) {
    return 0;
  }
  return (index * 360) / count;
}

/**
 * 计算菜单项在转盘上的位置。
 * 转盘圆心位于屏幕右缘:0° 指向屏幕外(不可见),±180° 指向屏幕正内侧(完全可见)，
 * 旋转角每增减 360° 位置完全一致，因此滚动是无限循环的。
 */
export function getWheelPlacement(
  index: number,
  count: number,
  rotation: number,
  orbitRadius: number,
): WheelPlacement {
  if (
    !Number.isFinite(index) ||
    !Number.isFinite(count) ||
    count <= 0 ||
    !Number.isFinite(rotation) ||
    !Number.isFinite(orbitRadius) ||
    orbitRadius <= 0
  ) {
    return {
      x: 0,
      y: 0,
      angle: 0,
      opacity: 0,
      scale: 0.68,
      visible: false,
    };
  }

  const angle = normalizeWheelAngle(getWheelItemAngle(index, count) + rotation);
  const radians = (angle * Math.PI) / 180;
  // 进入屏幕内侧的深度:|angle| > 90° 即进入可见半区
  const depth = Math.abs(angle) - 90;
  const opacity = Math.min(1, Math.max(0, depth / WHEEL_FADE_ANGLE));

  return {
    // 固定精度，避免 Node 与浏览器的三角函数末位差异触发 React 水合告警。
    x: roundWheelValue(Math.cos(radians) * orbitRadius),
    y: roundWheelValue(Math.sin(radians) * orbitRadius),
    angle: roundWheelValue(angle),
    opacity: roundWheelValue(opacity),
    scale: roundWheelValue(0.68 + opacity * 0.32),
    visible: opacity > 0,
  };
}

/**
 * 计算把指定菜单项转到屏幕正内侧(180°)所需的旋转角，
 * 并取与当前旋转角最接近的等价角度，保证无限循环下最短路径过渡。
 */
export function getWheelRotationForItem(
  index: number,
  count: number,
  currentRotation: number,
) {
  if (!Number.isFinite(currentRotation)) return 0;
  if (!Number.isFinite(index) || !Number.isFinite(count) || count <= 0) {
    return currentRotation;
  }

  const target = 180 - getWheelItemAngle(index, count);
  return target + Math.round((currentRotation - target) / 360) * 360;
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

export function getViewportCoverScale(
  center: Point,
  orbSize: number,
  viewport: { width: number; height: number },
) {
  if (!Number.isFinite(orbSize) || orbSize <= 0) return 1;

  const farthestX = Math.max(center.x, viewport.width - center.x);
  const farthestY = Math.max(center.y, viewport.height - center.y);
  const coverDiameter = Math.hypot(farthestX, farthestY) * 2;

  return Math.max(1, (coverDiameter / orbSize) * 1.04);
}
