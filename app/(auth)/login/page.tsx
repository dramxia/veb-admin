import { Suspense } from 'react';
import { Badge, Box, Card, CardBody, Flex, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      px={4}
      py={10}
      bg="linear-gradient(135deg, #edf6ff 0%, #f8fbff 45%, #eef2ff 100%)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        inset: '-160px auto auto -120px',
        w: '420px',
        h: '420px',
        rounded: 'full',
        bg: 'rgba(22, 119, 255, 0.16)',
        filter: 'blur(4px)',
      }}
      _after={{
        content: '""',
        position: 'absolute',
        right: '-140px',
        bottom: '-160px',
        w: '460px',
        h: '460px',
        rounded: 'full',
        bg: 'rgba(109, 93, 252, 0.14)',
        filter: 'blur(4px)',
      }}
    >
      <Flex
        position="relative"
        w="full"
        maxW="980px"
        gap={8}
        align="stretch"
        direction={{ base: 'column', lg: 'row' }}
      >
        <VStack
          flex="1"
          align="stretch"
          justify="space-between"
          p={{ base: 7, md: 10 }}
          rounded="3xl"
          bg="linear-gradient(135deg, #1677ff 0%, #6d5dfc 100%)"
          color="white"
          minH={{ base: 'auto', lg: '560px' }}
          boxShadow="glow"
          overflow="hidden"
          position="relative"
        >
          <Box position="absolute" inset="auto -90px -100px auto" w="280px" h="280px" rounded="full" bg="whiteAlpha.200" />
          <Box position="relative">
            <HStack spacing={3} mb={10}>
              <Flex w="46px" h="46px" rounded="18px" align="center" justify="center" bg="whiteAlpha.250" fontWeight="900">
                V
              </Flex>
              <Text fontSize="xl" fontWeight="900">
                VEB Admin
              </Text>
            </HStack>
            <Badge bg="whiteAlpha.300" color="white" rounded="full" px={3} py={1} mb={5}>
              Enterprise Console
            </Badge>
            <Heading size="2xl" letterSpacing="-0.05em" lineHeight="1.1" mb={5}>
              更清爽的管理后台体验
            </Heading>
            <Text color="whiteAlpha.850" fontSize="lg" lineHeight="1.8" maxW="420px">
              集中管理用户、角色、权限和菜单配置，让日常运维操作更高效、更直观。
            </Text>
          </Box>
          <HStack position="relative" spacing={4} color="whiteAlpha.850" fontSize="sm" fontWeight="700" wrap="wrap">
            <Text>● 权限控制</Text>
            <Text>● 菜单编排</Text>
            <Text>● 文件管理</Text>
          </HStack>
        </VStack>

        <Card flex="0 0 420px" maxW={{ base: 'full', lg: '420px' }} alignSelf="center" w="full">
          <CardBody p={{ base: 7, md: 8 }}>
            <Box mb={8}>
              <Heading size="lg" color="ink.900" letterSpacing="-0.03em">
                欢迎回来
              </Heading>
              <Text mt={2} color="ink.500">
                请输入账号密码登录管理后台
              </Text>
            </Box>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </CardBody>
        </Card>
      </Flex>
    </Flex>
  );
}
