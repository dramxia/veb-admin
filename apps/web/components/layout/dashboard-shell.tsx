'use client';

import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { MenuNode } from '@veb/api-contracts';
import type { AuthUser } from '@/stores/auth-store';
import { Header } from './header';
import { DASHBOARD_HEADER_HEIGHT } from './layout-constants';
import { MenuStoreInitializer } from './menu-store-initializer';
import {
  DESKTOP_SIDEBAR_COLLAPSED_WIDTH,
  DESKTOP_SIDEBAR_EXPANDED_WIDTH,
  MOBILE_SIDEBAR_WIDTH,
  Sidebar,
} from './sidebar';
import { useUiStore } from '@/stores/ui-store';

type DashboardShellProps = {
  children: ReactNode;
  user: AuthUser;
  menus: MenuNode[];
  permissionCodes: string[];
};

export function DashboardShell({
  children,
  user,
  menus,
  permissionCodes,
}: DashboardShellProps) {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);

  return (
    <Box
      h="100dvh"
      minH={0}
      layerStyle="appCanvas"
      position="relative"
      isolation="isolate"
      overflow="hidden"
    >
      <MenuStoreInitializer
        menus={menus}
        permissionCodes={permissionCodes}
        user={user}
      />

      <Header user={user} initialMenus={menus} />

      <Sidebar initialMenus={menus} />

      <Box
        h={`calc(100dvh - ${DASHBOARD_HEADER_HEIGHT})`}
        minW={0}
        overflow="hidden"
        pe={{ base: 3, md: 4 }}
        pb={{ base: 3, md: 4 }}
        ms={{
          base: 0,
          lg: sidebarCollapsed
            ? DESKTOP_SIDEBAR_COLLAPSED_WIDTH
            : DESKTOP_SIDEBAR_EXPANDED_WIDTH,
        }}
        transform={{
          base: sidebarCollapsed
            ? 'translateX(0)'
            : `translateX(${MOBILE_SIDEBAR_WIDTH})`,
          lg: 'none',
        }}
        transition="margin 180ms ease, transform 180ms ease"
      >
        <Box
          id="dashboard-main"
          as="main"
          position="relative"
          w="full"
          h="full"
          px={{ base: 3, md: 5, xl: 8 }}
          pt={{ base: 5, md: 7 }}
          pb={{ base: 5, md: 7 }}
          overflowX="hidden"
          overflowY="auto"
          overscrollBehavior="contain"
          bg="rgba(255, 255, 255, 0.30)"
          rounded={{ base: 'xl', md: '2xl' }}
          backdropFilter="blur(24px) saturate(160%)"
          sx={{ WebkitBackdropFilter: 'blur(24px) saturate(160%)' }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
