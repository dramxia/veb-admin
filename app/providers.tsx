'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import type { ReactNode } from 'react';

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
    <CacheProvider>
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </CacheProvider>
  );
}
