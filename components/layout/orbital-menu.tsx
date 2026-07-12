'use client';

import { Icon, IconButton, Portal, Text, Tooltip } from '@chakra-ui/react';
import { animate, useReducedMotion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Circle,
  Compass,
  ExternalLink,
  FileBox,
  Folder,
  Home,
  LayoutDashboard,
  ListTree,
  type LucideIcon,
  Orbit,
  ScrollText,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  finishRouteProgress,
  startRouteProgress,
} from '@/components/common/route-progress';
import type { MenuNode } from '@/lib/menu';
import { useMenuStore } from '@/stores/menu-store';
import { getCurrentMenu } from './navigation-utils';
import styles from './orbital-menu.module.css';
import {
  buildOrbitalMenuEntries,
  getCubicBezierPoint,
  getFlightControlPoints,
  getOrbitalPageIndex,
  type OrbitalMenuEntry,
  type OrbitalTone,
  paginateOrbitalEntries,
  type Point,
} from './orbital-menu-utils';

type OrbitalMenuProps = {
  initialMenus?: MenuNode[];
  targetId?: string;
};

type FlightState = {
  entry: OrbitalMenuEntry;
  point: Point;
  size: number;
  scale: number;
  opacity: number;
  phase: 'flying' | 'waiting' | 'exiting';
};

type OrbCssProperties = CSSProperties & {
  '--orb-start': string;
  '--orb-middle': string;
  '--orb-end': string;
  '--orb-shadow': string;
};

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  home: Home,
  system: Compass,
  users: Users,
  user: User,
  role: Shield,
  shield: Shield,
  permission: Shield,
  menu: ListTree,
  file: FileBox,
  folder: Folder,
  log: ScrollText,
  profile: User,
};

function getMenuIcon(menu: MenuNode): LucideIcon {
  const configured = menu.icon?.toLowerCase();
  if (configured && iconMap[configured]) return iconMap[configured];
  if (menu.path === '/') return LayoutDashboard;
  if (menu.path.startsWith('/profile')) return User;
  if (menu.path.includes('user')) return Users;
  if (menu.path.includes('role')) return Shield;
  if (menu.path.includes('permission')) return Shield;
  if (menu.path.includes('menu')) return ListTree;
  if (menu.path.includes('file')) return FileBox;
  if (menu.path.includes('log')) return ScrollText;
  if (menu.path.startsWith('/system')) return Compass;
  return Circle;
}

function getOrbStyle(tone: OrbitalTone): OrbCssProperties {
  return {
    '--orb-start': tone.start,
    '--orb-middle': tone.middle,
    '--orb-end': tone.end,
    '--orb-shadow': tone.shadow,
  };
}

