'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { RouteProgress } from '@/components/common/route-progress';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#eef7ff',
      100: '#d8ecff',
      200: '#b7ddff',
      300: '#83c8ff',
      400: '#48a8ff',
      500: '#1677ff',
      600: '#0f5ed7',
      700: '#104cad',
      800: '#13428c',
      900: '#153a75',
    },
    ink: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  fonts: {
    heading:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  radii: {
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
  },
  shadows: {
    soft: '0 18px 50px rgba(15, 23, 42, 0.08)',
    card: '0 18px 44px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
    glow: '0 24px 80px rgba(22, 119, 255, 0.24)',
  },
  styles: {
    global: {
      'html, body': {
        minHeight: '100%',
        bg: '#f6f8fc',
        color: 'ink.800',
      },
      body: {
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '::selection': {
        bg: 'brand.100',
        color: 'brand.800',
      },
      'a, button': {
        WebkitTapHighlightColor: 'transparent',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 700,
        borderRadius: '14px',
      },
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          boxShadow: '0 10px 24px rgba(22, 119, 255, 0.24)',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: '0 14px 30px rgba(22, 119, 255, 0.28)',
            _disabled: { bg: 'brand.500', transform: 'none' },
          },
          _active: { bg: 'brand.700', transform: 'translateY(0)' },
        },
        ghost: {
          _hover: { bg: 'blackAlpha.50' },
          _active: { bg: 'blackAlpha.100' },
        },
        outline: {
          borderColor: 'ink.200',
          bg: 'whiteAlpha.700',
          _hover: {
            borderColor: 'brand.300',
            bg: 'brand.50',
            transform: 'translateY(-1px)',
          },
          _active: { transform: 'translateY(0)' },
        },
      },
    },
    Badge: {
      baseStyle: {
        px: 2.5,
        py: 1,
        borderRadius: 'full',
        fontWeight: 800,
        letterSpacing: '0.02em',
        textTransform: 'none',
      },
      defaultProps: {
        variant: 'subtle',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '24px',
          borderWidth: '1px',
          borderColor: 'whiteAlpha.800',
          bg: 'rgba(255, 255, 255, 0.86)',
          boxShadow: 'card',
          overflow: 'hidden',
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: '14px',
            borderColor: 'ink.200',
            bg: 'whiteAlpha.900',
            _hover: { borderColor: 'brand.300' },
            _focusVisible: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 3px rgba(22, 119, 255, 0.14)',
            },
          },
        },
      },
    },
    Select: {
      variants: {
        outline: {
          field: {
            borderRadius: '14px',
            borderColor: 'ink.200',
            bg: 'whiteAlpha.900',
            _hover: { borderColor: 'brand.300' },
            _focusVisible: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 3px rgba(22, 119, 255, 0.14)',
            },
          },
        },
      },
    },
    Table: {
      baseStyle: {
        th: {
          color: 'ink.500',
          fontSize: 'xs',
          letterSpacing: '0.04em',
          borderColor: 'ink.100',
          py: 3.5,
        },
        td: {
          borderColor: 'ink.100',
          py: 3.5,
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          borderRadius: '18px',
          borderColor: 'whiteAlpha.700',
          boxShadow: 'card',
          p: 2,
        },
        item: {
          borderRadius: '12px',
          fontWeight: 600,
        },
      },
    },
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
