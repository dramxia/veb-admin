export const dynamic = 'force-dynamic';

import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Boxes, KeyRound, ListTree, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import type { DashboardStats, MenuNode } from '@veb/api-contracts';
import { GlassPanel } from '@/components/common/glass-panel';
import { MetricIsland } from '@/components/common/metric-island';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { resolveAppModule } from '@/components/layout/app-modules';
import { flattenNavigableMenus } from '@/components/layout/navigation-utils';
import { requestVebPage } from '@/lib/server-api';
import { getWorkspaceNavigation } from '@/lib/workspace-navigation';

const statMeta = [
  { label: '用户', icon: Users, tone: 'brand' as const, help: '系统账号总量' },
  { label: '角色', icon: Shield, tone: 'cyan' as const, help: '权限分组数量' },
  {
    label: '权限',
    icon: KeyRound,
    tone: 'purple' as const,
    help: '可授权能力数量',
  },
  {
    label: '菜单',
    icon: ListTree,
    tone: 'green' as const,
    help: '已配置导航数量',
  },
];

const quickLinkMeta = [
  { path: '/admin/system/user', icon: Users },
  { path: '/admin/system/role', icon: Shield },
  { path: '/admin/system/menu', icon: ListTree },
  { path: '/admin/system/module', icon: Boxes },
];

export default async function DashboardPage() {
  const [menuSnapshot, stats] = await Promise.all([
    getWorkspaceNavigation(),
    requestVebPage<DashboardStats>('/api/v1/dashboard/stats'),
  ]);
  const adminMenus =
    resolveAppModule(
      '/admin',
      menuSnapshot.modules.filter((module) => module.status === 'ENABLED'),
    )?.menus ?? [];
  const values = [
    stats.userCount,
    stats.roleCount,
    stats.permissionCount,
    stats.menuCount,
  ];
  const total = values.reduce((sum, value) => sum + value, 0);
  const menuByPath = new Map(
    flattenNavigableMenus(adminMenus as MenuNode[]).flatMap((menu) =>
      menu.type === 'PAGE' && menu.path ? [[menu.path, menu] as const] : [],
    ),
  );
  const quickLinks = quickLinkMeta.flatMap(({ path, icon }) => {
    const menu = menuByPath.get(path);
    return menu ? [{ href: path, label: menu.name, icon }] : [];
  });

  return (
    <WorkspaceCanvas
      eyebrow="工作概览"
      title="仪表盘"
      description="查看账号、角色、权限与菜单的当前配置规模，并快速进入常用管理模块。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{total} 项配置</Badge>
          <Badge colorScheme="green">服务正常</Badge>
        </HStack>
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
              tone={item.tone}
            />
          );
        })}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mt={5}>
        <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
          <Stack spacing={4}>
            <Box>
              <Text color="ink.900" fontSize="lg" fontWeight="800">
                常用入口
              </Text>
              <Text mt={1.5} color="ink.500" fontSize="sm">
                直接进入高频系统配置页面。
              </Text>
            </Box>
            {quickLinks.length > 0 ? (
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                {quickLinks.map((item) => {
                  const QuickLinkIcon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      as={Link}
                      href={item.href}
                      variant="outline"
                      justifyContent="flex-start"
                    >
                      <HStack spacing={2}>
                        <QuickLinkIcon size={16} aria-hidden />
                        <Text>{item.label}</Text>
                      </HStack>
                    </Button>
                  );
                })}
              </SimpleGrid>
            ) : (
              <Text color="ink.500" fontSize="sm">
                当前账号暂无可用的系统配置入口。
              </Text>
            )}
          </Stack>
        </GlassPanel>

        <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
          <HStack align="flex-start" spacing={4}>
            <Flex layerStyle="iconBrand" w="46px" h="46px" flexShrink={0}>
              <Shield size={20} aria-hidden />
            </Flex>
            <Box>
              <Text color="ink.900" fontSize="lg" fontWeight="800">
                权限状态
              </Text>
              <Text mt={2} color="ink.600" lineHeight="1.75">
                页面、按钮与接口继续使用同一套权限链路。角色和菜单调整后，用户只能看到被授权的操作入口。
              </Text>
            </Box>
          </HStack>
        </GlassPanel>
      </SimpleGrid>
    </WorkspaceCanvas>
  );
}
