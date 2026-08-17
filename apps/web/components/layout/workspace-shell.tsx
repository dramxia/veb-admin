'use client';

import { Box } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useMemo } from 'react';
import type { UserNavigation } from '@veb/api-contracts';
import type { AuthUser } from '@/stores/auth-store';
import { Header } from './header';
import { resolveAppModule } from './app-modules';
import { DASHBOARD_HEADER_HEIGHT } from './layout-constants';
import { MenuStoreInitializer } from './menu-store-initializer';
import { flattenNavigableMenus } from './navigation-utils';
import { UiStoreInitializer } from './ui-store-initializer';
import { WorkspaceDataProvider } from './workspace-data-context';

type WorkspaceShellProps = {
  children: ReactNode;
  user: AuthUser;
  modules: UserNavigation['modules'];
  permissionCodes: string[];
  activeModuleId?: string;
};

export function WorkspaceShell({
  children,
  user,
  modules,
  permissionCodes,
  activeModuleId,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const activeModule = useMemo(
    () =>
      pathname === '/profile' || pathname === '/admin/profile'
        ? undefined
        : resolveAppModule(pathname, modules, activeModuleId),
    [activeModuleId, modules, pathname],
  );
  const menus = activeModule?.menus ?? [];
  const showSidebar = flattenNavigableMenus(menus).length > 1;

  return (
    <WorkspaceDataProvider
      activeModule={activeModule}
      menus={menus}
      modules={modules}
      showSidebar={showSidebar}
    >
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
          <Header user={user} />
          <Box h={`calc(100dvh - ${DASHBOARD_HEADER_HEIGHT})`} minH={0}>
            {children}
          </Box>
        </UiStoreInitializer>
      </Box>
    </WorkspaceDataProvider>
  );
}
