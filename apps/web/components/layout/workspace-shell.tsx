'use client';

import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { MenuNode } from '@veb/api-contracts';
import type { AuthUser } from '@/stores/auth-store';
import { Header } from './header';
import { DASHBOARD_HEADER_HEIGHT } from './layout-constants';
import { MenuStoreInitializer } from './menu-store-initializer';
import { UiStoreInitializer } from './ui-store-initializer';
import { WorkspaceDataProvider } from './workspace-data-context';

type WorkspaceShellProps = {
  children: ReactNode;
  user: AuthUser;
  menus: MenuNode[];
  permissionCodes: string[];
};

export function WorkspaceShell({
  children,
  user,
  menus,
  permissionCodes,
}: WorkspaceShellProps) {
  return (
    <WorkspaceDataProvider menus={menus}>
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
        <UiStoreInitializer>
          <Header user={user} initialMenus={menus} />
          <Box h={`calc(100dvh - ${DASHBOARD_HEADER_HEIGHT})`} minH={0}>
            {children}
          </Box>
        </UiStoreInitializer>
      </Box>
    </WorkspaceDataProvider>
  );
}
