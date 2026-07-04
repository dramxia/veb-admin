import { Suspense } from 'react';
import { Badge, Box, Flex, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      px={{ base: 4, md: 8 }}
      py={10}
      bg="linear-gradient(135deg, #fbfdfb 0%, #edf7f1 42%, #f7f8fb 72%, #edf7f8 100%)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        inset: 0,
        bg: 'repeating-linear-gradient(90deg, rgba(23,33,29,0.028) 0, rgba(23,33,29,0.028) 1px, transparent 1px, transparent 118px)',
        pointerEvents: 'none',
      }}
    >
      <Flex
        position="relative"
        w="full"
        maxW="1060px"
        gap={{ base: 5, lg: 7 }}
        align="center"
        direction={{ base: 'column', lg: 'row' }}
      >
        <GlassPanel
          variant="floating"
          flex="1"
          alignSelf="stretch"
          p={{ base: 7, md: 10 }}
          minH={{ base: 'auto', lg: '520px' }}
        >
          <VStack align="stretch" justify="space-between" minH="full" spacing={10}>
            <Box>
              <HStack spacing={3} mb={10}>
                <Flex
                  w="48px"
                  h="48px"
                  rounded="2xl"
                  align="center"
                  justify="center"
                  bg="rgba(232, 246, 236, 0.88)"
                  color="brand.700"
                >
                  <Leaf size={24} />
                </Flex>
                <Box>
                  <Text color="surface.900" fontSize="xl" fontWeight="900">
                    VEB Admin
                  </Text>
                  <Text color="surface.500" fontSize="sm" fontWeight="700">
                    Liquid Workspace
                  </Text>
                </Box>
              </HStack>
              <Badge colorScheme="green" rounded="full" px={3} py={1} mb={5}>
                Enterprise Console
              </Badge>
              <Heading size="2xl" letterSpacing="0" lineHeight="1.08" color="surface.900" mb={5}>
                回到你的管理工作台
              </Heading>
              <Text color="surface.600" fontSize="lg" lineHeight="1.8" maxW="460px">
                登录后进入权限、菜单和业务模块的统一操作空间。
              </Text>
            </Box>
            <HStack spacing={3} wrap="wrap">
              <Badge colorScheme="green">权限控制</Badge>
              <Badge colorScheme="cyan">菜单编排</Badge>
              <Badge colorScheme="purple">审计追踪</Badge>
            </HStack>
          </VStack>
        </GlassPanel>

        <GlassPanel
          variant="solid"
          flex="0 0 420px"
          maxW={{ base: 'full', lg: '420px' }}
          w="full"
          p={{ base: 7, md: 8 }}
          transform={{ lg: 'translateY(34px)' }}
        >
          <Box mb={8}>
            <HStack spacing={3} mb={4}>
              <ShieldCheck size={20} color="#168654" />
              <Text color="surface.500" fontWeight="900" fontSize="sm">
                Secure Sign In
              </Text>
            </HStack>
            <Heading size="lg" color="surface.900" letterSpacing="0">
              欢迎回来
            </Heading>
            <Text mt={2} color="surface.500">
              请输入账号密码登录管理后台
            </Text>
          </Box>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </GlassPanel>

        <Flex
          display={{ base: 'none', lg: 'flex' }}
          position="absolute"
          right="380px"
          bottom="34px"
          w="68px"
          h="68px"
          rounded="3xl"
          align="center"
          justify="center"
          bg="rgba(255,255,255,0.58)"
          border="1px solid rgba(255,255,255,0.78)"
          color="brand.700"
          boxShadow="glass"
          sx={{
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          <Sparkles size={28} />
        </Flex>
      </Flex>
    </Flex>
  );
}
