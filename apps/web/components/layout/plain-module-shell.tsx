import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export function PlainModuleShell({ children }: { children: ReactNode }) {
  return (
    <Box
      id="module-main"
      as="main"
      h="full"
      minW={0}
      overflowX="hidden"
      overflowY="auto"
      overscrollBehavior="contain"
      px={{ base: 3, md: 5, xl: 8 }}
      py={{ base: 5, md: 7 }}
    >
      {children}
    </Box>
  );
}
