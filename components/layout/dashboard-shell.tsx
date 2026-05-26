'use client';

import { Box, Flex } from '@chakra-ui/react';
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
    <Flex minH="100vh" bg="gray.50">
      <MenuStoreInitializer menus={menus} permissionCodes={permissionCodes} user={user} />
      <Sidebar />
      <Box flex="1" minW={0}>
        <Header user={user} />
        <Box as="main" p={6}>{children}</Box>
      </Box>
    </Flex>
  );
}
