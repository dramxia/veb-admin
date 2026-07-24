'use client';

import { Box } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useMemo } from 'react';
import type { UserNavigation } from '@veb/api-contracts';
import type { AuthUser } from '@/stores/auth-store';
import { Header } from './header';
import { resolveAppModule, sortWorkspaceModules } from './app-modules';
import { DASHBOARD_HEADER_HEIGHT } from './layout-constants';
import { MenuStoreInitializer } from './menu-store-initializer';
import { filterNavigableMenuTree } from './navigation-utils';
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
  modules: unsortedModules,
  permissionCodes,
  activeModuleId,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const modules = useMemo(
    () =>
      sortWorkspaceModules(
        unsortedModules.map((module) => ({
          ...module,
          menus: filterNavigableMenuTree(module.menus),
        })),
      ),
    [unsortedModules],
  );
  const activeModule = useMemo(
    () =>
      pathname === '/profile' || pathname === '/admin/profile'
        ? undefined
        : resolveAppModule(pathname, modules, activeModuleId),
    [activeModuleId, modules, pathname],
  );
  const menus = activeModule?.menus ?? [];

  return (
    <WorkspaceDataProvider
      activeModule={activeModule}
      menus={menus}
      modules={modules}
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
          modules={modules}
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
