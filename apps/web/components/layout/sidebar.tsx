'use client';

import {
  Box,
  Flex,
  Icon,
  Link as ChakraLink,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
} from '@chakra-ui/react';
import type { MenuNode } from '@veb/api-contracts';
import {
  Circle,
  Compass,
  ExternalLink,
  FileBox,
  FileText,
  Folder,
  Heart,
  KeyRound,
  LayoutDashboard,
  ListTree,
  ScrollText,
  Shield,
  Tags,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { useUiStore } from '@/stores/ui-store';
import {
  flattenNavigableMenus,
  getCurrentMenu,
  getHref,
  isExternalHref,
  normalizeMenuPath,
} from './navigation-utils';
import { ADMIN_SIDEBAR_ID, ADMIN_SIDEBAR_TOGGLE_ID } from './layout-constants';
import { useWorkspaceData } from './workspace-data-context';

export const DESKTOP_SIDEBAR_EXPANDED_WIDTH = '184px';
export const DESKTOP_SIDEBAR_COLLAPSED_WIDTH = '76px';
export const MOBILE_SIDEBAR_WIDTH = `min(${DESKTOP_SIDEBAR_EXPANDED_WIDTH}, calc(100vw - 48px))`;

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  home: LayoutDashboard,
  system: Compass,
  users: Users,
  user: User,
  role: Shield,
  shield: Shield,
  permission: KeyRound,
  key: KeyRound,
  keyround: KeyRound,
  menu: ListTree,
  file: FileBox,
  filetext: FileText,
  article: FileText,
  folder: Folder,
  tag: Tags,
  tags: Tags,
  like: Heart,
  heart: Heart,
  log: ScrollText,
  profile: User,
};

function getMenuIcon(menu: MenuNode): LucideIcon {
  const configured = menu.icon?.toLowerCase();
  const path = normalizeMenuPath(menu.path);
  if (configured && iconMap[configured]) return iconMap[configured];
  if (path === '/dashboard') return LayoutDashboard;
  if (path.startsWith('/admin/profile')) return User;
  if (path.includes('/article')) return FileText;
  if (path.includes('/tag')) return Tags;
  if (path.includes('/like')) return Heart;
  if (path.includes('user')) return Users;
  if (path.includes('role')) return Shield;
  if (path.includes('permission')) return KeyRound;
  if (path.includes('menu')) return ListTree;
  if (path.includes('file')) return FileBox;
  if (path.includes('log')) return ScrollText;
  if (path.startsWith('/admin/content')) return FileText;
  if (path.startsWith('/admin/system')) return Compass;
  return Circle;
}

type FlatMenuItemProps = {
  menu: MenuNode;
  currentMenuId?: string;
  collapsed: boolean;
  tabIndex?: number;
};

