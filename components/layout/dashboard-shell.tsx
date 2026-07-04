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
      bg="linear-gradient(135deg, #fbfdfb 0%, #eef7f1 38%, #f6f8fb 68%, #edf7f8 100%)"
      position="relative"
      overflowX="hidden"
      _before={{
        content: '""',
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        bg: 'linear-gradient(115deg, rgba(255,255,255,0.78), rgba(255,255,255,0.18) 42%, rgba(228,244,236,0.42)), repeating-linear-gradient(90deg, rgba(23,33,29,0.025) 0, rgba(23,33,29,0.025) 1px, transparent 1px, transparent 120px)',
        maskImage: 'linear-gradient(180deg, black, rgba(0,0,0,0.72))',
      }}
    >
      <MenuStoreInitializer menus={menus} permissionCodes={permissionCodes} user={user} />
      <Box px={{ base: 3, md: 5, xl: 8 }} pt={{ base: 3, md: 4 }} position="relative" zIndex={2}>
        <Header user={user} initialMenus={menus} />
      </Box>
      <Box
        as="main"
        position="relative"
        maxW="1460px"
        mx="auto"
        px={{ base: 3, md: 5, xl: 8 }}
        pt={{ base: 5, md: 7 }}
        pb="calc(148px + env(safe-area-inset-bottom))"
        zIndex={1}
      >
        {children}
      </Box>
      <Sidebar initialMenus={menus} />
    </Box>
  );
}
