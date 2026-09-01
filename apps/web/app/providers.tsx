'use client';

import {
  ChakraProvider,
  extendTheme,
  type StyleFunctionProps,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { RouteProgress } from '@/components/common/route-progress';
import { OverlayStackProvider } from '@/components/common/managed-overlay';

const canvasBackground =
  'radial-gradient(circle at 12% 10%, rgba(22, 119, 255, 0.14), transparent 28%), radial-gradient(circle at 88% 4%, rgba(99, 102, 241, 0.12), transparent 24%), radial-gradient(circle at 50% 100%, rgba(14, 165, 233, 0.10), transparent 32%), linear-gradient(135deg, #f8fbff 0%, #f3f7ff 46%, #eef4ff 100%)';

const glassBlur = 'blur(18px) saturate(160%)';
const floatingGlassBlur = 'blur(28px) saturate(190%)';

const statusPalettes = {
  brand: { bg: 'brand.50', border: 'brand.100', fg: 'brand.700' },
  blue: { bg: 'statusInfoBg', border: 'statusInfoBorder', fg: 'statusInfo' },
  cyan: { bg: 'statusInfoBg', border: 'statusInfoBorder', fg: 'statusInfo' },
  gray: { bg: 'surfaceSubtleBg', border: 'borderDefault', fg: 'ink.600' },
  green: {
    bg: 'statusSuccessBg',
    border: 'statusSuccessBorder',
    fg: 'statusSuccess',
  },
  orange: {
    bg: 'statusWarningBg',
    border: 'statusWarningBorder',
    fg: 'statusWarning',
  },
  purple: { bg: 'purple.50', border: 'purple.200', fg: 'purple.700' },
  red: {
    bg: 'statusDangerBg',
    border: 'statusDangerBorder',
    fg: 'statusDanger',
  },
  yellow: {
    bg: 'statusWarningBg',
    border: 'statusWarningBorder',
    fg: 'statusWarning',
  },
} as const;

function getStatusPalette(colorScheme?: string) {
  return (
    statusPalettes[colorScheme as keyof typeof statusPalettes] ??
    statusPalettes.brand
  );
}

const badgeSubtleStyles = ({ colorScheme }: StyleFunctionProps) => {
  const palette = getStatusPalette(colorScheme);

  return {
    bg: palette.bg,
    borderColor: palette.border,
    color: palette.fg,
  };
};

const alertSubtleStyles = ({ colorScheme }: StyleFunctionProps) => {
  const palette = getStatusPalette(colorScheme);

  return {
    container: {
      bg: palette.bg,
      borderColor: palette.border,
      color: 'ink.800',
    },
    description: { color: 'ink.700' },
    icon: { color: palette.fg },
    spinner: { color: palette.fg },
    title: { color: palette.fg },
  };
};

const solidButtonVariant = ({ colorScheme }: StyleFunctionProps) => {
  if (colorScheme === 'red') {
    return {
      bg: 'statusDanger',
      color: 'white',
      _hover: {
        bg: 'statusDangerHover',
        _disabled: {
          bg: 'statusDanger',
        },
      },
      _active: { bg: 'statusDangerActive' },
      _focusVisible: { boxShadow: 'focusRingDanger' },
    };
  }

  if (colorScheme === 'green') {
    return {
      bg: 'statusSuccess',
      color: 'white',
      _hover: {
        bg: 'statusSuccessHover',
        _disabled: {
          bg: 'statusSuccess',
        },
      },
      _active: { bg: 'statusSuccessActive' },
    };
  }

  if (colorScheme === 'orange' || colorScheme === 'yellow') {
    return {
      bg: 'statusWarning',
      color: 'white',
      _hover: {
        bg: 'statusWarningHover',
        _disabled: {
          bg: 'statusWarning',
        },
      },
      _active: { bg: 'statusWarningActive' },
    };
  }

  return {
    bg: 'brand.500',
    color: 'white',
    _hover: {
      bg: 'brand.600',
      _disabled: {
        bg: 'brand.500',
      },
    },
    _active: { bg: 'brand.700' },
  };
};

const outlineButtonVariant = ({ colorScheme }: StyleFunctionProps) => {
  const isDanger = colorScheme === 'red';

  return {
    bg: 'controlBg',
    borderColor: isDanger ? 'statusDangerBorder' : 'borderDefault',
    color: isDanger ? 'statusDanger' : 'ink.700',
    boxShadow: 'insetHairline',
    _hover: {
      bg: isDanger ? 'statusDangerBg' : 'brand.50',
      borderColor: isDanger ? 'statusDanger' : 'brand.300',
      color: isDanger ? 'statusDangerHover' : 'ink.900',
    },
    _active: {
      bg: isDanger ? 'statusDangerBg' : 'brand.100',
    },
    _focusVisible: {
      boxShadow: isDanger ? 'focusRingDanger' : 'focusRing',
    },
  };
};

const ghostButtonVariant = ({ colorScheme }: StyleFunctionProps) => {
  const isDanger = colorScheme === 'red';

  return {
    color: isDanger ? 'statusDanger' : 'ink.700',
    _hover: {
      bg: isDanger ? 'statusDangerBg' : 'brand.50',
      color: isDanger ? 'statusDangerHover' : 'ink.900',
    },
    _active: {
      bg: isDanger ? 'statusDangerBg' : 'brand.100',
    },
    _focusVisible: {
      boxShadow: isDanger ? 'focusRingDanger' : 'focusRing',
    },
  };
};

const inputFieldStyles = {
  bg: 'controlBg',
  borderColor: 'borderDefault',
  borderRadius: 'control',
  color: 'ink.800',
  transitionDuration: '160ms',
  transitionProperty: 'common',
  _hover: { borderColor: 'ink.300' },
  _focusVisible: {
    borderColor: 'brand.500',
    boxShadow: 'focusRing',
    outline: 'none',
  },
  _invalid: {
    bg: 'statusDangerBg',
    borderColor: 'statusDanger',
    boxShadow: 'focusRingDanger',
  },
  _disabled: {
    bg: 'controlDisabledBg',
    borderColor: 'borderSubtle',
    color: 'ink.500',
    cursor: 'not-allowed',
    opacity: 1,
  },
  _readOnly: {
    bg: 'controlReadOnlyBg',
    borderColor: 'borderSubtle',
    color: 'ink.600',
  },
  _placeholder: { color: 'ink.400' },
};

const selectFieldStyles = {
  ...inputFieldStyles,
  appearance: 'none',
  cursor: 'pointer',
  fontWeight: 500,
  pe: 10,
  _hover: {
    bg: 'surfaceSolidBg',
    borderColor: 'brand.300',
  },
  _focus: {
    borderColor: 'brand.500',
    boxShadow: 'focusRing',
    outline: 'none',
  },
  _disabled: {
    ...inputFieldStyles._disabled,
    cursor: 'not-allowed',
  },
  '& option': {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    fontWeight: 500,
  },
  '& optgroup': {
    backgroundColor: '#f8fafc',
    color: '#475569',
    fontWeight: 700,
  },
};

const buttonSizes = {
  xs: { h: 7, minH: 7, minW: 7, px: 2.5, fontSize: 'xs' },
  sm: { h: 8, minH: 8, minW: 8, px: 3, fontSize: 'sm' },
  md: { h: 9, minH: 9, minW: 9, px: 3.5, fontSize: 'sm' },
  lg: { h: 10, minH: 10, minW: 10, px: 4, fontSize: 'md' },
};

const inputSizes = {
  sm: {
    addon: { h: 8, px: 3, fontSize: 'sm' },
    field: { h: 8, px: 3, fontSize: 'sm' },
  },
  md: {
    addon: { h: 9, px: 3.5, fontSize: 'sm' },
    field: { h: 9, px: 3.5, fontSize: 'sm' },
  },
  lg: {
    addon: { h: 10, px: 4, fontSize: 'md' },
    field: { h: 10, px: 4, fontSize: 'md' },
  },
};

const textareaSizes = {
  sm: { minH: 20, px: 3, py: 2, fontSize: 'sm' },
  md: { minH: 24, px: 3.5, py: 2.5, fontSize: 'sm' },
  lg: { minH: 28, px: 4, py: 3, fontSize: 'md' },
};

const glassBaseLayerStyle = {
  position: 'relative',
  overflow: 'hidden',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'glassBorder',
  borderRadius: '2xl',
};

const glassSoftLayerStyle = {
  ...glassBaseLayerStyle,
  bg: 'glassSoftBg',
  boxShadow: 'glass',
  backdropFilter: glassBlur,
  WebkitBackdropFilter: glassBlur,
};

const glassSolidLayerStyle = {
  ...glassBaseLayerStyle,
  bg: 'glassSolidBg',
  boxShadow: 'card',
  backdropFilter: glassBlur,
  WebkitBackdropFilter: glassBlur,
};

const glassFloatingLayerStyle = {
  ...glassBaseLayerStyle,
  bg: 'glassFloatingBg',
  boxShadow: 'floating',
  backdropFilter: floatingGlassBlur,
  WebkitBackdropFilter: floatingGlassBlur,
};

const navigationGlassLayerStyle = {
  ...glassBaseLayerStyle,
  bg: 'rgba(255, 255, 255, 0.46)',
  borderColor: 'rgba(255, 255, 255, 0.72)',
  boxShadow:
    '0 16px 42px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(28px) saturate(180%)',
  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
};

const iconLayerStyleBase = {
  alignItems: 'center',
  display: 'inline-flex',
  flexShrink: 0,
  h: 10,
  justifyContent: 'center',
  borderRadius: 'xl',
  borderWidth: '1px',
  w: 10,
};

const dialogTheme = {
  baseStyle: {
    overlay: {
      bg: 'overlayBg',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
    },
    dialog: {
      bg: 'dialogBg',
      borderColor: 'borderDefault',
      borderRadius: 'dialog',
      borderWidth: '1px',
      boxShadow: 'dialog',
      color: 'ink.800',
      overflow: 'hidden',
    },
    header: {
      borderBottomColor: 'borderSubtle',
      borderBottomWidth: '1px',
      color: 'ink.900',
      fontSize: 'lg',
      fontWeight: 700,
      lineHeight: '1.4',
      px: 5,
      py: 4,
    },
    body: {
      color: 'ink.600',
      lineHeight: '1.7',
      px: 5,
      py: 5,
    },
    footer: {
      borderTopColor: 'borderSubtle',
      borderTopWidth: '1px',
      gap: 3,
      px: 5,
      py: 4,
    },
    closeButton: {
      color: 'ink.500',
      top: 3.5,
      insetEnd: 4,
    },
  },
};

const toastMotionVariants = {
  initial: { opacity: 0, scale: 0.98, y: -8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -6,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  },
};

export const theme = extendTheme({
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
  semanticTokens: {
    colors: {
      canvasBg: '#f8fbff',
      controlBg: 'rgba(255, 255, 255, 0.92)',
      controlDisabledBg: '#f1f5f9',
      controlReadOnlyBg: '#f8fafc',
      dialogBg: '#ffffff',
      glassFloatingBg: 'rgba(255, 255, 255, 0.76)',
      glassSoftBg: 'rgba(255, 255, 255, 0.68)',
      glassSolidBg: 'rgba(255, 255, 255, 0.86)',
      overlayBg: 'rgba(248, 251, 255, 0.66)',
      surfaceSolidBg: 'rgba(255, 255, 255, 0.96)',
      surfaceSubtleBg: 'rgba(248, 250, 252, 0.78)',
      toolbarBg: 'rgba(255, 255, 255, 0.8)',
      borderDefault: 'ink.200',
      borderInteractive: 'brand.300',
      borderSubtle: 'ink.100',
      glassBorder: 'rgba(255, 255, 255, 0.76)',
      glassBorderStrong: 'rgba(255, 255, 255, 0.92)',
      statusDanger: '#b91c1c',
      statusDangerActive: '#7f1d1d',
      statusDangerBg: '#fef2f2',
      statusDangerBorder: '#fecaca',
      statusDangerHover: '#991b1b',
      statusInfo: '#0369a1',
      statusInfoBg: '#f0f9ff',
      statusInfoBorder: '#bae6fd',
      statusSuccess: '#15803d',
      statusSuccessActive: '#14532d',
      statusSuccessBg: '#ecfdf5',
      statusSuccessBorder: '#bbf7d0',
      statusSuccessHover: '#166534',
      statusWarning: '#b45309',
      statusWarningActive: '#78350f',
      statusWarningBg: '#fffbeb',
      statusWarningBorder: '#fde68a',
      statusWarningHover: '#92400e',
      tableHoverBg: 'rgba(22, 119, 255, 0.04)',
      tableSelectedBg: 'brand.50',
      tooltipBg: 'rgba(15, 23, 42, 0.88)',
    },
  },
  fonts: {
    heading:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  radii: {
    control: '8px',
    dialog: '12px',
    md: '8px',
    lg: '10px',
    xl: '12px',
    '2xl': '16px',
  },
  shadows: {
    avatar: '0 0 0 1px rgba(255, 255, 255, 0.9)',
    button: '0 12px 26px rgba(22, 119, 255, 0.2)',
    buttonDanger: '0 12px 26px rgba(239, 68, 68, 0.16)',
    buttonDangerHover: '0 16px 34px rgba(239, 68, 68, 0.2)',
    buttonHover: '0 16px 36px rgba(22, 119, 255, 0.25)',
    buttonSuccess: '0 12px 26px rgba(22, 163, 74, 0.14)',
    buttonSuccessHover: '0 16px 34px rgba(22, 163, 74, 0.18)',
    buttonWarning: '0 12px 26px rgba(245, 158, 11, 0.14)',
    buttonWarningHover: '0 16px 34px rgba(245, 158, 11, 0.18)',
    card: '0 18px 44px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
    dialog: '0 24px 80px rgba(15, 23, 42, 0.14)',
    floating:
      '0 20px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.74)',
    focusRing: '0 0 0 3px rgba(22, 119, 255, 0.16)',
    focusRingDanger: '0 0 0 3px rgba(239, 68, 68, 0.16)',
    glass:
      '0 18px 44px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.72)',
    insetHairline: 'inset 0 1px 0 rgba(255, 255, 255, 0.72)',
    outline: '0 0 0 3px rgba(22, 119, 255, 0.16)',
    soft: '0 18px 50px rgba(15, 23, 42, 0.08)',
    toolbar:
      '0 10px 28px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.72)',
  },
  transition: {
    property: {
      common:
        'background-color, border-color, color, opacity, box-shadow, transform',
      liquid:
        'transform, opacity, background, border-color, box-shadow, filter',
    },
  },
  layerStyles: {
    appCanvas: {
      bg: 'canvasBg',
      backgroundImage: canvasBackground,
      backgroundAttachment: 'fixed',
      color: 'ink.800',
      minH: '100vh',
      position: 'relative',
    },
    glassSoft: glassSoftLayerStyle,
    glassSolid: glassSolidLayerStyle,
    glassFloating: glassFloatingLayerStyle,
    navigationGlass: navigationGlassLayerStyle,
    toolbarSurface: {
      bg: 'toolbarBg',
      borderColor: 'glassBorder',
      borderRadius: 'xl',
      borderWidth: '1px',
      boxShadow: 'toolbar',
      backdropFilter: glassBlur,
      WebkitBackdropFilter: glassBlur,
    },
    subtleSurface: {
      bg: 'surfaceSubtleBg',
      borderColor: 'borderSubtle',
      borderRadius: 'lg',
      borderWidth: '1px',
    },
    iconBrand: {
      ...iconLayerStyleBase,
      bg: 'brand.50',
      borderColor: 'brand.100',
      color: 'brand.600',
    },
    iconCyan: {
      ...iconLayerStyleBase,
      bg: 'statusInfoBg',
      borderColor: 'statusInfoBorder',
      color: 'statusInfo',
    },
    iconGreen: {
      ...iconLayerStyleBase,
      bg: 'statusSuccessBg',
      borderColor: 'statusSuccessBorder',
      color: 'statusSuccess',
    },
    iconPurple: {
      ...iconLayerStyleBase,
      bg: 'purple.50',
      borderColor: 'purple.200',
      color: 'purple.600',
    },
  },
  styles: {
    global: {
      'html, body': {
        minHeight: '100%',
        bg: 'canvasBg',
        color: 'ink.800',
      },
      body: {
        backgroundImage: canvasBackground,
        backgroundAttachment: 'fixed',
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
        borderRadius: 'control',
        fontWeight: 600,
        letterSpacing: '0',
        lineHeight: '1.2',
        transitionDuration: '160ms',
        transitionProperty: 'common',
        _disabled: {
          boxShadow: 'none',
          cursor: 'not-allowed',
          opacity: 0.5,
          transform: 'none',
        },
        _focusVisible: {
          boxShadow: 'focusRing',
          outline: 'none',
        },
      },
      sizes: buttonSizes,
      defaultProps: {
        colorScheme: 'brand',
        size: 'md',
        variant: 'solid',
      },
      variants: {
        ghost: ghostButtonVariant,
        outline: outlineButtonVariant,
        solid: solidButtonVariant,
      },
    },
    CloseButton: {
      baseStyle: {
        borderRadius: 'control',
        color: 'ink.500',
        _hover: { bg: 'brand.50', color: 'ink.800' },
        _active: { bg: 'brand.100' },
        _focusVisible: { boxShadow: 'focusRing', outline: 'none' },
      },
      sizes: {
        sm: { h: 7, w: 7, fontSize: '8px' },
        md: { h: 8, w: 8, fontSize: '10px' },
        lg: { h: 9, w: 9, fontSize: '12px' },
      },
      defaultProps: { size: 'md' },
    },
    Badge: {
      baseStyle: {
        borderRadius: '6px',
        borderWidth: '1px',
        fontSize: 'xs',
        fontWeight: 600,
        letterSpacing: '0',
        lineHeight: '1.35',
        px: 2,
        py: 0.5,
        textTransform: 'none',
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
          bg: 'surfaceSolidBg',
          borderColor: 'borderSubtle',
          borderRadius: 'lg',
          borderWidth: '1px',
          boxShadow: 'none',
          color: 'ink.800',
          overflow: 'hidden',
        },
      },
    },
    Input: {
      sizes: inputSizes,
      variants: {
        outline: {
          field: inputFieldStyles,
        },
      },
      defaultProps: { size: 'md', variant: 'outline' },
    },
    Select: {
      baseStyle: {
        field: {
          lineHeight: '1.2',
          transitionDuration: '160ms',
          transitionProperty: 'common',
        },
        icon: {
          color: 'ink.500',
          insetEnd: 3,
          pointerEvents: 'none',
          transition: 'color 160ms ease, transform 160ms ease',
          w: 4,
        },
      },
      sizes: inputSizes,
      variants: {
        outline: {
          field: selectFieldStyles,
          icon: {
            color: 'brand.600',
            _disabled: { color: 'ink.400' },
          },
        },
      },
      defaultProps: { size: 'md', variant: 'outline' },
    },
    Textarea: {
      sizes: textareaSizes,
      variants: {
        outline: inputFieldStyles,
      },
      defaultProps: { size: 'md', variant: 'outline' },
    },
    NumberInput: {
      baseStyle: {
        field: { pe: 11 },
        stepperGroup: { w: 9 },
        stepper: {
          bg: 'surfaceSubtleBg',
          borderColor: 'borderDefault',
          color: 'ink.600',
          _hover: { bg: 'brand.50', color: 'brand.700' },
          _active: { bg: 'brand.100' },
          _focusVisible: { boxShadow: 'focusRing', outline: 'none' },
        },
      },
      variants: {
        outline: {
          field: inputFieldStyles,
        },
      },
      sizes: inputSizes,
      defaultProps: {
        size: 'md',
        variant: 'outline',
      },
    },
    FormLabel: {
      baseStyle: {
        color: 'ink.700',
        fontSize: 'sm',
        fontWeight: 600,
        lineHeight: '1.4',
        mb: 1.5,
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
          color: 'statusDangerHover',
          fontSize: 'sm',
          fontWeight: 600,
        },
      },
    },
    Progress: {
      baseStyle: {
        track: {
          bg: 'ink.100',
          borderRadius: 'full',
          overflow: 'hidden',
        },
        filledTrack: {
          bg: 'brand.500',
        },
      },
    },
    Skeleton: {
      baseStyle: {
        endColor: 'ink.100',
        startColor: 'brand.50',
      },
    },
    Spinner: {
      baseStyle: {
        borderWidth: '2px',
        color: 'brand.500',
      },
      defaultProps: {
        size: 'md',
      },
    },
    Tooltip: {
      baseStyle: {
        bg: 'tooltipBg',
        borderRadius: '6px',
        boxShadow: 'sm',
        color: 'white',
        fontSize: 'xs',
        fontWeight: 600,
        lineHeight: '1.5',
        px: 2.5,
        py: 1.5,
      },
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: 'control',
          borderWidth: '1px',
          fontSize: 'sm',
          lineHeight: '1.6',
          px: 3.5,
          py: 3,
        },
        title: { fontWeight: 600 },
      },
      defaultProps: {
        variant: 'subtle',
      },
      variants: {
        subtle: alertSubtleStyles,
      },
    },
    Modal: dialogTheme,
    // Chakra v2 的 AlertDialog 内部复用 Modal；保留同名配置供统一主题入口识别。
    AlertDialog: dialogTheme,
    Drawer: {
      baseStyle: {
        overlay: {
          bg: 'overlayBg',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        },
        dialog: {
          bg: 'dialogBg',
          borderColor: 'borderDefault',
          borderStartWidth: '1px',
          boxShadow: 'dialog',
          color: 'ink.800',
        },
        header: {
          borderBottomColor: 'borderSubtle',
          borderBottomWidth: '1px',
          color: 'ink.900',
          fontSize: 'lg',
          fontWeight: 700,
          lineHeight: '1.4',
          px: 5,
          py: 4,
        },
        body: {
          color: 'ink.700',
          px: 5,
          py: 5,
        },
        footer: {
          borderTopColor: 'borderSubtle',
          borderTopWidth: '1px',
          gap: 3,
          px: 5,
          py: 4,
        },
        closeButton: {
          color: 'ink.500',
          insetEnd: 4,
          top: 3.5,
        },
      },
    },
    Avatar: {
      baseStyle: {
        badge: {
          borderColor: 'surfaceSolidBg',
          borderWidth: '2px',
        },
        container: {
          bg: 'brand.50',
          borderColor: 'glassBorderStrong',
          borderWidth: '2px',
          boxShadow: 'avatar',
          color: 'brand.700',
          flexShrink: 0,
        },
        excessLabel: {
          bg: 'ink.100',
          borderColor: 'glassBorderStrong',
          borderWidth: '2px',
          color: 'ink.700',
        },
      },
    },
    Checkbox: {
      baseStyle: {
        control: {
          borderColor: 'borderDefault',
          borderRadius: '4px',
          _checked: {
            bg: 'brand.500',
            borderColor: 'brand.500',
          },
          _disabled: {
            bg: 'controlDisabledBg',
            borderColor: 'borderSubtle',
            opacity: 1,
          },
          _focusVisible: {
            boxShadow: 'focusRing',
          },
        },
        label: { color: 'ink.700', fontSize: 'sm' },
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Radio: {
      baseStyle: {
        control: {
          borderColor: 'borderDefault',
          color: 'white',
          _checked: {
            bg: 'brand.500',
            borderColor: 'brand.500',
            color: 'white',
            _before: {
              bg: 'currentColor',
              borderRadius: 'full',
              content: '""',
              display: 'inline-block',
              h: '50%',
              position: 'relative',
              w: '50%',
            },
          },
          _focusVisible: { boxShadow: 'focusRing' },
        },
        label: { color: 'ink.700' },
      },
      defaultProps: {
        colorScheme: 'brand',
        size: 'md',
      },
    },
    Switch: {
      baseStyle: {
        track: {
          _checked: { bg: 'brand.500' },
          _focusVisible: { boxShadow: 'focusRing' },
        },
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Tabs: {
      variants: {
        softRounded: {
          tab: {
            borderRadius: 'control',
            color: 'ink.500',
            fontWeight: 600,
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
          borderColor: 'borderSubtle',
          color: 'ink.500',
          fontSize: 'xs',
          fontWeight: 700,
          letterSpacing: '0',
          lineHeight: '1.35',
          py: 3,
          textTransform: 'none',
        },
        td: {
          borderColor: 'borderSubtle',
          color: 'ink.700',
          fontSize: 'sm',
          lineHeight: '1.55',
          py: 3.5,
        },
      },
      sizes: {
        sm: {
          th: { px: 3, py: 2.5 },
          td: { px: 3, py: 3 },
        },
        md: {
          th: { px: 4, py: 3 },
          td: { px: 4, py: 3.5 },
        },
      },
      defaultProps: { size: 'sm' },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'glassFloatingBg',
          borderColor: 'glassBorderStrong',
          borderRadius: 'xl',
          boxShadow: 'floating',
          p: 1.5,
          backdropFilter: floatingGlassBlur,
          WebkitBackdropFilter: floatingGlassBlur,
        },
        item: {
          borderRadius: 'control',
          color: 'ink.700',
          fontSize: 'sm',
          fontWeight: 500,
          lineHeight: '1.35',
          minH: 10,
          px: 3,
          py: 2,
          transition: 'background 160ms ease, color 160ms ease',
          _active: { bg: 'brand.100', color: 'ink.900' },
          _focus: { bg: 'brand.50', color: 'ink.900' },
          _hover: { bg: 'brand.50', color: 'ink.900' },
          _disabled: {
            color: 'ink.400',
            cursor: 'not-allowed',
            opacity: 1,
          },
        },
        command: {
          color: 'ink.400',
          fontSize: 'xs',
          fontWeight: 600,
        },
        divider: { borderColor: 'borderSubtle', my: 1 },
      },
    },
    Popover: {
      baseStyle: {
        content: {
          bg: 'glassFloatingBg',
          borderColor: 'glassBorderStrong',
          borderRadius: 'xl',
          boxShadow: 'floating',
          color: 'ink.700',
          backdropFilter: floatingGlassBlur,
          WebkitBackdropFilter: floatingGlassBlur,
          _focusVisible: { boxShadow: 'focusRing', outline: 'none' },
        },
        header: {
          borderColor: 'borderSubtle',
          color: 'ink.900',
          fontWeight: 700,
          px: 4,
          py: 3,
        },
        body: { px: 4, py: 3 },
        footer: {
          borderColor: 'borderSubtle',
          px: 4,
          py: 3,
        },
        closeButton: {
          borderRadius: 'control',
          insetEnd: 2,
          top: 2,
        },
      },
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider
      theme={theme}
      toastOptions={{
        defaultOptions: {
          duration: 4200,
          isClosable: true,
          position: 'top-right',
          variant: 'subtle',
          containerStyle: { maxWidth: '420px' },
        },
        motionVariants: toastMotionVariants,
        toastSpacing: '12px',
      }}
    >
      <OverlayStackProvider>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
      </OverlayStackProvider>
    </ChakraProvider>
  );
}
