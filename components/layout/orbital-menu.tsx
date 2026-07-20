'use client';

import { Icon, IconButton } from '@chakra-ui/react';
import { useReducedMotion } from 'framer-motion';
import { ExternalLink, Orbit, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  type CSSProperties,
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
import type { MenuNode } from '@/lib/menu';
import { useMenuStore } from '@/stores/menu-store';
import { getCurrentMenu } from './navigation-utils';
import styles from './orbital-menu.module.css';
import {
  buildOrbitalMenuEntries,
  getWheelItemAngle,
  getWheelPlacement,
  getWheelRotationForItem,
  type OrbitalMenuEntry,
  type OrbitalMenuStyle,
  WHEEL_ORBIT_RATIO,
} from './orbital-menu-utils';

type OrbitalMenuProps = {
  initialMenus?: MenuNode[];
  targetId?: string;
};

type OrbCssProperties = CSSProperties & {
  '--orb-color': string;
  '--orb-surface': string;
};

type SegmentsCssProperties = CSSProperties & {
  '--wedge-half': string;
};

const MOBILE_WHEEL_MEDIA_QUERY = '(max-width: 61.99em)';
const WHEEL_SCROLL_FACTOR = 0.22;
const FALLBACK_RADIUS = 118;

function getOrbStyle(style: OrbitalMenuStyle): OrbCssProperties {
  return {
    '--orb-color': style.color,
    '--orb-surface': style.surface,
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
  const entries = useMemo(() => buildOrbitalMenuEntries(menus), [menus]);
  const currentMenu = useMemo(
    () => getCurrentMenu(pathname, menus),
    [menus, pathname],
  );
  const activeIndex = useMemo(
    () =>
      entries.findIndex(
        (entry) => !entry.external && currentMenu?.id === entry.menu.id,
      ),
    [currentMenu, entries],
  );
  const [expanded, setExpanded] = useState(true);
  const [ready, setReady] = useState(false);
  const [rotation, setRotation] = useState(() =>
    activeIndex >= 0
      ? getWheelRotationForItem(activeIndex, entries.length, 0)
      : 180,
  );
  const [radius, setRadius] = useState(FALLBACK_RADIUS);
  const [busy, setBusy] = useState(false);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sourcePathRef = useRef<string | null>(null);
  const pendingPathRef = useRef<string | null>(null);
  const routeReadyRef = useRef(false);
  const revealStartedRef = useRef(false);
  const contentAnimationRef = useRef<Animation | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setRotation((current) =>
      getWheelRotationForItem(activeIndex, entries.length, current),
    );
  }, [activeIndex, entries.length]);

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
    }
  }, [pathname, reduceMotion, resetNavigation, revealPage]);

  useEffect(() => {
    const hrefs = Array.from(
      new Set(
        entries.filter((entry) => !entry.external).map((entry) => entry.href),
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
  }, [entries, router]);

  // 窄屏默认收起；ready 配合 CSS 避免水合前先闪出展开态
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_WHEEL_MEDIA_QUERY);
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) setExpanded(false);
    };

    if (mediaQuery.matches) setExpanded(false);
    setReady(true);
    mediaQuery.addEventListener('change', handleBreakpointChange);
    return () =>
      mediaQuery.removeEventListener('change', handleBreakpointChange);
  }, []);

  // 实测转盘半径，与 CSS 媒体查询保持一致
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const updateRadius = () => setRadius(element.offsetWidth / 2);
    updateRadius();
    const observer = new ResizeObserver(updateRadius);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 滚轮驱动转盘无限旋转(React 合成 wheel 为 passive，需原生监听)。
  // 直接累加保持角度连续:归一化会在 ±180° 处跳变 360°，导致扇区过渡动画反向回转。
  useEffect(() => {
    const element = rootRef.current;
    if (!element || !expanded) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const delta =
        event.deltaY *
        (event.deltaMode === 1
          ? 24
          : event.deltaMode === 2
            ? element.clientHeight
            : 1);
      if (!Number.isFinite(delta) || delta === 0) return;

      setRotation((current) => current + delta * WHEEL_SCROLL_FACTOR);
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
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
      contentAnimationRef.current?.cancel();
    },
    [],
  );

  const handleOrbClick = (entry: OrbitalMenuEntry) => {
    if (busy) return;

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

  if (entries.length === 0) return null;

  const orbitRadius = radius * WHEEL_ORBIT_RATIO;
  const wedgeHalfAngle = Math.max(1.5, 180 / entries.length - 0.65);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-expanded={expanded}
      data-ready={ready}
      data-busy={busy}
    >
      <div className={styles.disc} aria-hidden />
      <div className={styles.track} aria-hidden />

      <nav className={styles.nav} aria-label="页面导航">
        <div
          className={styles.segments}
          style={
            { '--wedge-half': `${wedgeHalfAngle}deg` } as SegmentsCssProperties
          }
        >
          {entries.map((entry, index) => {
            const placement = getWheelPlacement(
              index,
              entries.length,
              rotation,
              orbitRadius,
            );
            // 未归一化的连续角度，保证旋转过渡沿同一方向平滑进行
            const angle = getWheelItemAngle(index, entries.length) + rotation;
            const active = currentMenu?.id === entry.menu.id;
            const shown = expanded && placement.visible;

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
                data-orb-marker={entry.style.marker}
                aria-label={entry.menu.name}
                aria-current={active ? 'page' : undefined}
                disabled={busy || !shown}
                tabIndex={shown ? 0 : -1}
                data-orb-id={entry.menu.id}
                onPointerEnter={() => {
                  if (!entry.external) router.prefetch(entry.href);
                }}
                onFocus={() => {
                  if (!entry.external) router.prefetch(entry.href);
                }}
                onClick={() => handleOrbClick(entry)}
              >
                <span className={styles.segmentLabel}>
                  <span className={styles.segmentText}>{entry.menu.name}</span>
                  {entry.external ? (
                    <Icon as={ExternalLink} boxSize={2.5} aria-hidden />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <IconButton
        className={styles.hubButton}
        aria-label={expanded ? '收起页面导航' : '展开页面导航'}
        aria-expanded={expanded}
        variant="unstyled"
        icon={
          <span className={styles.hubIcon} aria-hidden>
            <Orbit className={styles.hubIconCollapsed} size={15} />
            <X className={styles.hubIconExpanded} size={14} />
          </span>
        }
        onClick={() => setExpanded((value) => !value)}
      />
    </div>
  );
}
