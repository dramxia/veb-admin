'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { RouteProgress } from '@/components/common/route-progress';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#eff6ff',
      500: '#2563eb',
      600: '#1d4ed8',
    },
  },
  radii: {
    md: '10px',
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      {children}
    </ChakraProvider>
  );
}
