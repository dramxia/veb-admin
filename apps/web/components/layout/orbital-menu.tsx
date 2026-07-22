'use client';

import { IconButton } from '@chakra-ui/react';
import { useReducedMotion } from 'framer-motion';
import { Orbit, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  finishRouteProgress,
  ROUTE_LOADING_COMPLETE_EVENT,
  startRouteProgress,
} from '@/components/common/route-progress';
import type { MenuNode } from '@veb/api-contracts';
import { useMenuStore } from '@/stores/menu-store';
import {
  flattenNavigableMenus,
  getCurrentMenu,
  getHref,
  isExternalHref,
  isMenuBranchActive,
} from './navigation-utils';
import styles from './orbital-menu.module.css';
import {
  buildOrbitalMenuEntries,
  getOrbitalMenuTrail,
  getWheelItemAngle,
  getWheelPlacement,
  getWheelRotationForItem,
  type OrbitalMenuEntry,
  type OrbitalMenuStyle,
} from './orbital-menu-utils';

type OrbitalMenuProps = {
  initialMenus?: MenuNode[];
  targetId?: string;
};

type OrbCssProperties = CSSProperties & {
  '--orb-color': string;
  '--orb-gradient': string;
};

type WheelLayerCssProperties = CSSProperties & {
  '--wedge-half': string;
  '--wheel-diameter': string;
  '--ring-inner': string;
  '--ring-inner-stop': string;
  '--label-position': string;
  '--label-max-width': string;
};

type DockSide = 'left' | 'right';

type MenuPosition = {
  x: number;
  y: number;
};

type DragMetrics = {
  edgeInset: number;
  radius: number;
  viewportHeight: number;
  viewportWidth: number;
};

type DragSession = {
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startPosition: MenuPosition;
  latestPosition: MenuPosition;
  moved: boolean;
};

const MOBILE_WHEEL_MEDIA_QUERY = '(max-width: 61.99em)';
const WHEEL_SCROLL_FACTOR = 0.22;
const FALLBACK_RADIUS = 118;
const MAX_WHEEL_LEVELS = 3;
const DRAG_START_DISTANCE = 6;

function clamp(value: number, minimum: number, maximum: number) {
  if (maximum < minimum) return (minimum + maximum) / 2;
  return Math.min(maximum, Math.max(minimum, value));
}

function getDragMetrics(element: HTMLElement): DragMetrics {
  const hub = element.querySelector<HTMLElement>('[data-orbital-menu-hub]');
  const hubSize = hub?.getBoundingClientRect().width ?? 34;
  const rawEdgeGap = Number.parseFloat(
    window.getComputedStyle(element).getPropertyValue('--wheel-edge-gap'),
  );
  const edgeGap = Number.isFinite(rawEdgeGap) ? rawEdgeGap : 8;

  return {
    edgeInset: hubSize / 2 + edgeGap,
    radius: element.offsetWidth / 2,
    viewportHeight: document.documentElement.clientHeight,
    viewportWidth: document.documentElement.clientWidth,
  };
}

function clampDragPosition(
  position: MenuPosition,
  metrics: DragMetrics,
): MenuPosition {
  const minimumY = metrics.radius + metrics.edgeInset;
  const maximumY = metrics.viewportHeight - metrics.radius - metrics.edgeInset;

  return {
    x: clamp(
      position.x,
      metrics.edgeInset,
      metrics.viewportWidth - metrics.edgeInset,
    ),
    y: clamp(position.y, minimumY, maximumY),
  };
}

function getDockedPosition(
  position: MenuPosition,
  side: DockSide,
  metrics: DragMetrics,
): MenuPosition {
  const clamped = clampDragPosition(position, metrics);
  return {
    x:
      side === 'left'
        ? metrics.edgeInset
        : metrics.viewportWidth - metrics.edgeInset,
    y: clamped.y,
  };
}

function applyMenuPosition(
  element: HTMLElement,
  position: MenuPosition,
  radius: number,
) {
  element.style.setProperty('--orbital-menu-left', `${position.x - radius}px`);
  element.style.setProperty('--orbital-menu-top', `${position.y - radius}px`);
  element.dataset.positioned = 'true';
}

function getOrbStyle(style: OrbitalMenuStyle): OrbCssProperties {
  return {
    '--orb-color': style.color,
    '--orb-gradient': style.gradient,
  };
}

