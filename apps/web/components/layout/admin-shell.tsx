'use client';

import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  DESKTOP_SIDEBAR_COLLAPSED_WIDTH,
  DESKTOP_SIDEBAR_EXPANDED_WIDTH,
  Sidebar,
} from './sidebar';
import { useUiStore } from '@/stores/ui-store';
import { useWorkspaceData } from './workspace-data-context';

export function AdminShell({ children }: { children: ReactNode }) {
  const { showSidebar } = useWorkspaceData();
  const closeMobileSidebar = useUiStore((state) => state.closeMobileSidebar);
  const desktopSidebarCollapsed = useUiStore(
    (state) => state.desktopSidebarCollapsed,
  );

  useEffect(() => {
    if (!showSidebar) closeMobileSidebar();
  }, [closeMobileSidebar, showSidebar]);

  return (
    <Box h="full" minH={0} position="relative" overflow="hidden">
      {showSidebar ? <Sidebar /> : null}
      <Box
        h="full"
        minW={0}
        overflow="hidden"
        pe={{ base: 3, md: 4 }}
        pb={{ base: 3, md: 4 }}
        ms={{
          base: 0,
          lg:
            showSidebar && desktopSidebarCollapsed
              ? DESKTOP_SIDEBAR_COLLAPSED_WIDTH
              : showSidebar
                ? DESKTOP_SIDEBAR_EXPANDED_WIDTH
                : 0,
        }}
        transition="margin 180ms ease"
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
