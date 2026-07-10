'use client';

import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { MenuNode } from '@/lib/menu';
import { Header } from './header';
import { MenuStoreInitializer } from './menu-store-initializer';
import { DESKTOP_SIDEBAR_WIDTH, Sidebar } from './sidebar';

type DashboardShellProps = {
  children: ReactNode;
  user: {
    id: string;
    username: string;
    nickname?: string | null;
    avatar?: string | null;
    roles: string[];
  };
  menus: MenuNode[];
  permissionCodes: string[];
};

export function DashboardShell({
  children,
  user,
  menus,
  permissionCodes,
}: DashboardShellProps) {
  return (
    <Box
      minH="100dvh"
      layerStyle="appCanvas"
      position="relative"
      isolation="isolate"
    >
      <MenuStoreInitializer
        menus={menus}
        permissionCodes={permissionCodes}
        user={user}
      />

      <Sidebar initialMenus={menus} />

      <Box minH="100dvh" ms={{ base: 0, lg: DESKTOP_SIDEBAR_WIDTH }} minW={0}>
        <Header user={user} initialMenus={menus} />

        <Box
          as="main"
          position="relative"
          w="full"
          maxW="1280px"
          mx="auto"
          px={{ base: 3, md: 5, xl: 8 }}
          pt={{ base: 5, md: 7 }}
          pb={{
            base: 'calc(116px + env(safe-area-inset-bottom))',
            lg: 12,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
