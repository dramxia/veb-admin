export const dynamic = 'force-dynamic';

import {
  Badge,
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  Compass,
  KeyRound,
  ListTree,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
import { MetricIsland } from '@/components/common/metric-island';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { prisma } from '@/lib/prisma';

const statMeta = [
  { label: '用户数', icon: Users, accent: '#21a66c', help: '系统账号总量' },
  { label: '角色数', icon: Shield, accent: '#7e966d', help: '权限分组规模' },
  { label: '权限数', icon: KeyRound, accent: '#35a7a0', help: '可控操作节点' },
  { label: '菜单数', icon: ListTree, accent: '#7c8fe8', help: '已配置导航项' },
];

export default async function DashboardPage() {
  const [userCount, roleCount, permissionCount, menuCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.menu.count(),
  ]);
  const values = [userCount, roleCount, permissionCount, menuCount];
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <WorkspaceCanvas
      eyebrow="Overview"
      title="清爽、聚焦、可配置的管理工作台"
      description="VEB 汇总账号、角色、权限和菜单的核心配置状态，让管理员从一个轻量工作空间进入日常维护。"
      heroSlot={
        <HStack spacing={3} wrap="wrap">
          <Badge colorScheme="green">RBAC</Badge>
          <Badge colorScheme="cyan">动态菜单</Badge>
          <Badge colorScheme="purple">操作审计</Badge>
        </HStack>
      }
      sideSlot={
        <GlassPanel variant="soft" p={6} minH="220px">
          <VStack align="stretch" spacing={5}>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="surface.500" fontWeight="800" fontSize="sm">
                  系统配置密度
                </Text>
                <Text color="surface.900" fontSize="5xl" fontWeight="900" lineHeight="1">
                  {total}
                </Text>
              </Box>
              <Flex
                w="58px"
                h="58px"
                rounded="3xl"
                align="center"
                justify="center"
                bg="rgba(232, 246, 236, 0.84)"
                color="brand.700"
              >
                <Sparkles size={28} />
              </Flex>
            </Flex>
            <Text color="surface.600" lineHeight="1.8">
              当前工作台保持轻量信息架构，导航、权限与数据管理仍完全由数据库配置驱动。
            </Text>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme="green">健康</Badge>
              <Badge colorScheme="gray">M4 UI</Badge>
            </HStack>
          </VStack>
        </GlassPanel>
      }
    >
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={5}>
        {statMeta.map((item, index) => {
          const StatIcon = item.icon;
          return (
            <MetricIsland
              key={item.label}
              icon={<StatIcon size={20} />}
              label={item.label}
              value={values[index]}
              help={item.help}
              accent={item.accent}
              transform={{ xl: index % 2 === 0 ? 'translateY(18px)' : 'translateY(-6px)' }}
            />
          );
        })}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mt={{ base: 5, xl: 9 }}>
        <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
          <HStack align="flex-start" spacing={4}>
            <Flex
              w="48px"
              h="48px"
              rounded="2xl"
              align="center"
              justify="center"
              bg="rgba(232, 246, 236, 0.84)"
              color="brand.700"
              flexShrink={0}
            >
              <Compass size={20} />
            </Flex>
            <Box>
              <Text color="surface.900" fontSize="lg" fontWeight="900">
                导航由菜单树驱动
              </Text>
              <Text mt={2} color="surface.600" lineHeight="1.8">
                底部 Liquid Dock 继续复用服务端下发的菜单树，权限变化后仍按当前用户可见范围渲染。
              </Text>
            </Box>
          </HStack>
        </GlassPanel>

        <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
          <HStack align="flex-start" spacing={4}>
            <Flex
              w="48px"
              h="48px"
              rounded="2xl"
              align="center"
              justify="center"
              bg="rgba(237, 247, 248, 0.84)"
              color="#247a78"
              flexShrink={0}
            >
              <Shield size={20} />
            </Flex>
            <Box>
              <Text color="surface.900" fontSize="lg" fontWeight="900">
                权限边界保持不变
              </Text>
              <Text mt={2} color="surface.600" lineHeight="1.8">
                UI 改造只影响交互层和展示层，按钮权限、页面守卫和 API 守卫仍沿用原有链路。
              </Text>
            </Box>
          </HStack>
        </GlassPanel>
      </SimpleGrid>
    </WorkspaceCanvas>
  );
}
