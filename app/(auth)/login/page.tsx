import { Suspense } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ShieldCheck, Sparkles } from 'lucide-react';
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
      bg="radial-gradient(circle at 12% 10%, rgba(22, 119, 255, 0.14), transparent 28%), radial-gradient(circle at 88% 4%, rgba(99, 102, 241, 0.12), transparent 24%), radial-gradient(circle at 50% 100%, rgba(14, 165, 233, 0.10), transparent 32%), linear-gradient(135deg, #f8fbff 0%, #f3f7ff 46%, #eef4ff 100%)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        inset: 0,
        bg: 'repeating-linear-gradient(90deg, rgba(15,23,42,0.018) 0, rgba(15,23,42,0.018) 1px, transparent 1px, transparent 118px)',
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
          <VStack
            align="stretch"
            justify="space-between"
            minH="full"
            spacing={10}
          >
            <Box>
              <HStack spacing={3} mb={10}>
                <Flex
                  w="48px"
                  h="48px"
                  rounded="2xl"
                  align="center"
                  justify="center"
                  bg="linear-gradient(135deg, rgba(238,247,255,0.92), rgba(216,236,255,0.72))"
                  color="brand.700"
                >
                  <Sparkles size={24} />
                </Flex>
                <Box>
                  <Text color="ink.900" fontSize="xl" fontWeight="900">
                    VEB Admin
                  </Text>
                  <Text color="ink.500" fontSize="sm" fontWeight="700">
                    Liquid Workspace
                  </Text>
                </Box>
              </HStack>
              <Badge colorScheme="brand" rounded="full" px={3} py={1} mb={5}>
                Enterprise Console
              </Badge>
              <Heading
                size="2xl"
                letterSpacing="0"
                lineHeight="1.08"
                color="ink.900"
                mb={5}
              >
                回到你的管理工作台
              </Heading>
              <Text color="ink.600" fontSize="lg" lineHeight="1.8" maxW="460px">
                登录后进入权限、菜单和业务模块的统一操作空间。
              </Text>
            </Box>
            <HStack spacing={3} wrap="wrap">
              <Badge colorScheme="brand">权限控制</Badge>
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
              <ShieldCheck size={20} color="#0f5ed7" />
              <Text color="ink.500" fontWeight="900" fontSize="sm">
                Secure Sign In
              </Text>
            </HStack>
            <Heading size="lg" color="ink.900" letterSpacing="0">
              欢迎回来
            </Heading>
            <Text mt={2} color="ink.500">
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
