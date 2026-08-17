'use client';

import {
  Box,
  Flex,
  Grid,
  HStack,
  Skeleton,
  Stack,
  VisuallyHidden,
} from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ROUTE_LOADING_COMPLETE_EVENT } from './route-progress';
import { GlassPanel } from './glass-panel';

const TABLE_ROWS = Array.from({ length: 5 }, (_, index) => index);

function LoadingPanel() {
  return (
    <GlassPanel variant="soft" overflow="hidden">
      <Flex
        align={{ base: 'stretch', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={3}
        justify="space-between"
        px={{ base: 4, md: 5 }}
        py={4}
      >
        <Stack spacing={2}>
          <Skeleton h="12px" w="72px" rounded="full" />
          <Skeleton h="24px" w="150px" rounded="md" />
        </Stack>
        <Skeleton h="36px" w={{ base: '112px', sm: '96px' }} rounded="xl" />
      </Flex>

      <Grid
        borderTopWidth="1px"
        borderColor="borderSubtle"
        gap={3}
        p={{ base: 4, md: 5 }}
        templateColumns={{
          base: '1fr',
          md: 'minmax(220px, 1.6fr) repeat(2, minmax(150px, 1fr))',
        }}
      >
        <Skeleton h="40px" rounded="xl" />
        <Skeleton h="40px" rounded="xl" />
        <Skeleton h="40px" rounded="xl" />
      </Grid>

      <Box borderTopWidth="1px" borderColor="borderSubtle" overflow="hidden">
        <Grid
          bg="surfaceSubtleBg"
          gap={5}
          px={{ base: 4, md: 5 }}
          py={3.5}
          templateColumns={{
            base: 'minmax(0, 1fr) 72px',
            md: 'minmax(180px, 1.6fr) repeat(3, minmax(90px, 1fr)) 88px',
          }}
        >
          {[42, 54, 48, 58, 40].map((width, index) => (
            <Skeleton
              key={width}
              display={{
                base: index > 0 && index < 4 ? 'none' : 'block',
                md: 'block',
              }}
              h="12px"
              w={`${width}px`}
              rounded="full"
            />
          ))}
        </Grid>

        {TABLE_ROWS.map((row) => (
          <Grid
            key={row}
            alignItems="center"
            borderTopWidth="1px"
            borderColor="borderSubtle"
            gap={5}
            minH="64px"
            px={{ base: 4, md: 5 }}
            py={3}
            templateColumns={{
              base: 'minmax(0, 1fr) 72px',
              md: 'minmax(180px, 1.6fr) repeat(3, minmax(90px, 1fr)) 88px',
            }}
          >
            <HStack spacing={3} minW={0}>
              <Skeleton flexShrink={0} h="36px" w="36px" rounded="full" />
              <Stack flex={1} minW={0} spacing={2}>
                <Skeleton h="13px" maxW="180px" rounded="full" />
                <Skeleton h="10px" maxW="120px" rounded="full" />
              </Stack>
            </HStack>
            {[0, 1, 2].map((cell) => (
              <Skeleton
                key={cell}
                display={{ base: 'none', md: 'block' }}
                h="13px"
                maxW={cell === 1 ? '96px' : '72px'}
                rounded="full"
              />
            ))}
            <HStack justify="flex-end" spacing={2}>
              <Skeleton h="30px" w="30px" rounded="lg" />
              <Skeleton
                display={{ base: 'none', sm: 'block' }}
                h="30px"
                w="30px"
                rounded="lg"
              />
            </HStack>
          </Grid>
        ))}
      </Box>
    </GlassPanel>
  );
}

export function PageLoading() {
  const pathname = usePathname();
  const showMetrics =
    pathname === '/dashboard' ||
    pathname === '/admin/system' ||
    pathname === '/admin/content/like';

  useEffect(
    () => () => {
      window.dispatchEvent(new Event(ROUTE_LOADING_COMPLETE_EVENT));
    },
    [],
  );

  return (
    <Box
      className="liquid-rise"
      data-route-loading="true"
      aria-busy="true"
      position="relative"
      w="full"
    >
      <VisuallyHidden role="status">页面加载中</VisuallyHidden>

      <Flex
        as="header"
        align={{ base: 'stretch', sm: 'flex-start' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={4}
        justify="space-between"
      >
        <Stack spacing={2} maxW="760px" w="full">
          <Skeleton h="12px" w="76px" rounded="full" />
          <Skeleton
            h={{ base: '30px', md: '35px' }}
            maxW="240px"
            rounded="lg"
          />
          <Skeleton h="14px" maxW="520px" rounded="full" />
        </Stack>
        <Skeleton h="34px" w="112px" rounded="full" />
      </Flex>

      <HStack mt={3} spacing={2}>
        <Skeleton h="24px" w="92px" rounded="full" />
        <Skeleton h="24px" w="82px" rounded="full" />
      </HStack>

      {showMetrics ? (
        <Grid
          gap={{ base: 3, md: 4 }}
          mt={{ base: 4, md: 5 }}
          templateColumns={{ base: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }}
        >
          {[0, 1, 2].map((metric) => (
            <GlassPanel key={metric} variant="soft" p={5}>
              <Flex justify="space-between">
                <Skeleton h="42px" w="42px" rounded="xl" />
                <Skeleton h="8px" w="8px" rounded="full" />
              </Flex>
              <Stack mt={4} spacing={2}>
                <Skeleton h="13px" w="96px" rounded="full" />
                <Skeleton h="30px" w="64px" rounded="md" />
                <Skeleton h="12px" maxW="160px" rounded="full" />
              </Stack>
            </GlassPanel>
          ))}
        </Grid>
      ) : null}

      <Box mt={{ base: 4, md: 5 }}>
        <LoadingPanel />
      </Box>
    </Box>
  );
}
