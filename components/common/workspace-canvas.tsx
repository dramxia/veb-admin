import {
  Box,
  type BoxProps,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { GlassPanel } from './glass-panel';

type WorkspaceCanvasProps = BoxProps & {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  heroSlot?: ReactNode;
  sideSlot?: ReactNode;
  actionsSlot?: ReactNode;
  children: ReactNode;
};

export function FloatingActionIsland({ children, ...props }: BoxProps) {
  if (!children) return null;

  return (
    <GlassPanel
      variant="floating"
      px={3}
      py={2}
      rounded="full"
      w="fit-content"
      maxW="full"
      {...props}
    >
      <HStack spacing={2} align="center" justify="flex-end">
        {children}
      </HStack>
    </GlassPanel>
  );
}

export function WorkspaceCanvas({
  eyebrow,
  title,
  description,
  heroSlot,
  sideSlot,
  actionsSlot,
  children,
  ...props
}: WorkspaceCanvasProps) {
  return (
    <Box position="relative" className="liquid-rise" {...props}>
      {actionsSlot ? (
        <Flex
          justify={{ base: 'flex-start', lg: 'flex-end' }}
          mb={{ base: 4, lg: -12 }}
          pr={{ base: 0, lg: 5 }}
          position="relative"
          zIndex={2}
        >
          <FloatingActionIsland>{actionsSlot}</FloatingActionIsland>
        </Flex>
      ) : null}

      <Grid
        templateColumns={{ base: '1fr', lg: sideSlot ? 'minmax(0, 1.36fr) minmax(280px, 0.64fr)' : '1fr' }}
        gap={{ base: 4, lg: 5 }}
        alignItems="stretch"
      >
        <GridItem>
          <GlassPanel
            variant="floating"
            minH={{ base: 'auto', lg: '238px' }}
            p={{ base: 6, md: 8 }}
          >
            <VStack align="stretch" spacing={5} maxW="780px">
              {eyebrow ? (
                <Text
                  color="mint.700"
                  fontSize="xs"
                  fontWeight="900"
                  letterSpacing="0"
                  textTransform="uppercase"
                >
                  {eyebrow}
                </Text>
              ) : null}
              <Box>
                <Heading
                  as="h1"
                  size={{ base: 'xl', md: '2xl' }}
                  color="surface.900"
                  letterSpacing="0"
                  lineHeight="1.08"
                >
                  {title}
                </Heading>
                {description ? (
                  <Text mt={3} color="surface.600" lineHeight="1.8" maxW="680px">
                    {description}
                  </Text>
                ) : null}
              </Box>
              {heroSlot ? <Box>{heroSlot}</Box> : null}
            </VStack>
          </GlassPanel>
        </GridItem>

        {sideSlot ? (
          <GridItem pt={{ base: 0, lg: 10 }}>
            {sideSlot}
          </GridItem>
        ) : null}
      </Grid>

      <Box
        mt={{ base: 4, lg: -6 }}
        ml={{ base: 0, lg: sideSlot ? 8 : 0 }}
        mr={{ base: 0, lg: sideSlot ? 4 : 0 }}
        position="relative"
        zIndex={1}
      >
        {children}
      </Box>
    </Box>
  );
}
