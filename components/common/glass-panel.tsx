import { Box, type BoxProps } from '@chakra-ui/react';

type GlassPanelProps = BoxProps & {
  variant?: 'soft' | 'solid' | 'floating';
};

const variantStyles: Record<
  NonNullable<GlassPanelProps['variant']>,
  BoxProps
> = {
  soft: {
    bg: 'rgba(255, 255, 255, 0.62)',
    borderColor: 'rgba(255, 255, 255, 0.68)',
    boxShadow: 'glass',
  },
  solid: {
    bg: 'rgba(255, 255, 255, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.78)',
    boxShadow: 'card',
  },
  floating: {
    bg: 'rgba(255, 255, 255, 0.56)',
    borderColor: 'rgba(255, 255, 255, 0.74)',
    boxShadow:
      '0 20px 44px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.72)',
  },
};

export function GlassPanel({
  variant = 'soft',
  sx,
  ...props
}: GlassPanelProps) {
  return (
    <Box
      position="relative"
      borderWidth="1px"
      rounded="3xl"
      overflow="hidden"
      sx={{
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        ...sx,
      }}
      {...variantStyles[variant]}
      {...props}
    />
  );
}
