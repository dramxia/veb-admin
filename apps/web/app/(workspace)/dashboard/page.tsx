export const dynamic = 'force-dynamic';

import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  HStack,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { DashboardStats } from '@veb/api-contracts';
import Link from 'next/link';
import {
  MenuTreeIcon,
  ModulesIcon,
  OperationLogsIcon,
  PermissionsIcon,
  RolesIcon,
  SuccessStatusIcon,
  UsersIcon,
  WarningStatusIcon,
} from '@/assets/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { LocalIcon, type SvgComponent } from '@/components/common/local-icon';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { AdminShell } from '@/components/layout/admin-shell';
import { flattenNavigableMenus } from '@/components/layout/navigation-utils';
import { requestVebPage } from '@/lib/server-api';
import { getWorkspaceNavigation } from '@/lib/workspace-navigation';

const quickLinkMeta = [
  {
    path: '/admin/system/user',
    icon: UsersIcon,
    description: '维护账号资料与角色分配',
  },
  {
    path: '/admin/system/role',
    icon: RolesIcon,
    description: '配置角色与访问范围',
  },
  {
    path: '/admin/system/menu',
    icon: MenuTreeIcon,
    description: '维护导航与权限节点',
  },
  {
    path: '/admin/system/module',
    icon: ModulesIcon,
    description: '管理工作台业务模块',
  },
];

function getEnabledPercent(enabled: number, total: number) {
  if (total === 0) return 0;
  return Math.round((enabled / total) * 100);
}

function ResourceStatus({
  label,
  enabled,
  total,
  icon,
}: {
  label: string;
  enabled: number;
  total: number;
  icon: SvgComponent;
}) {
  const percent = getEnabledPercent(enabled, total);

  return (
    <Grid
      templateColumns={{
        base: 'minmax(0, 1fr)',
        sm: '132px minmax(0, 1fr) 88px',
      }}
      gap={{ base: 2, sm: 4 }}
      alignItems="center"
    >
      <HStack spacing={2.5} minW={0}>
        <Flex
          align="center"
          justify="center"
          boxSize="34px"
          flexShrink={0}
          rounded="lg"
          bg="brand.50"
          color="brand.600"
        >
          <LocalIcon icon={icon} />
        </Flex>
        <Text color="ink.700" fontSize="sm" fontWeight="700">
          {label}
        </Text>
      </HStack>

      <Progress
        aria-label={`${label}启用率 ${percent}%`}
        value={percent}
        h="6px"
        rounded="full"
      />

      <Text
        color="ink.600"
        fontSize="sm"
        fontWeight="600"
        textAlign={{ base: 'start', sm: 'end' }}
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {enabled} / {total} 启用
      </Text>
    </Grid>
  );
}

