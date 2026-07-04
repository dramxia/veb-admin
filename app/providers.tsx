'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { RouteProgress } from '@/components/common/route-progress';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#effcf5',
      100: '#d9f7e6',
      200: '#b7ebcf',
      300: '#86d9ad',
      400: '#4fbf84',
      500: '#21a66c',
      600: '#168654',
      700: '#126b45',
      800: '#11563a',
      900: '#0f4732',
    },
    mint: {
      50: '#f3fbf7',
      100: '#e2f6ec',
      200: '#c6ecd8',
      300: '#9bdcbc',
      400: '#6ac69b',
      500: '#31a878',
      600: '#23865f',
      700: '#1d6b4f',
      800: '#1a5642',
      900: '#164638',
    },
    sage: {
      50: '#f6f8f4',
      100: '#e8eee3',
      200: '#d5dfcd',
      300: '#b9c8ad',
      400: '#9caf8c',
      500: '#7e966d',
      600: '#617653',
      700: '#4d5f43',
      800: '#3f4d38',
      900: '#344031',
    },
    surface: {
      50: '#fbfdfb',
      100: '#f4f8f5',
      200: '#e9f0eb',
      300: '#dbe5de',
      400: '#c4d1c9',
      500: '#94a69b',
      600: '#64756b',
      700: '#45554c',
      800: '#2b3731',
      900: '#17211d',
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
    soft: '0 18px 50px rgba(23, 33, 29, 0.08)',
    card: '0 22px 60px rgba(23, 33, 29, 0.10), 0 1px 2px rgba(23, 33, 29, 0.04)',
    glass: '0 22px 70px rgba(23, 33, 29, 0.12), inset 0 1px 0 rgba(255,255,255,0.72)',
    glow: '0 24px 80px rgba(33, 166, 108, 0.20)',
  },
  transition: {
    property: {
      liquid: 'transform, opacity, background, border-color, box-shadow, filter',
    },
  },
  styles: {
    global: {
      'html, body': {
        minHeight: '100%',
        bg: '#f7faf7',
        color: 'surface.900',
      },
      body: {
        background:
          'linear-gradient(135deg, #fbfdfb 0%, #eef7f1 38%, #f6f8fb 68%, #edf7f8 100%)',
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '::selection': {
        bg: 'mint.100',
        color: 'mint.800',
      },
      'a, button': {
        WebkitTapHighlightColor: 'transparent',
      },
      '@media (prefers-reduced-motion: reduce)': {
        '*, *::before, *::after': {
          animationDuration: '0.01ms !important',
          animationIterationCount: '1 !important',
          scrollBehavior: 'auto !important',
          transitionDuration: '0.01ms !important',
        },
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 700,
        borderRadius: '14px',
        letterSpacing: '0',
        transitionProperty: 'liquid',
        transitionDuration: '180ms',
      },
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'linear-gradient(135deg, #21a66c 0%, #3bbf93 100%)',
          color: 'white',
          boxShadow: '0 14px 28px rgba(33, 166, 108, 0.24)',
          _hover: {
            bg: 'linear-gradient(135deg, #168654 0%, #2fa985 100%)',
            transform: 'translateY(-1px)',
            boxShadow: '0 18px 38px rgba(33, 166, 108, 0.30)',
            _disabled: { bg: 'brand.500', transform: 'none' },
          },
          _active: { bg: 'brand.700', transform: 'translateY(0)' },
        },
        ghost: {
          _hover: { bg: 'blackAlpha.50', transform: 'translateY(-1px)' },
          _active: { bg: 'blackAlpha.100', transform: 'translateY(0)' },
        },
        outline: {
          borderColor: 'rgba(148, 166, 155, 0.34)',
          bg: 'rgba(255, 255, 255, 0.58)',
          _hover: {
            borderColor: 'mint.300',
            bg: 'mint.50',
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
        letterSpacing: '0',
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
          borderColor: 'rgba(255, 255, 255, 0.74)',
          bg: 'rgba(255, 255, 255, 0.70)',
          boxShadow: 'glass',
          overflow: 'hidden',
          backdropFilter: 'blur(26px) saturate(180%)',
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: '14px',
            borderColor: 'rgba(148, 166, 155, 0.38)',
            bg: 'rgba(255,255,255,0.68)',
            _hover: { borderColor: 'mint.300' },
            _focusVisible: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 3px rgba(33, 166, 108, 0.14)',
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
            borderColor: 'rgba(148, 166, 155, 0.38)',
            bg: 'rgba(255,255,255,0.68)',
            _hover: { borderColor: 'mint.300' },
            _focusVisible: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 3px rgba(33, 166, 108, 0.14)',
            },
          },
        },
      },
    },
    Table: {
      baseStyle: {
        th: {
          color: 'surface.600',
          fontSize: 'xs',
          letterSpacing: '0',
          borderColor: 'rgba(148, 166, 155, 0.16)',
          py: 3.5,
        },
        td: {
          borderColor: 'rgba(148, 166, 155, 0.16)',
          py: 3.5,
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          borderRadius: '18px',
          borderColor: 'rgba(255,255,255,0.72)',
          boxShadow: 'glass',
          p: 2,
          bg: 'rgba(255,255,255,0.74)',
          backdropFilter: 'blur(24px) saturate(180%)',
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
