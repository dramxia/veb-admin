'use client';

import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { MenuNode } from '@/lib/menu';
import { Header } from './header';
import { MenuStoreInitializer } from './menu-store-initializer';
import { Sidebar } from './sidebar';

type DashboardShellProps = {
  children: ReactNode;
  user: { id: string; username: string; nickname?: string | null; avatar?: string | null; roles: string[] };
  menus: MenuNode[];
  permissionCodes: string[];
};

export function DashboardShell({ children, user, menus, permissionCodes }: DashboardShellProps) {
  return (
    <Box
      minH="100vh"
      bg="linear-gradient(135deg, #f8fbff 0%, #f3f7ff 46%, #eef4ff 100%)"
      position="relative"
      overflowX="hidden"
      _before={{
        content: '""',
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        bg: 'radial-gradient(circle at 12% 10%, rgba(22, 119, 255, 0.14), transparent 28%), radial-gradient(circle at 88% 4%, rgba(99, 102, 241, 0.12), transparent 24%), radial-gradient(circle at 50% 100%, rgba(14, 165, 233, 0.10), transparent 32%)',
      }}
    >
      <MenuStoreInitializer menus={menus} permissionCodes={permissionCodes} user={user} />
      <Header user={user} />
      <Box
        as="main"
        position="relative"
        maxW="1280px"
        mx="auto"
        px={{ base: 4, md: 6, xl: 8 }}
        pt={{ base: 5, md: 8 }}
        pb="calc(136px + env(safe-area-inset-bottom))"
      >
        {children}
      </Box>
      <Sidebar initialMenus={menus} />
    </Box>
  );
}
