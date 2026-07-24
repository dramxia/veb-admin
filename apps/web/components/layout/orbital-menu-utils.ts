import type { MenuNode } from '@veb/api-contracts';
import { getHref, isButtonMenu, isExternalHref } from './navigation-utils';

export type Point = { x: number; y: number };

export type OrbitalMenuMarker =
  | 'dash'
  | 'dot'
  | 'square'
  | 'ring'
  | 'diamond'
  | 'double';

export type OrbitalMenuStyle = {
  /** 强调色：标签文字、激活描边、聚焦环 */
  color: string;
  /** 液态玻璃基底：淡亮多段渐变（半透明，配合背景模糊） */
  gradient: string;
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

/**
 * 每项独立的液态玻璃样式：淡亮双色渐变（均为高明度浅色，不含暗色）
 * 搭配中明度强调色，用于标签文字、激活描边与聚焦环。
 */
export const ORBITAL_STYLES: readonly OrbitalMenuStyle[] = [
  {
    color: '#3f6f9e',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.48) 0%, rgba(207,232,255,0.38) 42%, rgba(202,244,249,0.3) 100%)',
    marker: 'dash',
  },
  {
    color: '#3f8a6c',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.48) 0%, rgba(203,248,226,0.38) 44%, rgba(218,247,240,0.3) 100%)',
    marker: 'dot',
  },
  {
    color: '#a06a3c',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.5) 0%, rgba(255,231,207,0.4) 45%, rgba(255,242,215,0.3) 100%)',
    marker: 'square',
  },
  {
    color: '#a44c64',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.48) 0%, rgba(255,220,230,0.38) 43%, rgba(255,232,237,0.3) 100%)',
    marker: 'ring',
  },
  {
    color: '#6a589e',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.5) 0%, rgba(229,220,255,0.38) 46%, rgba(222,234,255,0.3) 100%)',
    marker: 'diamond',
  },
  {
    color: '#8f7030',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.5) 0%, rgba(255,239,194,0.4) 44%, rgba(255,248,220,0.3) 100%)',
    marker: 'double',
  },
  {
    color: '#3f7f8c',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.48) 0%, rgba(202,242,248,0.38) 43%, rgba(213,250,235,0.3) 100%)',
    marker: 'dash',
  },
  {
    color: '#568348',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.5) 0%, rgba(228,248,202,0.4) 45%, rgba(211,246,224,0.3) 100%)',
    marker: 'dot',
  },
  {
    color: '#4c5da0',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.49) 0%, rgba(218,226,255,0.38) 42%, rgba(226,240,255,0.3) 100%)',
    marker: 'square',
  },
  {
    color: '#478457',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.5) 0%, rgba(218,246,222,0.38) 44%, rgba(235,250,217,0.3) 100%)',
    marker: 'ring',
  },
  {
    color: '#93507f',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.49) 0%, rgba(249,220,244,0.38) 43%, rgba(255,231,240,0.3) 100%)',
    marker: 'diamond',
  },
  {
    color: '#8f6f2c',
    gradient:
      'linear-gradient(138deg, rgba(255,255,255,0.5) 0%, rgba(255,236,190,0.4) 45%, rgba(255,243,215,0.3) 100%)',
    marker: 'double',
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
  const navigableMenus = menus.filter((menu) => !isButtonMenu(menu));
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

/** 返回从一级菜单到目标菜单的完整层级路径。 */
export function getOrbitalMenuTrail(
  menus: MenuNode[],
  targetId: string,
): MenuNode[] {
  for (const menu of menus) {
    if (isButtonMenu(menu)) continue;
    if (menu.id === targetId) return [menu];

    const childTrail = getOrbitalMenuTrail(menu.children, targetId);
    if (childTrail.length > 0) return [menu, ...childTrail];
  }

  return [];
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