function getVisibleCenter(element: HTMLElement | null): Point {
  if (!element) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  const rect = element.getBoundingClientRect();
  const left = Math.max(0, rect.left);
  const right = Math.min(window.innerWidth, rect.right);
  const top = Math.max(0, rect.top);
  const bottom = Math.min(window.innerHeight, rect.bottom);

  if (right <= left || bottom <= top) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  return { x: (left + right) / 2, y: (top + bottom) / 2 };
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
  const pages = useMemo(() => paginateOrbitalEntries(entries), [entries]);
  const currentMenu = useMemo(
    () => getCurrentMenu(pathname, menus),
    [menus, pathname],
  );
  const [pageIndex, setPageIndex] = useState(() =>
    getOrbitalPageIndex(entries, pathname),
  );
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [flight, setFlight] = useState<FlightState | null>(null);
  const [busy, setBusy] = useState(false);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sourcePathRef = useRef<string | null>(null);
  const pendingPathRef = useRef<string | null>(null);
  const animationRef = useRef<{ stop: () => void } | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = (timer: typeof navigationTimerRef) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const resetNavigation = useCallback((finishProgress = false) => {
    animationRef.current?.stop();
    animationRef.current = null;
    clearTimer(navigationTimerRef);
    clearTimer(exitTimerRef);
    pendingPathRef.current = null;
    sourcePathRef.current = null;
    setFlight(null);
    setBusy(false);
    if (finishProgress) finishRouteProgress();
  }, []);

  useEffect(() => {
    const nextPageIndex = getOrbitalPageIndex(entries, pathname);
    setPageIndex(Math.min(nextPageIndex, Math.max(0, pages.length - 1)));

    if (
      pendingPathRef.current &&
      sourcePathRef.current &&
      pathname !== sourcePathRef.current
    ) {
      clearTimer(navigationTimerRef);
      setMobileExpanded(false);
      setFlight((current) =>
        current
          ? { ...current, phase: 'exiting', opacity: 0, scale: 0.72 }
          : current,
      );
      exitTimerRef.current = setTimeout(() => resetNavigation(), 180);
    }
  }, [entries, pages.length, pathname, resetNavigation]);

  useEffect(() => {
    if (!mobileExpanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMobileExpanded(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileExpanded(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileExpanded]);

  useEffect(
    () => () => {
      animationRef.current?.stop();
      clearTimer(navigationTimerRef);
      clearTimer(exitTimerRef);
      clearTimer(pulseTimerRef);
    },
    [],
  );

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

  const handleOrbClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    entry: OrbitalMenuEntry,
  ) => {
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

    if (reduceMotion) {
      startNavigation(entry);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const start = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const end = getVisibleCenter(document.getElementById(targetId));
    const { first, second } = getFlightControlPoints(start, end);
    const initialFlight: FlightState = {
      entry,
      point: start,
      size: rect.width,
      scale: 1,
      opacity: 1,
      phase: 'flying',
    };

    setBusy(true);
    setFlight(initialFlight);
    animationRef.current = animate(0, 1, {
      duration: 0.56,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (progress) => {
        const point = getCubicBezierPoint(start, first, second, end, progress);
        setFlight((current) =>
          current
            ? {
                ...current,
                point,
                scale: 1 + progress * 0.34,
              }
            : current,
        );
      },
      onComplete: () => {
        animationRef.current = null;
        setFlight((current) =>
          current ? { ...current, point: end, phase: 'waiting' } : current,
        );
        startNavigation(entry);
      },
    });
  };

  if (entries.length === 0) return null;

  const safePageIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const visibleEntries = pages[safePageIndex] ?? [];
  const FlightIcon = flight ? getMenuIcon(flight.entry.menu) : null;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-expanded={mobileExpanded}
      data-busy={busy}
    >
      <div className={styles.menuBody}>
        <div className={styles.surface} aria-hidden />
        <nav className={styles.nav} aria-label="页面导航">
          {visibleEntries.map((entry) => {
            const MenuIcon = getMenuIcon(entry.menu);
            const active = currentMenu?.id === entry.menu.id;
            const hidden = flight?.entry.menu.id === entry.menu.id;

            return (
              <div
                key={entry.menu.id}
                className={styles.orbSlot}
                style={{ left: `${entry.slot.x}%`, top: `${entry.slot.y}%` }}
              >
                <Tooltip
                  label={entry.menu.name}
                  placement="left"
                  openDelay={160}
                  hasArrow
                  isDisabled={active}
                >
                  <button
                    type="button"
                    className={[
                      styles.orbButton,
                      active ? styles.activeOrb : '',
                      hidden ? styles.hiddenOrb : '',
                      pulseId === entry.menu.id ? styles.pulseOrb : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={getOrbStyle(entry.tone)}
                    aria-label={entry.menu.name}
                    aria-current={active ? 'page' : undefined}
                    disabled={busy}
                    data-orb-id={entry.menu.id}
                    onPointerEnter={() => {
                      if (!entry.external) router.prefetch(entry.href);
                    }}
                    onFocus={() => {
                      if (!entry.external) router.prefetch(entry.href);
                    }}
                    onClick={(event) => handleOrbClick(event, entry)}
                  >
                    <Icon
                      as={MenuIcon}
                      className={styles.orbIcon}
                      boxSize={5.5}
                      aria-hidden
                    />
                    {entry.external ? (
                      <Icon
                        as={ExternalLink}
                        className={styles.externalMark}
                        boxSize={3}
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </Tooltip>
                {active ? (
                  <span className={styles.orbLabel}>{entry.menu.name}</span>
                ) : null}
              </div>
            );
          })}

          {pages.length > 1 ? (
            <div className={styles.pageControls} aria-label="菜单分页">
              <IconButton
                className={styles.pageButton}
                aria-label="上一组菜单"
                icon={<ChevronUp size={15} aria-hidden />}
                size="xs"
                variant="ghost"
                isDisabled={busy || safePageIndex === 0}
                onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
              />
              <Text className={styles.pageIndicator} aria-live="polite">
                {safePageIndex + 1}/{pages.length}
              </Text>
              <IconButton
                className={styles.pageButton}
                aria-label="下一组菜单"
                icon={<ChevronDown size={15} aria-hidden />}
                size="xs"
                variant="ghost"
                isDisabled={busy || safePageIndex === pages.length - 1}
                onClick={() =>
                  setPageIndex((value) => Math.min(pages.length - 1, value + 1))
                }
              />
            </div>
          ) : null}
        </nav>
      </div>

      <IconButton
        className={styles.mobileHandle}
        aria-label={mobileExpanded ? '收起页面导航' : '展开页面导航'}
        aria-expanded={mobileExpanded}
        icon={mobileExpanded ? <X size={19} /> : <Orbit size={21} />}
        onClick={() => setMobileExpanded((value) => !value)}
      />

      {flight && FlightIcon ? (
        <Portal>
          <div
            className={[
              styles.orbButton,
              styles.flightOrb,
              flight.phase === 'exiting' ? styles.flightOrbExiting : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              ...getOrbStyle(flight.entry.tone),
              left: flight.point.x,
              top: flight.point.y,
              width: flight.size,
              minWidth: flight.size,
              height: flight.size,
              opacity: flight.opacity,
              transform: `translate(-50%, -50%) scale(${flight.scale})`,
            }}
            data-flight-phase={flight.phase}
            aria-hidden
          >
            <Icon
              as={FlightIcon}
              className={styles.orbIcon}
              boxSize={5.5}
              aria-hidden
            />
          </div>
        </Portal>
      ) : null}
    </div>
  );
}