export function OrbitalMenu({
  initialMenus = [],
  targetId = 'dashboard-main',
}: OrbitalMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const storedMenus = useMenuStore((state) => state.menus);
  const menus = storedMenus.length > 0 ? storedMenus : initialMenus;
  const rootEntries = useMemo(() => buildOrbitalMenuEntries(menus), [menus]);
  const currentMenu = useMemo(
    () => getCurrentMenu(pathname, menus),
    [menus, pathname],
  );
  const currentMenuTrail = useMemo(
    () =>
      currentMenu
        ? getOrbitalMenuTrail(menus, currentMenu.id).slice(0, MAX_WHEEL_LEVELS)
        : [],
    [currentMenu, menus],
  );
  const activeIndex = useMemo(
    () =>
      rootEntries.findIndex(
        (entry) => !entry.external && isMenuBranchActive(pathname, entry.menu),
      ),
    [pathname, rootEntries],
  );
  const [expanded, setExpanded] = useState(true);
  const [ready, setReady] = useState(false);
  const [rotations, setRotations] = useState(() => [
    activeIndex >= 0
      ? getWheelRotationForItem(activeIndex, rootEntries.length, 0)
      : 180,
    180,
    180,
  ]);
  const [openBranchIds, setOpenBranchIds] = useState<string[]>([]);
  const [radius, setRadius] = useState(FALLBACK_RADIUS);
  const [busy, setBusy] = useState(false);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [dockSide, setDockSide] = useState<DockSide>('right');
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dockSideRef = useRef<DockSide>('right');
  const dragSessionRef = useRef<DragSession | null>(null);
  const positionRef = useRef<MenuPosition | null>(null);
  const pendingPositionRef = useRef<MenuPosition | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const suppressHubClickRef = useRef(false);
  const sourcePathRef = useRef<string | null>(null);
  const pendingPathRef = useRef<string | null>(null);
  const routeReadyRef = useRef(false);
  const revealStartedRef = useRef(false);
  const contentAnimationRef = useRef<Animation | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const branchCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const commitDockSide = useCallback((side: DockSide) => {
    dockSideRef.current = side;
    setDockSide(side);
  }, []);

  const flushPendingPosition = useCallback(() => {
    dragFrameRef.current = null;
    const element = rootRef.current;
    const position = pendingPositionRef.current;
    if (!element || !position) return;

    pendingPositionRef.current = null;
    applyMenuPosition(element, position, element.offsetWidth / 2);
  }, []);

  const scheduleMenuPosition = useCallback(
    (position: MenuPosition) => {
      positionRef.current = position;
      pendingPositionRef.current = position;
      if (dragFrameRef.current !== null) return;
      dragFrameRef.current = window.requestAnimationFrame(flushPendingPosition);
    },
    [flushPendingPosition],
  );

  const handleHubPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || dragSessionRef.current) return;
      suppressHubClickRef.current = false;

      const element = rootRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const startPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      positionRef.current = startPosition;
      applyMenuPosition(element, startPosition, rect.width / 2);
      dragSessionRef.current = {
        pointerId: event.pointerId,
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startPosition,
        latestPosition: startPosition,
        moved: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const handleHubPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const session = dragSessionRef.current;
      const element = rootRef.current;
      if (!session || !element || session.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - session.startPointerX;
      const deltaY = event.clientY - session.startPointerY;
      if (!session.moved) {
        if (Math.hypot(deltaX, deltaY) < DRAG_START_DISTANCE) return;
        session.moved = true;
        element.dataset.dragging = 'true';
        setDragging(true);
        clearTimer(branchCloseTimerRef);
        setOpenBranchIds([]);
      }

      event.preventDefault();
      const metrics = getDragMetrics(element);
      const nextPosition = clampDragPosition(
        {
          x: session.startPosition.x + deltaX,
          y: session.startPosition.y + deltaY,
        },
        metrics,
      );
      const previewSide: DockSide =
        nextPosition.x < metrics.viewportWidth / 2 ? 'left' : 'right';
      if (previewSide !== dockSideRef.current) {
        commitDockSide(previewSide);
      }
      session.latestPosition = nextPosition;
      scheduleMenuPosition(nextPosition);
    },
    [commitDockSide, scheduleMenuPosition],
  );

  const finishHubDrag = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      usePointerPosition: boolean,
    ) => {
      const session = dragSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      dragSessionRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (!session.moved) return;

      const element = rootRef.current;
      if (!element) return;
      const metrics = getDragMetrics(element);
      const releasedPosition = usePointerPosition
        ? clampDragPosition(
            {
              x:
                session.startPosition.x + event.clientX - session.startPointerX,
              y:
                session.startPosition.y + event.clientY - session.startPointerY,
            },
            metrics,
          )
        : session.latestPosition;
      const nextSide: DockSide =
        releasedPosition.x < metrics.viewportWidth / 2 ? 'left' : 'right';
      const dockedPosition = getDockedPosition(
        releasedPosition,
        nextSide,
        metrics,
      );

      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
      pendingPositionRef.current = null;
      positionRef.current = dockedPosition;
      applyMenuPosition(element, releasedPosition, metrics.radius);
      element.dataset.edge = nextSide;
      element.dataset.dragging = 'false';
      commitDockSide(nextSide);
      setDragging(false);
      suppressHubClickRef.current = true;
    },
    [commitDockSide],
  );

  const handleHubLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      finishHubDrag(event, false);
    },
    [finishHubDrag],
  );

  const handleHubKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      suppressHubClickRef.current = false;
      if (
        !event.shiftKey ||
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
      ) {
        return;
      }

      const element = rootRef.current;
      if (!element) return;
      event.preventDefault();

      const metrics = getDragMetrics(element);
      const rect = element.getBoundingClientRect();
      const currentPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const nextSide: DockSide = event.key === 'ArrowLeft' ? 'left' : 'right';
      positionRef.current = getDockedPosition(
        currentPosition,
        nextSide,
        metrics,
      );
      applyMenuPosition(element, currentPosition, metrics.radius);
      element.dataset.edge = nextSide;
      commitDockSide(nextSide);
    },
    [commitDockSide],
  );

  const wheelLayers = useMemo(() => {
    const layers: OrbitalMenuEntry[][] = [];
    let levelMenus = menus;

    for (let level = 0; level < MAX_WHEEL_LEVELS; level += 1) {
      if (levelMenus.length === 0) break;
      layers.push(buildOrbitalMenuEntries(levelMenus));

      const branchId = openBranchIds[level];
      const branch = levelMenus.find((menu) => menu.id === branchId);
      if (!branch?.children.length) break;
      levelMenus = branch.children;
    }

    return layers;
  }, [menus, openBranchIds]);

  const clearTimer = (timer: typeof navigationTimerRef) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const resetNavigation = useCallback(
    (finishProgress = false) => {
      contentAnimationRef.current?.cancel();
      contentAnimationRef.current = null;
      clearTimer(navigationTimerRef);
      clearTimer(revealTimerRef);
      pendingPathRef.current = null;
      sourcePathRef.current = null;
      routeReadyRef.current = false;
      revealStartedRef.current = false;

      const target = document.getElementById(targetId);
      target?.style.removeProperty('opacity');
      target?.style.removeProperty('pointer-events');
      target?.removeAttribute('aria-hidden');

      setBusy(false);
      if (finishProgress) finishRouteProgress();
    },
    [targetId],
  );

  // 路由就绪后把新页面内容以模糊渐显的方式呈现出来
  const revealPage = useCallback(() => {
    if (!routeReadyRef.current || revealStartedRef.current) return;
    if (document.querySelector('[data-route-loading="true"]')) return;

    revealStartedRef.current = true;
    clearTimer(navigationTimerRef);
    finishRouteProgress();

    const target = document.getElementById(targetId);
    const previousAnimation = contentAnimationRef.current;
    const revealAnimation =
      target?.animate(
        [
          {
            opacity: 0,
            filter: 'blur(14px)',
            transform: 'translate3d(0, 8px, 0) scale(0.995)',
          },
          {
            opacity: 1,
            filter: 'blur(0px)',
            transform: 'translate3d(0, 0, 0) scale(1)',
          },
        ],
        {
          duration: 420,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        },
      ) ?? null;
    target?.style.removeProperty('opacity');
    target?.style.removeProperty('pointer-events');
    target?.removeAttribute('aria-hidden');
    previousAnimation?.cancel();
    contentAnimationRef.current = revealAnimation;

    clearTimer(revealTimerRef);
    revealTimerRef.current = setTimeout(() => resetNavigation(), 700);
  }, [resetNavigation, targetId]);

  useEffect(() => {
    window.addEventListener(ROUTE_LOADING_COMPLETE_EVENT, revealPage);
    return () =>
      window.removeEventListener(ROUTE_LOADING_COMPLETE_EVENT, revealPage);
  }, [revealPage]);

  const startNavigation = useCallback(
    (entry: OrbitalMenuEntry) => {
      sourcePathRef.current = pathname;
      pendingPathRef.current = entry.menu.path;
      setBusy(true);
      startRouteProgress();
      router.push(entry.href);
      navigationTimerRef.current = setTimeout(
        () => resetNavigation(true),
        8000,
      );
    },
    [pathname, resetNavigation, router],
  );

  // 路由变化时把当前菜单项旋转到屏幕正内侧(最短路径)
  useEffect(() => {
    if (activeIndex < 0) return;
    setRotations((current) => {
      const next = [...current];
      next[0] = getWheelRotationForItem(
        activeIndex,
        rootEntries.length,
        current[0] ?? 0,
      );
      return next;
    });
  }, [activeIndex, rootEntries.length]);

  useEffect(() => {
    if (
      pendingPathRef.current &&
      sourcePathRef.current &&
      !routeReadyRef.current &&
      pathname !== sourcePathRef.current
    ) {
      routeReadyRef.current = true;
      if (reduceMotion) {
        clearTimer(navigationTimerRef);
        finishRouteProgress();
        resetNavigation();
      } else {
        revealPage();
      }
      setExpanded(false);
      setOpenBranchIds([]);
    }
  }, [pathname, reduceMotion, resetNavigation, revealPage]);

  useEffect(() => {
    const hrefs = Array.from(
      new Set(
        flattenNavigableMenus(menus)
          .map((menu) => getHref(menu))
          .filter((href) => !isExternalHref(href)),
      ),
    );
    let index = 0;
    let cancelled = false;
    let idleId: number | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const prefetchBatch = () => {
      if (cancelled) return;
      hrefs.slice(index, index + 3).forEach((href) => router.prefetch(href));
      index += 3;
      if (index >= hrefs.length) return;

      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(prefetchBatch, { timeout: 1200 });
      } else {
        fallbackTimer = setTimeout(prefetchBatch, 180);
      }
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(prefetchBatch, { timeout: 800 });
    } else {
      fallbackTimer = setTimeout(prefetchBatch, 180);
    }

    return () => {
      cancelled = true;
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [menus, router]);

  // 窄屏默认收起；ready 配合 CSS 避免水合前先闪出展开态
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_WHEEL_MEDIA_QUERY);
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setExpanded(false);
        setOpenBranchIds([]);
      }
    };

    if (mediaQuery.matches) setExpanded(false);
    setReady(true);
    mediaQuery.addEventListener('change', handleBreakpointChange);
    return () =>
      mediaQuery.removeEventListener('change', handleBreakpointChange);
  }, []);

  // 实测转盘半径并接管初始 CSS 定位；后续断点变化仍保留圆心位置。
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const updateLayout = () => {
      const metrics = getDragMetrics(element);
      if (dragSessionRef.current?.moved) {
        setRadius(metrics.radius);
        return;
      }
      const rect = element.getBoundingClientRect();
      const currentPosition = positionRef.current ?? {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const dockedPosition = getDockedPosition(
        currentPosition,
        dockSideRef.current,
        metrics,
      );

      positionRef.current = dockedPosition;
      setRadius(metrics.radius);
      applyMenuPosition(element, dockedPosition, metrics.radius);
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootEntries.length]);

  // 滚轮只驱动指针所在层级无限旋转(React 合成 wheel 为 passive，需原生监听)。
  // 直接累加保持角度连续:归一化会在 ±180° 处跳变 360°，导致扇区过渡动画反向回转。
  useEffect(() => {
    const element = rootRef.current;
    if (!element || !expanded) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      const target = event.target;
      const layer =
        target instanceof Element
          ? target.closest<HTMLElement>('[data-level]')
          : null;
      if (!layer || !element.contains(layer)) return;

      event.preventDefault();
      event.stopPropagation();

      const delta =
        event.deltaY *
        (event.deltaMode === 1
          ? 24
          : event.deltaMode === 2
            ? element.clientHeight
            : 1);
      if (!Number.isFinite(delta) || delta === 0) return;

      const level = Number(layer.dataset.level);
      if (!Number.isInteger(level) || level < 0 || level >= MAX_WHEEL_LEVELS) {
        return;
      }

      setRotations((current) => {
        const next = [...current];
        next[level] = (current[level] ?? 180) + delta * WHEEL_SCROLL_FACTOR;
        return next;
      });
    };

    document.addEventListener('wheel', handleWheel, {
      capture: true,
      passive: false,
    });
    return () =>
      document.removeEventListener('wheel', handleWheel, { capture: true });
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false);
        setOpenBranchIds([]);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
        setOpenBranchIds([]);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [expanded]);

  useEffect(
    () => () => {
      clearTimer(navigationTimerRef);
      clearTimer(revealTimerRef);
      clearTimer(pulseTimerRef);
      clearTimer(branchCloseTimerRef);
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
      }
      dragSessionRef.current = null;
      contentAnimationRef.current?.cancel();
    },
    [],
  );

  const handleOrbClick = (entry: OrbitalMenuEntry) => {
    if (busy) return;

    if (entry.menu.type === 'DIR') return;

    if (entry.external) {
      setPulseId(entry.menu.id);
      window.open(entry.href, '_blank', 'noopener,noreferrer');
      clearTimer(pulseTimerRef);
      pulseTimerRef.current = setTimeout(() => setPulseId(null), 360);
      return;
    }

    if (currentMenu?.id === entry.menu.id) {
      setPulseId(entry.menu.id);
      clearTimer(pulseTimerRef);
      pulseTimerRef.current = setTimeout(() => setPulseId(null), 360);
      return;
    }

    startNavigation(entry);
  };

  const openBranch = (level: number, entry: OrbitalMenuEntry) => {
    clearTimer(branchCloseTimerRef);
    setOpenBranchIds((current) => {
      const next = current.slice(0, level);
      if (entry.menu.children.length > 0 && level < MAX_WHEEL_LEVELS - 1) {
        next[level] = entry.menu.id;
      }
      return next;
    });

    if (!entry.external && entry.menu.type !== 'DIR') {
      router.prefetch(entry.href);
    }
  };

  const scheduleBranchClose = () => {
    clearTimer(branchCloseTimerRef);
    branchCloseTimerRef.current = setTimeout(() => setOpenBranchIds([]), 180);
  };

  const cancelBranchClose = () => clearTimer(branchCloseTimerRef);

  const restoreCurrentMenu = () => {
    if (currentMenuTrail.length === 0) return;

    setOpenBranchIds(
      currentMenuTrail
        .slice(0, MAX_WHEEL_LEVELS - 1)
        .filter((menu) => menu.children.length > 0)
        .map((menu) => menu.id),
    );
    setRotations((current) => {
      const next = [...current];
      let siblings = menus;

      currentMenuTrail.forEach((menu, level) => {
        const menuIndex = siblings.findIndex((item) => item.id === menu.id);
        if (menuIndex >= 0) {
          next[level] = getWheelRotationForItem(
            menuIndex,
            siblings.length,
            current[level] ?? 0,
          );
        }
        siblings = menu.children;
      });

      return next;
    });
  };

  const toggleExpanded = () => {
    if (expanded) {
      setOpenBranchIds([]);
    } else {
      restoreCurrentMenu();
    }
    setExpanded((value) => !value);
  };

  if (rootEntries.length === 0) return null;

  const levelStep = Math.max(72, radius * 0.68);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-expanded={expanded}
      data-ready={ready}
      data-busy={busy}
      data-edge={dockSide}
      data-dragging={dragging}
      onPointerEnter={cancelBranchClose}
      onPointerLeave={scheduleBranchClose}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          scheduleBranchClose();
        }
      }}
    >
      <div className={styles.disc} aria-hidden />
      <div className={styles.track} aria-hidden />

      <nav className={styles.nav} aria-label="页面导航">
        {wheelLayers.map((entries, level) => {
          const rotation = rotations[level] ?? 180;
          const levelRadius = radius + level * levelStep;
          const innerRadius =
            level === 0 ? radius * 0.23 : levelRadius - levelStep;
          const orbitRadius = (innerRadius + levelRadius) / 2;
          const innerRadiusRatio = (innerRadius / levelRadius) * 100;
          const wedgeHalfAngle = Math.max(1.5, 180 / entries.length - 0.7);
          const labelPosition = 50 + (orbitRadius / (levelRadius * 2)) * 100;
          const labelMaxWidth = Math.max(
            12,
            ((levelRadius - innerRadius) / (levelRadius * 2)) * 100 - 1.5,
          );

          return (
            <div
              key={`wheel-level-${level}`}
              className={styles.segments}
              data-level={level}
              style={
                {
                  '--wedge-half': `${wedgeHalfAngle}deg`,
                  '--wheel-diameter': `${levelRadius * 2}px`,
                  '--ring-inner': `${(innerRadius / (levelRadius * 2)) * 100}%`,
                  '--ring-inner-stop': `${innerRadiusRatio}%`,
                  '--label-position': `${labelPosition}%`,
                  '--label-max-width': `${labelMaxWidth}%`,
                } as WheelLayerCssProperties
              }
              onPointerEnter={cancelBranchClose}
            >
              {entries.map((entry, index) => {
                const singleEntry = entries.length === 1;
                const placement = singleEntry
                  ? { opacity: 1, visible: true }
                  : getWheelPlacement(
                      index,
                      entries.length,
                      rotation,
                      orbitRadius,
                    );
                // 未归一化的连续角度，保证旋转过渡沿同一方向平滑进行
                const angle = singleEntry
                  ? 180
                  : getWheelItemAngle(index, entries.length) + rotation;
                const current = currentMenu?.id === entry.menu.id;
                const active =
                  !entry.external && isMenuBranchActive(pathname, entry.menu);
                const shown = expanded && placement.visible;
                const hasChildren =
                  entry.menu.children.length > 0 &&
                  level < MAX_WHEEL_LEVELS - 1;
                const branchOpen = openBranchIds[level] === entry.menu.id;

                return (
                  <button
                    key={entry.menu.id}
                    type="button"
                    className={[
                      styles.segment,
                      active ? styles.activeSegment : '',
                      pulseId === entry.menu.id ? styles.pulseSegment : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{
                      ...getOrbStyle(entry.style),
                      opacity: shown ? placement.opacity : 0,
                      pointerEvents: shown && !busy ? 'auto' : 'none',
                      transform: `rotate(${angle}deg)`,
                    }}
                    data-single-entry={singleEntry || undefined}
                    data-orb-marker={entry.style.marker}
                    aria-label={entry.menu.name}
                    aria-current={current ? 'page' : undefined}
                    aria-haspopup={hasChildren ? 'menu' : undefined}
                    aria-expanded={hasChildren ? branchOpen : undefined}
                    disabled={busy || !shown}
                    tabIndex={shown ? 0 : -1}
                    data-orb-id={entry.menu.id}
                    onPointerEnter={() => openBranch(level, entry)}
                    onFocus={() => openBranch(level, entry)}
                    onClick={() => {
                      if (hasChildren && entry.menu.type === 'DIR') {
                        openBranch(level, entry);
                        return;
                      }
                      handleOrbClick(entry);
                    }}
                  >
                    <span className={styles.segmentLabel}>
                      <span className={styles.segmentText}>
                        {entry.menu.name}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <IconButton
        className={styles.hubButton}
        data-orbital-menu-hub
        aria-label={expanded ? '收起页面导航' : '展开页面导航'}
        aria-description="可拖拽；按 Shift 加左右方向键切换停靠侧"
        aria-keyshortcuts="Shift+ArrowLeft Shift+ArrowRight"
        aria-expanded={expanded}
        variant="unstyled"
        icon={
          <span className={styles.hubIcon} aria-hidden>
            <Orbit className={styles.hubIconCollapsed} size={15} />
            <X className={styles.hubIconExpanded} size={14} />
          </span>
        }
        onPointerDown={handleHubPointerDown}
        onPointerMove={handleHubPointerMove}
        onPointerUp={(event) => finishHubDrag(event, true)}
        onPointerCancel={(event) => finishHubDrag(event, false)}
        onLostPointerCapture={handleHubLostPointerCapture}
        onKeyDown={handleHubKeyDown}
        onClick={() => {
          if (suppressHubClickRef.current) {
            suppressHubClickRef.current = false;
            return;
          }
          toggleExpanded();
        }}
      />
    </div>
  );
}
