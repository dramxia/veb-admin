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
    <Box
      layerStyle="toolbarSurface"
      role="group"
      aria-label="页面操作"
      maxW="full"
      px={2}
      py={1.5}
      w="fit-content"
      {...props}
    >
      <HStack spacing={2} align="center" justify="flex-end" wrap="wrap">
        {children}
      </HStack>
    </Box>
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
  className,
  ...props
}: WorkspaceCanvasProps) {
  return (
    <Box
      position="relative"
      className={['liquid-rise', className].filter(Boolean).join(' ')}
      {...props}
    >
      <Grid
        templateColumns={{
          base: 'minmax(0, 1fr)',
          lg: sideSlot ? 'minmax(0, 1fr) minmax(280px, 340px)' : '1fr',
        }}
        gap={{ base: 4, lg: 5 }}
        alignItems="start"
      >
        <GridItem minW={0}>
          <Flex
            as="header"
            align={{ base: 'stretch', sm: 'flex-start' }}
            direction={{ base: 'column', sm: 'row' }}
            gap={4}
            justify="space-between"
          >
            <VStack align="stretch" spacing={1.5} minW={0} maxW="760px">
              {eyebrow ? (
                <Text
                  color="brand.700"
                  fontSize="xs"
                  fontWeight="800"
                  textTransform="uppercase"
                >
                  {eyebrow}
                </Text>
              ) : null}
              <Heading
                as="h1"
                color="ink.900"
                fontSize={{ base: '2xl', md: '28px' }}
                lineHeight="1.25"
              >
                {title}
              </Heading>
              {description ? (
                <Text color="ink.600" fontSize="sm" lineHeight="1.7">
                  {description}
                </Text>
              ) : null}
            </VStack>

            {actionsSlot ? (
              <Flex
                flexShrink={0}
                justify={{ base: 'flex-start', sm: 'flex-end' }}
                maxW="full"
              >
                <FloatingActionIsland>{actionsSlot}</FloatingActionIsland>
              </Flex>
            ) : null}
          </Flex>

          {heroSlot ? <Box mt={3}>{heroSlot}</Box> : null}
        </GridItem>

        {sideSlot ? <GridItem minW={0}>{sideSlot}</GridItem> : null}
      </Grid>

      <Box mt={{ base: 4, md: 5 }} position="relative">
        {children}
      </Box>
    </Box>
  );
}
