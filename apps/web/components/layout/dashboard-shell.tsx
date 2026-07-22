'use client';

import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { MenuNode } from '@veb/api-contracts';
import type { AuthUser } from '@/stores/auth-store';
import { Header } from './header';
import { MenuStoreInitializer } from './menu-store-initializer';
import { OrbitalMenu } from './orbital-menu';

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

      <Box minH="100dvh" minW={0}>
        <Header user={user} initialMenus={menus} />

        <Box
          id="dashboard-main"
          as="main"
          position="relative"
          w="full"
          maxW="1280px"
          mx="auto"
          px={{ base: 3, md: 5, xl: 8 }}
          pt={{ base: 5, md: 7 }}
          pb={{
            base: 'calc(84px + env(safe-area-inset-bottom))',
            lg: 14,
          }}
        >
          {children}
        </Box>
      </Box>

      <OrbitalMenu initialMenus={menus} targetId="dashboard-main" />
    </Box>
  );
}