async function DashboardContent() {
  const [menuSnapshot, stats] = await Promise.all([
    getWorkspaceNavigation(),
    requestVebPage<DashboardStats>('/api/v1/dashboard/stats'),
  ]);
  const adminMenus =
    menuSnapshot.modules.find((module) => module.code === 'admin')?.menus ?? [];
  const menuByPath = new Map(
    flattenNavigableMenus(adminMenus).flatMap((menu) =>
      menu.type === 'PAGE' && menu.path ? [[menu.path, menu] as const] : [],
    ),
  );
  const quickLinks = quickLinkMeta.flatMap(({ path, icon, description }) => {
    const menu = menuByPath.get(path);
    return menu ? [{ href: path, label: menu.name, icon, description }] : [];
  });
  const operationLogMenu = menuByPath.get('/admin/system/log/operation');
  const summaryItems = [
    {
      label: '账号总数',
      value: stats.userCount,
      help: `${stats.enabledUserCount} 个账号已启用`,
      icon: UsersIcon,
    },
    {
      label: '角色总数',
      value: stats.roleCount,
      help: `${stats.enabledRoleCount} 个角色已启用`,
      icon: RolesIcon,
    },
    {
      label: '权限能力',
      value: stats.permissionCount,
      help: '页面、外链与按钮权限',
      icon: PermissionsIcon,
    },
    {
      label: '导航菜单',
      value: stats.menuCount,
      help: '目录、页面与外链节点',
      icon: MenuTreeIcon,
    },
  ];
  const hasFailedOperations = stats.failedOperationCount24h > 0;

  return (
    <WorkspaceCanvas
      title="仪表盘"
      description="浏览账号、访问配置与近期操作，快速掌握系统当前状态。"
    >
      <GlassPanel
        as="section"
        aria-labelledby="dashboard-summary"
        variant="solid"
      >
        <Flex
          align={{ base: 'flex-start', sm: 'center' }}
          justify="space-between"
          direction={{ base: 'column', sm: 'row' }}
          gap={3}
          px={{ base: 5, md: 6 }}
          py={4}
          borderBottomWidth="1px"
          borderColor="borderSubtle"
        >
          <Box>
            <Text id="dashboard-summary" color="ink.900" fontWeight="800">
              关键指标
            </Text>
            <Text mt={1} color="ink.500" fontSize="sm">
              当前系统资源快照
            </Text>
          </Box>
          <Badge colorScheme="gray">当前数据</Badge>
        </Flex>

        <SimpleGrid columns={{ base: 2, xl: 4 }}>
          {summaryItems.map((item, index) => (
            <Box
              key={item.label}
              p={{ base: 4, md: 6 }}
              borderTopWidth={{
                base: index < 2 ? '0' : '1px',
                xl: '0',
              }}
              borderInlineStartWidth={{
                base: index % 2 === 0 ? '0' : '1px',
                xl: index === 0 ? '0' : '1px',
              }}
              borderColor="borderSubtle"
            >
              <HStack justify="space-between" spacing={4}>
                <Text color="ink.500" fontSize="sm" fontWeight="700">
                  {item.label}
                </Text>
                <Flex
                  align="center"
                  justify="center"
                  boxSize="34px"
                  flexShrink={0}
                  rounded="lg"
                  bg="brand.50"
                  color="brand.600"
                >
                  <LocalIcon icon={item.icon} />
                </Flex>
              </HStack>
              <Text
                mt={5}
                color="ink.900"
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="800"
                lineHeight="1"
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {item.value}
              </Text>
              <Text mt={2.5} color="ink.500" fontSize="sm">
                {item.help}
              </Text>
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
        alignItems="stretch"
      >
        <GlassPanel
          as="section"
          aria-labelledby="dashboard-resource-status"
          variant="solid"
          p={{ base: 5, md: 6 }}
        >
          <Flex
            align={{ base: 'flex-start', sm: 'center' }}
            justify="space-between"
            direction={{ base: 'column', sm: 'row' }}
            gap={2}
          >
            <Box>
              <Text
                id="dashboard-resource-status"
                color="ink.900"
                fontSize="lg"
                fontWeight="800"
              >
                资源状态
              </Text>
              <Text mt={1.5} color="ink.500" fontSize="sm">
                账号、角色与模块的启用情况
              </Text>
            </Box>
            <Text color="ink.500" fontSize="sm">
              {stats.enabledModuleCount} / {stats.moduleCount} 个模块启用
            </Text>
          </Flex>

          <Stack mt={6} spacing={5}>
            <ResourceStatus
              label="账号"
              enabled={stats.enabledUserCount}
              total={stats.userCount}
              icon={UsersIcon}
            />
            <ResourceStatus
              label="角色"
              enabled={stats.enabledRoleCount}
              total={stats.roleCount}
              icon={RolesIcon}
            />
            <ResourceStatus
              label="业务模块"
              enabled={stats.enabledModuleCount}
              total={stats.moduleCount}
              icon={ModulesIcon}
            />
          </Stack>

          <Divider my={6} borderColor="borderSubtle" />

          <Flex
            align={{ base: 'stretch', sm: 'center' }}
            justify="space-between"
            direction={{ base: 'column', sm: 'row' }}
            gap={4}
          >
            <HStack align="flex-start" spacing={3}>
              <Flex
                align="center"
                justify="center"
                boxSize="40px"
                flexShrink={0}
                rounded="lg"
                bg={hasFailedOperations ? 'statusDangerBg' : 'statusSuccessBg'}
                color={hasFailedOperations ? 'statusDanger' : 'statusSuccess'}
              >
                <LocalIcon
                  icon={
                    hasFailedOperations ? WarningStatusIcon : SuccessStatusIcon
                  }
                />
              </Flex>
              <Box>
                <HStack spacing={2} wrap="wrap">
                  <Text color="ink.900" fontWeight="800">
                    近 24 小时操作
                  </Text>
                  <Badge colorScheme={hasFailedOperations ? 'red' : 'green'}>
                    {hasFailedOperations
                      ? `${stats.failedOperationCount24h} 次失败`
                      : '无失败记录'}
                  </Badge>
                </HStack>
                <Text mt={1.5} color="ink.500" fontSize="sm">
                  共记录 {stats.operationCount24h} 次系统操作
                </Text>
              </Box>
            </HStack>

            {operationLogMenu ? (
              <Button
                as={Link}
                href="/admin/system/log/operation"
                variant="outline"
                leftIcon={<LocalIcon icon={OperationLogsIcon} />}
                flexShrink={0}
              >
                查看日志
              </Button>
            ) : null}
          </Flex>
        </GlassPanel>

        <GlassPanel
          as="section"
          aria-labelledby="dashboard-quick-links"
          variant="solid"
          p={{ base: 5, md: 6 }}
        >
          <Flex align="flex-start" justify="space-between" gap={4}>
            <Box>
              <Text
                id="dashboard-quick-links"
                color="ink.900"
                fontSize="lg"
                fontWeight="800"
              >
                常用入口
              </Text>
              <Text mt={1.5} color="ink.500" fontSize="sm">
                仅显示当前账号可访问的页面
              </Text>
            </Box>
            <Text color="ink.500" fontSize="sm" whiteSpace="nowrap">
              {quickLinks.length} 个入口
            </Text>
          </Flex>

          {quickLinks.length > 0 ? (
            <VStack align="stretch" spacing={1} mt={4}>
              {quickLinks.map((item) => (
                <Button
                  key={item.href}
                  as={Link}
                  href={item.href}
                  variant="ghost"
                  h="auto"
                  minH="58px"
                  px={3}
                  py={2.5}
                  justifyContent="flex-start"
                  textAlign="start"
                >
                  <HStack spacing={3} w="full" minW={0}>
                    <Flex
                      align="center"
                      justify="center"
                      boxSize="34px"
                      flexShrink={0}
                      rounded="lg"
                      bg="brand.50"
                      color="brand.600"
                    >
                      <LocalIcon icon={item.icon} />
                    </Flex>
                    <VStack align="stretch" spacing={0.5} minW={0}>
                      <Text color="ink.800" fontSize="sm" fontWeight="700">
                        {item.label}
                      </Text>
                      <Text
                        color="ink.500"
                        fontSize="xs"
                        fontWeight="500"
                        whiteSpace="normal"
                      >
                        {item.description}
                      </Text>
                    </VStack>
                  </HStack>
                </Button>
              ))}
            </VStack>
          ) : (
            <Flex
              align="center"
              justify="center"
              minH="220px"
              px={4}
              textAlign="center"
            >
              <Text color="ink.500" fontSize="sm">
                当前账号暂无可用的系统配置入口。
              </Text>
            </Flex>
          )}
        </GlassPanel>
      </Grid>
    </WorkspaceCanvas>
  );
}

export default async function DashboardPage() {
  return (
    <AdminShell>
      <DashboardContent />
    </AdminShell>
  );
}
