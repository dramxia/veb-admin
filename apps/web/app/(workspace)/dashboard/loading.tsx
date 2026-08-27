import {
  Box,
  Flex,
  Grid,
  SimpleGrid,
  Skeleton,
  Stack,
  VisuallyHidden,
} from '@chakra-ui/react';
import { GlassPanel } from '@/components/common/glass-panel';
import { AdminShell } from '@/components/layout/admin-shell';

const SUMMARY_ITEMS = Array.from({ length: 4 }, (_, index) => index);
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

        <Stack spacing={2} maxW="620px">
          <Skeleton h={{ base: '30px', md: '35px' }} w="132px" rounded="lg" />
          <Skeleton h="14px" maxW="480px" rounded="full" />
        </Stack>

        <GlassPanel variant="solid" mt={{ base: 4, md: 5 }}>
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
              <Skeleton h="11px" w="112px" rounded="full" />
            </Stack>
            <Skeleton h="22px" w="68px" rounded="md" />
          </Flex>

          <SimpleGrid columns={{ base: 2, xl: 4 }}>
            {SUMMARY_ITEMS.map((item) => (
              <Box key={item} p={{ base: 4, md: 6 }}>
                <Flex justify="space-between">
                  <Skeleton h="13px" w="72px" rounded="full" />
                  <Skeleton boxSize="34px" rounded="lg" />
                </Flex>
                <Skeleton mt={5} h="36px" w="72px" rounded="md" />
                <Skeleton mt={3} h="12px" maxW="140px" rounded="full" />
              </Box>
            ))}
          </SimpleGrid>
        </GlassPanel>

        <Grid
          mt={5}
          gap={5}
          templateColumns={{
            base: 'minmax(0, 1fr)',
            xl: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
          }}
        >
          <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
            <Stack spacing={2}>
              <Skeleton h="18px" w="88px" rounded="full" />
              <Skeleton h="12px" w="180px" rounded="full" />
            </Stack>
            <Stack mt={6} spacing={5}>
              {STATUS_ITEMS.map((item) => (
                <Grid
                  key={item}
                  templateColumns={{ base: '1fr', sm: '132px 1fr 88px' }}
                  gap={4}
                  alignItems="center"
                >
                  <Skeleton h="34px" w="88px" rounded="lg" />
                  <Skeleton h="6px" rounded="full" />
                  <Skeleton h="12px" w="72px" rounded="full" />
                </Grid>
              ))}
            </Stack>
            <Skeleton mt={8} h="54px" rounded="lg" />
          </GlassPanel>

          <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
            <Stack spacing={2}>
              <Skeleton h="18px" w="88px" rounded="full" />
              <Skeleton h="12px" w="176px" rounded="full" />
            </Stack>
            <Stack mt={5} spacing={3}>
              {LINK_ITEMS.map((item) => (
                <Skeleton key={item} h="58px" rounded="lg" />
              ))}
            </Stack>
          </GlassPanel>
        </Grid>
      </Box>
    </AdminShell>
  );
}
