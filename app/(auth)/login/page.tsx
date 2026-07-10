import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import { LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Suspense } from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      px={{ base: 4, md: 8 }}
      py={{ base: 6, md: 10 }}
      layerStyle="appCanvas"
    >
      <GlassPanel variant="floating" w="full" maxW="960px" overflow="hidden">
        <Grid
          templateColumns={{
            base: '1fr',
            lg: 'minmax(0, 0.9fr) minmax(380px, 1.1fr)',
          }}
        >
          <Stack
            display={{ base: 'none', lg: 'flex' }}
            p={{ lg: 10, xl: 12 }}
            spacing={8}
            justify="space-between"
            bg="brand.50"
            borderRightWidth="1px"
            borderColor="whiteAlpha.700"
          >
            <Stack spacing={6}>
              <Flex layerStyle="iconBrand" w="52px" h="52px">
                <LayoutDashboard size={24} aria-hidden />
              </Flex>
              <Box>
                <Badge colorScheme="brand" mb={4}>
                  VEB 管理后台
                </Badge>
                <Heading as="h2" size="xl" color="ink.900" lineHeight="1.25">
                  清晰、可靠的管理工作区
                </Heading>
                <Text mt={4} color="ink.600" lineHeight="1.75">
                  统一管理账号、角色、权限、菜单与审计信息，重要操作均受权限控制。
                </Text>
              </Box>
            </Stack>

            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme="brand">权限控制</Badge>
              <Badge colorScheme="cyan">菜单管理</Badge>
              <Badge colorScheme="purple">审计记录</Badge>
            </HStack>
          </Stack>

          <Box p={{ base: 6, sm: 8, lg: 10 }} bg="whiteAlpha.700">
            <Stack spacing={7}>
              <HStack spacing={3} align="flex-start">
                <Flex layerStyle="iconBrand" w="46px" h="46px" flexShrink={0}>
                  <ShieldCheck size={20} aria-hidden />
                </Flex>
                <Box>
                  <Heading as="h1" size="lg" color="ink.900">
                    登录 VEB
                  </Heading>
                  <Text mt={1.5} color="ink.500">
                    使用你的管理账号继续
                  </Text>
                </Box>
              </HStack>

              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </Stack>
          </Box>
        </Grid>
      </GlassPanel>
    </Flex>
  );
}
