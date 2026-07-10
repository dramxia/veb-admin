import {
  Box,
  Flex,
  HStack,
  Text,
  VStack,
  type BoxProps,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { GlassPanel } from './glass-panel';

export type MetricIslandTone = 'brand' | 'cyan' | 'purple' | 'green';

type MetricIslandProps = BoxProps & {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  help?: ReactNode;
  tone?: MetricIslandTone;
};

const toneStyles: Record<
  MetricIslandTone,
  { dot: string; iconLayerStyle: string }
> = {
  brand: { dot: 'brand.500', iconLayerStyle: 'iconBrand' },
  cyan: { dot: 'statusInfo', iconLayerStyle: 'iconCyan' },
  purple: { dot: 'purple.500', iconLayerStyle: 'iconPurple' },
  green: { dot: 'statusSuccess', iconLayerStyle: 'iconGreen' },
};

export function MetricIsland({
  icon,
  label,
  value,
  help,
  tone = 'brand',
  ...props
}: MetricIslandProps) {
  const styles = toneStyles[tone];

  return (
    <GlassPanel
      role="group"
      variant="soft"
      p={5}
      transition="transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease"
      _hover={{
        borderColor: 'glassBorderStrong',
        boxShadow: 'card',
        transform: 'translateY(-2px)',
      }}
      {...props}
    >
      <HStack align="flex-start" justify="space-between" spacing={4}>
        <Flex
          layerStyle={styles.iconLayerStyle}
          aria-hidden="true"
          w="44px"
          h="44px"
        >
          {icon}
        </Flex>
        <Box
          aria-hidden="true"
          w="8px"
          h="8px"
          rounded="full"
          bg={styles.dot}
          opacity={0.72}
        />
      </HStack>

      <VStack align="stretch" spacing={1} mt={4}>
        <Text color="ink.500" fontSize="sm" fontWeight="700">
          {label}
        </Text>
        <Text
          color="ink.900"
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="800"
          lineHeight="1.15"
        >
          {value}
        </Text>
        {help ? (
          <Text color="ink.500" fontSize="sm" lineHeight="1.6">
            {help}
          </Text>
        ) : null}
      </VStack>
    </GlassPanel>
  );
}
