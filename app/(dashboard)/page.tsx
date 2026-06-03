export const dynamic = 'force-dynamic';

import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from '@chakra-ui/react';
import { prisma } from '@/lib/prisma';

const statMeta = [
  { label: '用户数', icon: '👥', accent: '#1677ff', help: '系统账号总量' },
  { label: '角色数', icon: '🛡️', accent: '#7c3aed', help: '权限分组规模' },
  { label: '权限数', icon: '🔐', accent: '#059669', help: '可控操作节点' },
  { label: '菜单数', icon: '🧭', accent: '#ea580c', help: '已配置导航项' },
];

export default async function DashboardPage() {
  const [userCount, roleCount, permissionCount, menuCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.menu.count(),
  ]);
  const values = [userCount, roleCount, permissionCount, menuCount];

  return (
    <VStack align="stretch" spacing={6}>
      <Card
        bg="linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(238,247,255,0.92) 100%)"
        borderColor="whiteAlpha.900"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          inset: '-35% auto auto 55%',
          w: '420px',
          h: '420px',
          rounded: 'full',
          bg: 'radial-gradient(circle, rgba(22, 119, 255, 0.18), transparent 68%)',
        }}
      >
        <CardBody position="relative" p={{ base: 6, md: 8 }}>
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={6}>
            <Box maxW="680px">
              <Badge colorScheme="blue" rounded="full" px={3} py={1} mb={4}>
                Overview
              </Badge>
              <Heading size="xl" color="ink.900" letterSpacing="-0.04em" mb={3}>
                仪表盘
              </Heading>
              <Text color="ink.600" fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.8">
                欢迎使用 VEB 管理后台。这里汇总了用户、角色、权限和菜单的核心数据，
                帮你快速了解当前系统配置状态。
              </Text>
            </Box>
            <Flex
              align="center"
              justify="center"
              w={{ base: 'full', md: '180px' }}
              minH="132px"
              rounded="3xl"
              bg="linear-gradient(135deg, #1677ff 0%, #6d5dfc 100%)"
              color="white"
              boxShadow="glow"
            >
              <VStack spacing={0}>
                <Text fontSize="4xl" fontWeight="900" lineHeight="1">
                  {values.reduce((sum, value) => sum + value, 0)}
                </Text>
                <Text fontSize="sm" opacity={0.86} fontWeight="700">
                  总配置项
                </Text>
              </VStack>
            </Flex>
          </Flex>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5}>
        {statMeta.map((item, index) => (
          <Card key={item.label} role="group" transition="all 0.2s ease" _hover={{ transform: 'translateY(-4px)', boxShadow: 'soft' }}>
            <CardBody p={6}>
              <HStack justify="space-between" align="flex-start" mb={5}>
                <Flex
                  w="46px"
                  h="46px"
                  rounded="2xl"
                  align="center"
                  justify="center"
                  fontSize="xl"
                  bg={`${item.accent}16`}
                  boxShadow={`inset 0 0 0 1px ${item.accent}22`}
                >
                  {item.icon}
                </Flex>
                <Box w="8px" h="8px" rounded="full" bg={item.accent} opacity={0.72} />
              </HStack>
              <Stat>
                <StatLabel color="ink.500" fontWeight="800">
                  {item.label}
                </StatLabel>
                <StatNumber color="ink.900" fontSize="4xl" letterSpacing="-0.04em">
                  {values[index]}
                </StatNumber>
                <StatHelpText mb={0} color="ink.500">
                  {item.help}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
