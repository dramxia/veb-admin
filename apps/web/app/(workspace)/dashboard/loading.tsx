import {
  Box,
  Flex,
  Grid,
  HStack,
  SimpleGrid,
  Skeleton,
  Stack,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react';
import { GlassPanel } from '@/components/common/glass-panel';
import { AdminShell } from '@/components/layout/admin-shell';

const SUMMARY_ITEMS = Array.from({ length: 4 }, (_, index) => index);
const TREND_METRICS = Array.from({ length: 3 }, (_, index) => index);
const RECENT_ITEMS = Array.from({ length: 5 }, (_, index) => index);
const STATUS_ITEMS = Array.from({ length: 3 }, (_, index) => index);
const LINK_ITEMS = Array.from({ length: 4 }, (_, index) => index);

export default function DashboardLoading() {
  return (
    <AdminShell>
      <Box
        className="liquid-rise"
        data-route-loading="true"
        aria-busy="true"
        position="relative"
        w="full"
      >
        <VisuallyHidden role="status">仪表盘加载中</VisuallyHidden>

        <Flex
          align={{ base: 'stretch', sm: 'flex-start' }}
          justify="space-between"
          direction={{ base: 'column', sm: 'row' }}
          gap={4}
        >
          <Stack spacing={2} maxW="620px">
            <Skeleton h={{ base: '30px', md: '35px' }} w="132px" rounded="lg" />
            <Skeleton h="14px" maxW="480px" rounded="full" />
          </Stack>
          <Skeleton h="40px" w="118px" rounded="lg" />
        </Flex>

        <GlassPanel variant="solid" mt={{ base: 4, md: 5 }} overflow="hidden">
          <Flex
            align="center"
            justify="space-between"
            px={{ base: 5, md: 6 }}
            py={4}
            borderBottomWidth="1px"
            borderColor="borderSubtle"
          >
            <Stack spacing={2}>
              <Skeleton h="14px" w="72px" rounded="full" />
              <Skeleton h="11px" w="190px" rounded="full" />
            </Stack>
            <Skeleton h="11px" w="98px" rounded="full" />
          </Flex>

          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }}>
            {SUMMARY_ITEMS.map((item) => (
              <Box key={item} minH="174px" p={{ base: 5, md: 6 }}>
                <Flex justify="space-between">
                  <Skeleton h="13px" w="72px" rounded="full" />
                  <Skeleton boxSize="40px" rounded="lg" />
                </Flex>
                <Skeleton mt={4} h="38px" w="74px" rounded="md" />
                <HStack mt={3} spacing={2}>
                  <Skeleton h="20px" w="58px" rounded="full" />
                  <Skeleton h="11px" maxW="112px" flex="1" rounded="full" />
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        </GlassPanel>

        <Grid
          mt={5}
          gap={5}
          templateColumns={{
            base: 'minmax(0, 1fr)',
            xl: 'minmax(0, 1.55fr) minmax(300px, 0.65fr)',
          }}
        >
          <GlassPanel variant="solid" p={{ base: 5, md: 6 }} minW={0}>
            <Flex justify="space-between">
              <Stack spacing={2}>
                <Skeleton h="18px" w="88px" rounded="full" />
                <Skeleton h="12px" w="210px" rounded="full" />
              </Stack>
              <Skeleton h="22px" w="48px" rounded="full" />
            </Flex>
            <Skeleton mt={5} h={{ base: '240px', md: '292px' }} rounded="lg" />
            <SimpleGrid columns={3} spacing={4} mt={4} pt={4}>
              {TREND_METRICS.map((item) => (
                <Stack key={item} spacing={2}>
                  <Skeleton h="10px" w="52px" rounded="full" />
                  <Skeleton h="14px" w="34px" rounded="full" />
                </Stack>
              ))}
            </SimpleGrid>
          </GlassPanel>

          <GlassPanel variant="solid" p={{ base: 5, md: 6 }} minW={0}>
            <Flex justify="space-between">
              <Stack spacing={2}>
                <Skeleton h="18px" w="88px" rounded="full" />
                <Skeleton h="12px" w="176px" rounded="full" />
              </Stack>
              <Skeleton h="22px" w="66px" rounded="full" />
            </Flex>
            <Flex
              align="center"
              justify="center"
              minH={{ base: '270px', md: '290px' }}
            >
              <Skeleton boxSize="190px" rounded="full" />
            </Flex>
            <SimpleGrid columns={3} spacing={3} pt={4}>
              {TREND_METRICS.map((item) => (
                <Stack key={item} spacing={2}>
                  <Skeleton h="10px" w="42px" rounded="full" />
                  <Skeleton h="14px" w="30px" rounded="full" />
                </Stack>
              ))}
            </SimpleGrid>
          </GlassPanel>
        </Grid>

        <Grid
          mt={5}
          gap={5}
          templateColumns={{
            base: 'minmax(0, 1fr)',
            xl: 'minmax(0, 1.2fr) minmax(340px, 0.8fr)',
          }}
        >
          <GlassPanel variant="solid" p={{ base: 5, md: 6 }} minW={0}>
            <Flex justify="space-between">
              <Stack spacing={2}>
                <Skeleton h="18px" w="88px" rounded="full" />
                <Skeleton h="12px" w="176px" rounded="full" />
              </Stack>
              <Skeleton h="11px" w="58px" rounded="full" />
            </Flex>
            <VStack align="stretch" spacing={0} mt={5}>
              {RECENT_ITEMS.map((item) => (
                <HStack key={item} spacing={3} py={3.5}>
                  <Skeleton boxSize="36px" rounded="lg" />
                  <Stack flex="1" spacing={2}>
                    <Skeleton h="13px" w="110px" rounded="full" />
                    <Skeleton h="10px" maxW="240px" rounded="full" />
                  </Stack>
                  <Stack align="flex-end" spacing={2}>
                    <Skeleton h="20px" w="42px" rounded="full" />
                    <Skeleton h="10px" w="72px" rounded="full" />
                  </Stack>
                </HStack>
              ))}
            </VStack>
          </GlassPanel>

          <GlassPanel variant="solid" p={{ base: 5, md: 6 }} minW={0}>
            <Flex justify="space-between">
              <Stack spacing={2}>
                <Skeleton h="18px" w="88px" rounded="full" />
                <Skeleton h="12px" w="160px" rounded="full" />
              </Stack>
              <Skeleton h="30px" w="54px" rounded="md" />
            </Flex>
            <Stack mt={6} spacing={5}>
              {STATUS_ITEMS.map((item) => (
                <Box key={item}>
                  <Flex justify="space-between">
                    <Skeleton h="34px" w="88px" rounded="lg" />
                    <Skeleton h="12px" w="48px" rounded="full" />
                  </Flex>
                  <Skeleton mt={2.5} h="6px" rounded="full" />
                </Box>
              ))}
            </Stack>
            <Stack mt={8} spacing={2}>
              <Skeleton h="14px" w="72px" rounded="full" />
              <Skeleton h="11px" w="184px" rounded="full" />
            </Stack>
            <Stack mt={4} spacing={2}>
              {LINK_ITEMS.map((item) => (
                <Skeleton key={item} h="54px" rounded="lg" />
              ))}
            </Stack>
          </GlassPanel>
        </Grid>
      </Box>
    </AdminShell>
  );
}
