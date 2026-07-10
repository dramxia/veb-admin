'use client';

import {
  ChakraProvider,
  extendTheme,
  type StyleFunctionProps,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { RouteProgress } from '@/components/common/route-progress';

const badgeSubtleStyles = ({ colorScheme }: StyleFunctionProps) => {
  const scheme = colorScheme ?? 'brand';
  const styles: Record<
    string,
    { bg: string; borderColor: string; boxShadow: string; color: string }
  > = {
    brand: {
      bg: 'rgba(238, 247, 255, 0.78)',
      borderColor: 'rgba(22, 119, 255, 0.18)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.74)',
      color: '#0f5ed7',
    },
    blue: {
      bg: 'rgba(238, 247, 255, 0.78)',
      borderColor: 'rgba(22, 119, 255, 0.18)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.74)',
      color: '#0f5ed7',
    },
    cyan: {
      bg: 'rgba(240, 249, 255, 0.78)',
      borderColor: 'rgba(14, 165, 233, 0.20)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
      color: '#0369a1',
    },
    gray: {
      bg: 'rgba(248, 250, 252, 0.66)',
      borderColor: 'rgba(148, 163, 184, 0.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
      color: '#475569',
    },
    green: {
      bg: 'rgba(236, 253, 245, 0.76)',
      borderColor: 'rgba(22, 163, 74, 0.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
      color: '#15803d',
    },
    orange: {
      bg: 'rgba(255, 251, 235, 0.78)',
      borderColor: 'rgba(245, 158, 11, 0.24)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
      color: '#b45309',
    },
    purple: {
      bg: 'rgba(245, 243, 255, 0.78)',
      borderColor: 'rgba(109, 93, 252, 0.20)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
      color: '#5b4be5',
    },
    red: {
      bg: 'rgba(254, 242, 242, 0.68)',
      borderColor: 'rgba(229, 62, 62, 0.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
      color: '#b91c1c',
    },
  };

  return (
    styles[scheme] ?? {
      bg: 'rgba(238, 247, 255, 0.78)',
      borderColor: 'rgba(22, 119, 255, 0.18)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
      color: '#0f5ed7',
    }
  );
};

const solidButtonVariant = ({ colorScheme }: StyleFunctionProps) => {
  if (colorScheme === 'red') {
    return {
      bg: '#ef4444',
      color: 'white',
      boxShadow: '0 14px 28px rgba(239, 68, 68, 0.20)',
      _hover: {
        bg: '#dc2626',
        transform: 'translateY(-1px)',
        boxShadow: '0 18px 38px rgba(239, 68, 68, 0.24)',
        _disabled: { bg: '#ef4444', transform: 'none' },
      },
      _active: { bg: '#b91c1c', transform: 'translateY(0)' },
    };
  }

  if (colorScheme === 'green') {
    return {
      bg: '#16a34a',
      color: 'white',
      boxShadow: '0 14px 28px rgba(22, 163, 74, 0.18)',
      _hover: {
        bg: '#15803d',
        transform: 'translateY(-1px)',
        boxShadow: '0 18px 38px rgba(22, 163, 74, 0.22)',
        _disabled: { bg: '#16a34a', transform: 'none' },
      },
      _active: { bg: '#166534', transform: 'translateY(0)' },
    };
  }

  if (colorScheme === 'orange' || colorScheme === 'yellow') {
    return {
      bg: '#f59e0b',
      color: 'white',
      boxShadow: '0 14px 28px rgba(245, 158, 11, 0.18)',
      _hover: {
        bg: '#d97706',
        transform: 'translateY(-1px)',
        boxShadow: '0 18px 38px rgba(245, 158, 11, 0.22)',
        _disabled: { bg: '#f59e0b', transform: 'none' },
      },
      _active: { bg: '#b45309', transform: 'translateY(0)' },
    };
  }

  return {
    bg: 'linear-gradient(135deg, #1677ff 0%, #63b3ed 54%, #6d5dfc 100%)',
    color: 'white',
    boxShadow: '0 14px 30px rgba(22, 119, 255, 0.22)',
    _hover: {
      bg: 'linear-gradient(135deg, #0f5ed7 0%, #3ba0e8 54%, #5b4be5 100%)',
      transform: 'translateY(-1px)',
      boxShadow: '0 18px 40px rgba(22, 119, 255, 0.28)',
      _disabled: { bg: 'brand.500', transform: 'none' },
    },
    _active: { bg: 'brand.700', transform: 'translateY(0)' },
  };
};

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
    // 兼容旧组件 token，实际视觉映射到同一套浅蓝/蓝灰体系。
    mint: {
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
    sage: {
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
    surface: {
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
    glass:
      '0 20px 46px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.72)',
    glow: '0 24px 80px rgba(22, 119, 255, 0.24)',
  },
  transition: {
    property: {
      liquid:
        'transform, opacity, background, border-color, box-shadow, filter',
    },
  },
  styles: {
    global: {
      'html, body': {
        minHeight: '100%',
        bg: '#f8fbff',
        color: 'ink.800',
      },
      body: {
        background:
          'radial-gradient(circle at 12% 10%, rgba(22, 119, 255, 0.14), transparent 28%), radial-gradient(circle at 88% 4%, rgba(99, 102, 241, 0.12), transparent 24%), radial-gradient(circle at 50% 100%, rgba(14, 165, 233, 0.10), transparent 32%), linear-gradient(135deg, #f8fbff 0%, #f3f7ff 46%, #eef4ff 100%)',
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
        solid: solidButtonVariant,
        ghost: {
          color: 'ink.700',
          _hover: {
            bg: 'rgba(22, 119, 255, 0.06)',
            color: 'ink.900',
            transform: 'translateY(-1px)',
          },
          _active: {
            bg: 'rgba(22, 119, 255, 0.10)',
            transform: 'translateY(0)',
          },
        },
        outline: {
          borderColor: 'ink.200',
          bg: 'rgba(255, 255, 255, 0.72)',
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
        borderWidth: '1px',
        px: 2.25,
        py: 0.5,
        borderRadius: 'full',
        fontWeight: 700,
        fontSize: 'xs',
        letterSpacing: '0',
        textTransform: 'none',
        backdropFilter: 'blur(12px) saturate(170%)',
      },
      defaultProps: {
        variant: 'subtle',
      },
      variants: {
        subtle: badgeSubtleStyles,
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
            borderColor: 'ink.200',
            bg: 'whiteAlpha.900',
            color: 'ink.800',
            _placeholder: { color: 'ink.400' },
            _hover: { borderColor: 'brand.300' },
            _focusVisible: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 3px rgba(22, 119, 255, 0.14)',
            },
            _invalid: {
              borderColor: '#ef4444',
              bg: '#fef2f2',
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
            color: 'ink.800',
            _placeholder: { color: 'ink.400' },
            _hover: { borderColor: 'brand.300' },
            _focusVisible: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 3px rgba(22, 119, 255, 0.14)',
            },
            _invalid: {
              borderColor: '#ef4444',
              bg: '#fef2f2',
            },
          },
        },
      },
    },
    Textarea: {
      variants: {
        outline: {
          borderRadius: '14px',
          borderColor: 'ink.200',
          bg: 'whiteAlpha.900',
          color: 'ink.800',
          _placeholder: { color: 'ink.400' },
          _hover: { borderColor: 'brand.300' },
          _focusVisible: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 3px rgba(22, 119, 255, 0.14)',
          },
          _invalid: {
            borderColor: '#ef4444',
            bg: '#fef2f2',
          },
        },
      },
    },
    FormLabel: {
      baseStyle: {
        color: 'ink.700',
        fontWeight: 600,
      },
    },
    FormHelperText: {
      baseStyle: {
        color: 'ink.500',
      },
    },
    FormError: {
      baseStyle: {
        text: {
          color: '#dc2626',
          fontWeight: 600,
          fontSize: 'sm',
        },
      },
    },
    Progress: {
      baseStyle: {
        track: {
          bg: 'brand.50',
          borderRadius: 'full',
          overflow: 'hidden',
        },
        filledTrack: {
          bg: 'linear-gradient(90deg, #1677ff, #63b3ed, #6d5dfc)',
        },
      },
    },
    Skeleton: {
      baseStyle: {
        startColor: 'brand.50',
        endColor: 'ink.100',
      },
    },
    Tooltip: {
      baseStyle: {
        bg: 'rgba(15, 23, 42, 0.84)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: 'card',
        fontWeight: 600,
      },
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: '18px',
          borderWidth: '1px',
          borderColor: 'rgba(255,255,255,0.70)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70)',
        },
      },
    },
    Modal: {
      baseStyle: {
        overlay: {
          bg: 'rgba(248, 251, 255, 0.58)',
          backdropFilter: 'blur(16px)',
        },
        dialog: {
          borderRadius: '24px',
          borderWidth: '1px',
          borderColor: 'rgba(255,255,255,0.76)',
          bg: 'rgba(255,255,255,0.88)',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.14)',
          overflow: 'hidden',
          backdropFilter: 'blur(24px) saturate(180%)',
        },
        header: {
          color: 'ink.900',
          fontWeight: 900,
        },
        body: {
          color: 'ink.700',
        },
      },
    },
    Drawer: {
      baseStyle: {
        overlay: {
          bg: 'rgba(248, 251, 255, 0.58)',
          backdropFilter: 'blur(16px)',
        },
        dialog: {
          bg: 'rgba(255,255,255,0.92)',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.14)',
          backdropFilter: 'blur(24px) saturate(180%)',
        },
        header: {
          color: 'ink.900',
          fontWeight: 900,
        },
        body: {
          color: 'ink.700',
        },
      },
    },
    Checkbox: {
      baseStyle: {
        control: {
          borderRadius: '8px',
          borderColor: 'ink.300',
          _checked: {
            bg: 'brand.500',
            borderColor: 'brand.500',
          },
          _focusVisible: {
            boxShadow: '0 0 0 3px rgba(22, 119, 255, 0.14)',
          },
        },
      },
    },
    Switch: {
      baseStyle: {
        track: {
          _checked: {
            bg: 'brand.500',
          },
        },
      },
    },
    Tabs: {
      variants: {
        softRounded: {
          tab: {
            borderRadius: 'full',
            fontWeight: 700,
            color: 'ink.500',
            _selected: {
              bg: 'brand.50',
              color: 'brand.700',
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
          fontWeight: 700,
          letterSpacing: '0',
          borderColor: 'ink.100',
          lineHeight: '1.35',
          py: 2.5,
          textTransform: 'uppercase',
        },
        td: {
          borderColor: 'ink.100',
          color: 'ink.700',
          fontSize: 'sm',
          lineHeight: '1.55',
          py: 4,
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
          color: 'ink.700',
          _hover: {
            bg: 'rgba(22, 119, 255, 0.06)',
            color: 'ink.900',
          },
          _focus: {
            bg: 'rgba(22, 119, 255, 0.08)',
            color: 'ink.900',
          },
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
