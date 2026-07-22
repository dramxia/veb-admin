import { Box, type BoxProps } from '@chakra-ui/react';

type GlassPanelProps = BoxProps & {
  variant?: 'soft' | 'solid' | 'floating' | 'navigation';
};

const variantLayerStyles: Record<
  NonNullable<GlassPanelProps['variant']>,
  string
> = {
  soft: 'glassSoft',
  solid: 'glassSolid',
  floating: 'glassFloating',
  navigation: 'navigationGlass',
};

export function GlassPanel({ variant = 'soft', ...props }: GlassPanelProps) {
  return <Box layerStyle={variantLayerStyles[variant]} {...props} />;
}