function FlatMenuItem({
  menu,
  currentMenuId,
  collapsed,
  tabIndex,
}: FlatMenuItemProps) {
  const current = currentMenuId === menu.id;
  const MenuItemIcon = getMenuIcon(menu);
  const href = getHref(menu);
  const external = isExternalHref(href);
  const activeBackground =
    'linear-gradient(90deg, rgba(22, 119, 255, 0.12) 0%, rgba(255, 255, 255, 0.52) 76%)';
  const activeHoverBackground =
    'linear-gradient(90deg, rgba(22, 119, 255, 0.15) 0%, rgba(255, 255, 255, 0.60) 76%)';

  const menuRow = (
    <ChakraLink
      as={Link}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      tabIndex={tabIndex}
      aria-current={current ? 'page' : undefined}
      aria-label={external ? `${menu.name}（新窗口打开）` : menu.name}
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent={collapsed ? 'center' : 'flex-start'}
      gap={collapsed ? 0 : 2}
      w={collapsed ? '40px' : 'full'}
      minH="40px"
      mx={collapsed ? 'auto' : 0}
      px={collapsed ? 1.5 : 2}
      overflow="hidden"
      rounded="10px"
      background={current ? activeBackground : 'transparent'}
      color={current ? 'ink.900' : 'ink.600'}
      fontSize="sm"
      fontWeight={current ? '700' : '600'}
      transition="background 160ms cubic-bezier(0.16, 1, 0.3, 1), color 160ms cubic-bezier(0.16, 1, 0.3, 1)"
      _hover={
        current
          ? {
              background: activeHoverBackground,
              color: 'ink.900',
              textDecoration: 'none',
            }
          : {
              background: 'rgba(255, 255, 255, 0.44)',
              color: 'ink.900',
              textDecoration: 'none',
            }
      }
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'brand.600',
        outlineOffset: '2px',
      }}
      sx={{
        '&:hover .sidebar-menu-icon': {
          bg: current ? 'rgba(22, 119, 255, 0.17)' : 'rgba(22, 119, 255, 0.08)',
          color: 'brand.600',
        },
        '&:hover .sidebar-external-icon': {
          color: 'brand.500',
          opacity: 0.72,
        },
      }}
    >
      {current && !collapsed && (
        <Box
          position="absolute"
          insetInlineStart={0}
          top="50%"
          w="3px"
          h="18px"
          rounded="full"
          bg="brand.500"
          transform="translateY(-50%)"
          aria-hidden
        />
      )}

      {current && collapsed && (
        <Box
          position="absolute"
          insetInlineStart="50%"
          bottom="2px"
          w="12px"
          h="3px"
          rounded="full"
          bg="brand.500"
          transform="translateX(-50%)"
          aria-hidden
        />
      )}

      <Flex
        className="sidebar-menu-icon"
        boxSize="28px"
        align="center"
        justify="center"
        flexShrink={0}
        rounded="8px"
        bg={current ? 'rgba(22, 119, 255, 0.14)' : 'transparent'}
        color={current ? 'brand.600' : 'ink.500'}
        transition="background 160ms cubic-bezier(0.16, 1, 0.3, 1), color 160ms cubic-bezier(0.16, 1, 0.3, 1)"
      >
        <Icon as={MenuItemIcon} boxSize="17px" aria-hidden />
      </Flex>

      {!collapsed && (
        <Text flex={1} minW={0} noOfLines={1}>
          {menu.name}
        </Text>
      )}
      {!collapsed && external && (
        <Icon
          className="sidebar-external-icon"
          as={ExternalLink}
          boxSize={4}
          color={current ? 'brand.500' : 'ink.400'}
          opacity={current ? 0.72 : 0.55}
          transition="color 160ms ease, opacity 160ms ease"
          aria-hidden
        />
      )}
    </ChakraLink>
  );

  return (
    <Tooltip label={menu.name} placement="right" isDisabled={!collapsed}>
      <Box>{menuRow}</Box>
    </Tooltip>
  );
}

type MenuGroupProps = {
  menu: MenuNode;
  currentMenuId?: string;
  collapsed: boolean;
  tabIndex?: number;
};

type MenuItemsProps = {
  items: MenuNode[];
  currentMenuId?: string;
  collapsed: boolean;
  tabIndex?: number;
};

function MenuItems({
  items,
  currentMenuId,
  collapsed,
  tabIndex,
}: MenuItemsProps) {
  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <FlatMenuItem
          key={item.id}
          menu={item}
          currentMenuId={currentMenuId}
          collapsed={collapsed}
          tabIndex={tabIndex}
        />
      ))}
    </Stack>
  );
}

