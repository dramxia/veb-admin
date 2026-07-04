import { Box, Flex, HStack, Text, VStack, type BoxProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { GlassPanel } from './glass-panel';

type MetricIslandProps = BoxProps & {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  help?: ReactNode;
  accent?: string;
};

export function MetricIsland({
  icon,
  label,
  value,
  help,
  accent = '#21a66c',
  ...props
}: MetricIslandProps) {
  return (
    <GlassPanel
      role="group"
      variant="soft"
      p={5}
      transition="transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: '0 24px 70px rgba(23, 33, 29, 0.14)',
        borderColor: 'rgba(255,255,255,0.9)',
      }}
      {...props}
    >
      <HStack align="flex-start" justify="space-between" spacing={4}>
        <Flex
          w="46px"
          h="46px"
          rounded="2xl"
          align="center"
          justify="center"
          color={accent}
          bg={`${accent}18`}
          boxShadow={`inset 0 0 0 1px ${accent}22`}
        >
          {icon}
        </Flex>
        <Box w="8px" h="8px" rounded="full" bg={accent} opacity={0.7} />
      </HStack>

      <VStack align="stretch" spacing={1} mt={5}>
        <Text color="surface.500" fontSize="sm" fontWeight="800">
          {label}
        </Text>
        <Text color="surface.900" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="900" lineHeight="1">
          {value}
        </Text>
        {help ? (
          <Text color="surface.500" fontSize="sm">
            {help}
          </Text>
        ) : null}
      </VStack>
    </GlassPanel>
  );
}