function MenuGroup({
  menu,
  currentMenuId,
  collapsed,
  tabIndex,
}: MenuGroupProps) {
  const items = flattenNavigableMenus(menu.children);
  if (items.length === 0) return null;

  return (
    <Box role="group" aria-label={menu.name}>
      {!collapsed && (
        <Text
          px={3}
          mb={1}
          color="ink.400"
          fontSize="xs"
          fontWeight="600"
          lineHeight="6"
        >
          {menu.name}
        </Text>
      )}

      <MenuItems
        items={items}
        currentMenuId={currentMenuId}
        collapsed={collapsed}
        tabIndex={tabIndex}
      />
    </Box>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { menus } = useWorkspaceData();
  const desktopSidebarCollapsed = useUiStore(
    (state) => state.desktopSidebarCollapsed,
  );
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const closeMobileSidebar = useUiStore((state) => state.closeMobileSidebar);
  const sidebarMenus = useMemo(
    () =>
      menus.filter((menu) => {
        const href = getHref(menu);
        return !href || (href !== '/profile' && href !== '/admin/profile');
      }),
    [menus],
  );
  const currentMenu = useMemo(
    () => getCurrentMenu(pathname, menus),
    [menus, pathname],
  );
  const restoreMobileSidebarToggleFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      document
        .getElementById(ADMIN_SIDEBAR_TOGGLE_ID)
        ?.focus({ preventScroll: true });
    });
  }, []);
  const closeMobileSidebarAndRestoreFocus = useCallback(() => {
    closeMobileSidebar();
    restoreMobileSidebarToggleFocus();
  }, [closeMobileSidebar, restoreMobileSidebarToggleFocus]);

  useEffect(() => {
    const shouldRestoreFocus = useUiStore.getState().mobileSidebarOpen;
    closeMobileSidebar();
    if (shouldRestoreFocus) restoreMobileSidebarToggleFocus();
  }, [closeMobileSidebar, pathname, restoreMobileSidebarToggleFocus]);

  const collapsed =
    useBreakpointValue({ base: false, lg: desktopSidebarCollapsed }) ?? false;
  const isMobileViewport =
    useBreakpointValue({ base: true, lg: false }) ?? true;
  const mobileSidebarInactive = isMobileViewport && !mobileSidebarOpen;
  const syncSidebarInert = useCallback(
    (element: HTMLElement | null) => {
      element?.toggleAttribute('inert', mobileSidebarInactive);
    },
    [mobileSidebarInactive],
  );
  const sidebarWidth = collapsed
    ? DESKTOP_SIDEBAR_COLLAPSED_WIDTH
    : DESKTOP_SIDEBAR_EXPANDED_WIDTH;

  return (
    <>
      <Box
        display={{ base: mobileSidebarOpen ? 'block' : 'none', lg: 'none' }}
        position="absolute"
        insetInlineStart={MOBILE_SIDEBAR_WIDTH}
        insetInlineEnd={0}
        insetBlockStart={0}
        insetBlockEnd={0}
        bg="blackAlpha.300"
        zIndex="overlay"
        data-testid="admin-sidebar-overlay"
        onClick={closeMobileSidebarAndRestoreFocus}
        aria-hidden
      />

      <Box
        ref={syncSidebarInert}
        id={ADMIN_SIDEBAR_ID}
        as="aside"
        aria-hidden={mobileSidebarInactive ? true : undefined}
        position="absolute"
        insetBlockStart={0}
        insetBlockEnd={0}
        insetInlineStart={0}
        w={{ base: MOBILE_SIDEBAR_WIDTH, lg: sidebarWidth }}
        bg="transparent"
        boxShadow="none"
        backdropFilter="none"
        zIndex="modal"
        transform={{
          base: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          lg: 'none',
        }}
        transition="width 180ms ease, transform 180ms ease"
      >
        <Flex
          h="full"
          direction="column"
          p={{ base: 3, lg: collapsed ? 2 : 3 }}
        >
          <Box
            as="nav"
            aria-label="主菜单"
            flex={1}
            minH={0}
            overflowY="auto"
            overflowX="hidden"
            overscrollBehavior="contain"
            pe={collapsed ? 0 : 1}
          >
            {sidebarMenus.length > 0 ? (
              <Stack spacing={collapsed ? 1 : 5}>
                {sidebarMenus.map((menu) =>
                  menu.type === 'DIR' && menu.children.length > 0 ? (
                    <MenuGroup
                      key={menu.id}
                      menu={menu}
                      currentMenuId={currentMenu?.id}
                      collapsed={collapsed}
                      tabIndex={mobileSidebarInactive ? -1 : undefined}
                    />
                  ) : menu.type !== 'DIR' ? (
                    <MenuItems
                      key={menu.id}
                      items={[menu, ...flattenNavigableMenus(menu.children)]}
                      currentMenuId={currentMenu?.id}
                      collapsed={collapsed}
                      tabIndex={mobileSidebarInactive ? -1 : undefined}
                    />
                  ) : null,
                )}
              </Stack>
            ) : (
              !collapsed && (
                <Text px={3} py={4} color="ink.500" fontSize="sm">
                  暂无可用菜单
                </Text>
              )
            )}
          </Box>
        </Flex>
      </Box>
    </>
  );
}
