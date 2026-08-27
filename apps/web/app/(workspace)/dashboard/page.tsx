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
  ArticlesIcon,
  FilesIcon,
  ModulesIcon,
  OperationLogsIcon,
  RolesIcon,
  UsersIcon,
} from '@/assets/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { LocalIcon, type SvgComponent } from '@/components/common/local-icon';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { AdminShell } from '@/components/layout/admin-shell';
import { flattenNavigableMenus } from '@/components/layout/navigation-utils';
import { requestCorePage } from '@/lib/server-api';
import { getWorkspaceNavigation } from '@/lib/workspace-navigation';
import { ActivityTrendChart, ContentStatusChart } from './dashboard-charts';

const quickLinkMeta = [
  {
    path: '/admin/blog/article',
    icon: ArticlesIcon,
    description: '编辑草稿与发布内容',
  },
  {
    path: '/admin/system/user',
    icon: UsersIcon,
    description: '维护账号与角色分配',
  },
  {
    path: '/admin/system/role',
    icon: RolesIcon,
    description: '配置角色和访问范围',
  },
  {
    path: '/admin/system/file',
    icon: FilesIcon,
    description: '查看上传文件与存储记录',
  },
  {
    path: '/admin/system/log/operation',
    icon: OperationLogsIcon,
    description: '追踪操作结果与异常',
  },
  {
    path: '/admin/system/module',
    icon: ModulesIcon,
    description: '维护工作台业务模块',
  },
];

const actionLabels: Record<string, string> = {
  'blog.article.create': '新建文章',
  'blog.article.delete': '删除文章',
  'blog.article.publish': '发布文章',
  'blog.article.tags.update': '更新文章标签',
  'blog.article.update': '更新文章',
  'blog.like.batch-delete': '批量删除喜欢记录',
  'blog.like.delete': '删除喜欢记录',
  'blog.tag.create': '新建标签',
  'blog.tag.delete': '删除标签',
  'blog.tag.update': '更新标签',
  'file.delete': '删除文件',
  'file.upload': '上传文件',
  'menu.create': '新建菜单',
  'menu.delete': '删除菜单',
  'menu.update': '更新菜单',
  'module.create': '新建模块',
  'module.delete': '删除模块',
  'module.update': '更新模块',
  'profile.change-password': '修改登录密码',
  'profile.update': '更新个人资料',
  'role.assign-access': '调整角色权限',
  'role.assign-user': '调整角色成员',
  'role.create': '新建角色',
  'role.delete': '删除角色',
  'role.update': '更新角色',
  'user.assign-role': '调整用户角色',
  'user.create': '新建用户',
  'user.delete': '删除用户',
  'user.reset-password': '重置用户密码',
  'user.update': '更新用户',
};

const metricToneStyles = {
  brand: 'iconBrand',
  cyan: 'iconCyan',
  green: 'iconGreen',
  purple: 'iconPurple',
} as const;

function getPercent(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function formatSnapshotTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function formatOperationTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function MetricCell({
  label,
  value,
  help,
  badge,
  badgeColorScheme,
  icon,
  tone,
}: {
  label: string;
  value: number;
  help: string;
  badge: string;
  badgeColorScheme: string;
  icon: SvgComponent;
  tone: keyof typeof metricToneStyles;
}) {
  return (
    <Box bg="surfaceSolidBg" minW={0} minH="174px" p={{ base: 5, md: 6 }}>
      <HStack justify="space-between" spacing={4}>
        <Text color="ink.500" fontSize="sm" fontWeight="700">
          {label}
        </Text>
        <Flex
          layerStyle={metricToneStyles[tone]}
          w="40px"
          h="40px"
          flexShrink={0}
        >
          <LocalIcon icon={icon} />
        </Flex>
      </HStack>
      <Text
        mt={4}
        color="ink.900"
        fontSize={{ base: '3xl', md: '4xl' }}
        fontWeight="800"
        lineHeight="1"
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Text>
      <HStack mt={3} align="flex-start" spacing={2}>
        <Badge colorScheme={badgeColorScheme} flexShrink={0}>
          {badge}
        </Badge>
        <Text color="ink.500" fontSize="xs" lineHeight="1.6">
          {help}
        </Text>
      </HStack>
    </Box>
  );
}

function DetailValue({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <VStack align="stretch" spacing={1} minW={0}>
      <Text color="ink.400" fontSize="xs" fontWeight="600">
        {label}
      </Text>
      <Text
        color="ink.800"
        fontSize="sm"
        fontWeight="800"
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Text>
    </VStack>
  );
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
  const percent = getPercent(enabled, total);

  return (
    <Box>
      <Flex align="center" justify="space-between" gap={4}>
        <HStack spacing={2.5} minW={0}>
          <Flex layerStyle="iconBrand" w="34px" h="34px" flexShrink={0}>
            <LocalIcon icon={icon} />
          </Flex>
          <Text color="ink.700" fontSize="sm" fontWeight="700">
            {label}
          </Text>
        </HStack>
        <Text
          color="ink.600"
          fontSize="sm"
          fontWeight="700"
          whiteSpace="nowrap"
          sx={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {enabled} / {total}
        </Text>
      </Flex>
      <Progress
        aria-label={`${label}启用率 ${percent}%`}
        value={percent}
        mt={2.5}
        h="6px"
        rounded="full"
      />
    </Box>
  );
}

async function DashboardContent() {
  const [menuSnapshot, stats] = await Promise.all([
    getWorkspaceNavigation(),
    requestCorePage<DashboardStats>('/api/v1/dashboard/stats'),
  ]);
  const menuByPath = new Map(
    menuSnapshot.modules.flatMap((module) =>
      flattenNavigableMenus(module.menus).flatMap((menu) =>
        menu.type === 'PAGE' && menu.path ? [[menu.path, menu] as const] : [],
      ),
    ),
  );
  const quickLinks = quickLinkMeta.flatMap(({ path, icon, description }) => {
    const menu = menuByPath.get(path);
    return menu ? [{ href: path, label: menu.name, icon, description }] : [];
  });
  const operationLogMenu = menuByPath.get('/admin/system/log/operation');
  const disabledUserCount = Math.max(
    stats.userCount - stats.enabledUserCount,
    0,
  );
  const draftArticleCount = Math.max(
    stats.articleCount - stats.publishedArticleCount,
    0,
  );
  const operationSuccessCount24h = Math.max(
    stats.operationCount24h - stats.failedOperationCount24h,
    0,
  );
  const operationSuccessRate24h = getPercent(
    operationSuccessCount24h,
    stats.operationCount24h,
  );
  const operationTotals7d = stats.operationTrend.reduce(
    (totals, item) => ({
      success: totals.success + item.successCount,
      failure: totals.failure + item.failureCount,
    }),
    { success: 0, failure: 0 },
  );
  const operationCount7d =
    operationTotals7d.success + operationTotals7d.failure;
  const publishedPercent = getPercent(
    stats.publishedArticleCount,
    stats.articleCount,
  );
  const summaryItems = [
    {
      label: '账号总数',
      value: stats.userCount,
      help: `${stats.enabledUserCount} 个启用，${disabledUserCount} 个停用`,
      badge: `${getPercent(stats.enabledUserCount, stats.userCount)}% 启用`,
      badgeColorScheme: 'blue',
      icon: UsersIcon,
      tone: 'brand' as const,
    },
    {
      label: '内容文章',
      value: stats.articleCount,
      help: `${stats.publishedArticleCount} 篇已发布，${draftArticleCount} 篇草稿`,
      badge: `${publishedPercent}% 发布`,
      badgeColorScheme: 'cyan',
      icon: ArticlesIcon,
      tone: 'cyan' as const,
    },
    {
      label: '24 小时操作',
      value: stats.operationCount24h,
      help:
        stats.operationCount24h > 0
          ? `${operationSuccessCount24h} 次成功，${stats.failedOperationCount24h} 次失败`
          : '当前时间窗口内暂无操作',
      badge:
        stats.operationCount24h > 0
          ? `${operationSuccessRate24h}% 成功`
          : '暂无记录',
      badgeColorScheme: stats.failedOperationCount24h > 0 ? 'orange' : 'green',
      icon: OperationLogsIcon,
      tone: 'green' as const,
    },
    {
      label: '文件资产',
      value: stats.fileCount,
      help: `${stats.tagCount} 个标签，累计 ${stats.likeCount} 次喜欢`,
      badge: `${stats.moduleCount} 个模块`,
      badgeColorScheme: 'purple',
      icon: FilesIcon,
      tone: 'purple' as const,
    },
  ];

  return (
    <WorkspaceCanvas
      title="仪表盘"
      description="查看账号、内容、访问配置和近期操作，快速定位需要处理的状态。"
      actionsSlot={
        operationLogMenu ? (
          <Button
            as={Link}
            href="/admin/system/log/operation"
            variant="outline"
            leftIcon={<LocalIcon icon={OperationLogsIcon} />}
          >
            操作日志
          </Button>
        ) : null
      }
    >
      <GlassPanel
        as="section"
        aria-labelledby="dashboard-summary"
        variant="solid"
        overflow="hidden"
      >
        <Flex
          align={{ base: 'flex-start', sm: 'center' }}
          justify="space-between"
          direction={{ base: 'column', sm: 'row' }}
          gap={2}
          px={{ base: 5, md: 6 }}
          py={4}
          borderBottomWidth="1px"
          borderColor="borderSubtle"
        >
          <Box>
            <Text
              as="h2"
              id="dashboard-summary"
              color="ink.900"
              fontWeight="800"
            >
              关键指标
            </Text>
            <Text mt={1} color="ink.500" fontSize="sm">
              账号、内容和系统活动的当前快照
            </Text>
          </Box>
          <Text
            as="time"
            dateTime={stats.generatedAt}
            color="ink.400"
            fontSize="xs"
            whiteSpace="nowrap"
          >
            更新于 {formatSnapshotTime(stats.generatedAt)}
          </Text>
        </Flex>

        <SimpleGrid
          columns={{ base: 1, sm: 2, xl: 4 }}
          gap="1px"
          bg="borderSubtle"
        >
          {summaryItems.map((item) => (
            <MetricCell key={item.label} {...item} />
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
        alignItems="stretch"
      >
        <GlassPanel
          as="section"
          aria-labelledby="dashboard-operation-trend"
          variant="solid"
          p={{ base: 5, md: 6 }}
          minW={0}
        >
          <Flex align="flex-start" justify="space-between" gap={4}>
            <Box>
              <Text
                as="h2"
                id="dashboard-operation-trend"
                color="ink.900"
                fontSize="lg"
                fontWeight="800"
              >
                操作趋势
              </Text>
              <Text mt={1.5} color="ink.500" fontSize="sm">
                最近 7 个自然日的成功与失败记录
              </Text>
            </Box>
            <Badge colorScheme="blue" flexShrink={0}>
              7 天
            </Badge>
          </Flex>

          <Box mt={3} minW={0}>
            <ActivityTrendChart trend={stats.operationTrend} />
          </Box>

          <SimpleGrid
            columns={3}
            spacing={4}
            pt={4}
            borderTopWidth="1px"
            borderColor="borderSubtle"
          >
            <DetailValue label="操作总数" value={operationCount7d} />
            <DetailValue label="成功" value={operationTotals7d.success} />
            <DetailValue label="失败" value={operationTotals7d.failure} />
          </SimpleGrid>
        </GlassPanel>

        <GlassPanel
          as="section"
          aria-labelledby="dashboard-content-status"
          variant="solid"
          p={{ base: 5, md: 6 }}
          minW={0}
        >
          <Flex align="flex-start" justify="space-between" gap={4}>
            <Box>
              <Text
                as="h2"
                id="dashboard-content-status"
                color="ink.900"
                fontSize="lg"
                fontWeight="800"
              >
                内容构成
              </Text>
              <Text mt={1.5} color="ink.500" fontSize="sm">
                文章发布状态与内容资产
              </Text>
            </Box>
            <Badge colorScheme="cyan" flexShrink={0}>
              {publishedPercent}% 发布
            </Badge>
          </Flex>

          <ContentStatusChart
            articleCount={stats.articleCount}
            publishedArticleCount={stats.publishedArticleCount}
          />

          <HStack justify="center" spacing={5} mb={5} wrap="wrap">
            <HStack spacing={2}>
              <Box boxSize="8px" rounded="full" bg="brand.500" />
              <Text color="ink.600" fontSize="xs">
                已发布 {stats.publishedArticleCount}
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Box boxSize="8px" rounded="full" bg="ink.300" />
              <Text color="ink.600" fontSize="xs">
                草稿 {draftArticleCount}
              </Text>
            </HStack>
          </HStack>

          <SimpleGrid
            columns={3}
            spacing={3}
            pt={4}
            borderTopWidth="1px"
            borderColor="borderSubtle"
          >
            <DetailValue label="标签" value={stats.tagCount} />
            <DetailValue label="喜欢" value={stats.likeCount} />
            <DetailValue label="文件" value={stats.fileCount} />
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
        alignItems="stretch"
      >
        <GlassPanel
          as="section"
          aria-labelledby="dashboard-recent-operations"
          variant="solid"
          p={{ base: 5, md: 6 }}
          minW={0}
        >
          <Flex align="flex-start" justify="space-between" gap={4}>
            <Box>
              <Text
                as="h2"
                id="dashboard-recent-operations"
                color="ink.900"
                fontSize="lg"
                fontWeight="800"
              >
                最近操作
              </Text>
              <Text mt={1.5} color="ink.500" fontSize="sm">
                最新写入的后台审计记录
              </Text>
            </Box>
            <Text color="ink.400" fontSize="xs" whiteSpace="nowrap">
              最近 {stats.recentOperations.length} 条
            </Text>
          </Flex>

          {!operationLogMenu ? (
            <Flex
              align="center"
              justify="center"
              minH="300px"
              textAlign="center"
            >
              <Text color="ink.500" fontSize="sm">
                当前账号无操作日志查看权限。
              </Text>
            </Flex>
          ) : stats.recentOperations.length > 0 ? (
            <VStack
              align="stretch"
              spacing={0}
              mt={4}
              divider={<Divider borderColor="borderSubtle" />}
            >
              {stats.recentOperations.map((operation) => (
                <Flex
                  key={operation.id}
                  align={{ base: 'stretch', sm: 'flex-start' }}
                  justify="space-between"
                  direction={{ base: 'column', sm: 'row' }}
                  gap={3}
                  py={3.5}
                >
                  <HStack align="flex-start" spacing={3} minW={0}>
                    <Flex
                      align="center"
                      justify="center"
                      boxSize="36px"
                      rounded="lg"
                      flexShrink={0}
                      bg={
                        operation.status === 'SUCCESS'
                          ? 'statusSuccessBg'
                          : 'statusDangerBg'
                      }
                      color={
                        operation.status === 'SUCCESS'
                          ? 'statusSuccess'
                          : 'statusDanger'
                      }
                    >
                      <LocalIcon icon={OperationLogsIcon} />
                    </Flex>
                    <Box minW={0}>
                      <Text color="ink.800" fontSize="sm" fontWeight="800">
                        {actionLabels[operation.action] || operation.action}
                      </Text>
                      <Text mt={1} color="ink.500" fontSize="xs">
                        {operation.actorName || '系统任务'}
                      </Text>
                      <Text
                        mt={1}
                        color="ink.400"
                        fontFamily="mono"
                        fontSize="xs"
                        noOfLines={1}
                      >
                        {operation.action}
                        {operation.target ? ` · ${operation.target}` : ''}
                      </Text>
                    </Box>
                  </HStack>
                  <VStack
                    align={{ base: 'flex-start', sm: 'flex-end' }}
                    spacing={1.5}
                    flexShrink={0}
                  >
                    <Badge
                      colorScheme={
                        operation.status === 'SUCCESS' ? 'green' : 'red'
                      }
                    >
                      {operation.status === 'SUCCESS' ? '成功' : '失败'}
                    </Badge>
                    <Text
                      as="time"
                      dateTime={operation.createdAt}
                      color="ink.400"
                      fontSize="xs"
                    >
                      {formatOperationTime(operation.createdAt)}
                    </Text>
                  </VStack>
                </Flex>
              ))}
            </VStack>
          ) : (
            <Flex align="center" justify="center" minH="300px">
              <Text color="ink.500" fontSize="sm">
                暂无后台操作记录。
              </Text>
            </Flex>
          )}
        </GlassPanel>

        <GlassPanel
          as="section"
          aria-labelledby="dashboard-resource-status"
          variant="solid"
          p={{ base: 5, md: 6 }}
          minW={0}
        >
          <Flex align="flex-start" justify="space-between" gap={4}>
            <Box>
              <Text
                as="h2"
                id="dashboard-resource-status"
                color="ink.900"
                fontSize="lg"
                fontWeight="800"
              >
                资源状态
              </Text>
              <Text mt={1.5} color="ink.500" fontSize="sm">
                核心资源的启用情况
              </Text>
            </Box>
            <Text color="ink.400" fontSize="xs" textAlign="end">
              {stats.permissionCount} 权限
              <br />
              {stats.menuCount} 菜单
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

          <Flex align="center" justify="space-between" gap={4}>
            <Box>
              <Text color="ink.900" fontWeight="800">
                常用入口
              </Text>
              <Text mt={1} color="ink.500" fontSize="sm">
                当前账号可访问的管理页面
              </Text>
            </Box>
            <Text color="ink.400" fontSize="xs" whiteSpace="nowrap">
              {quickLinks.length} 个
            </Text>
          </Flex>

          {quickLinks.length > 0 ? (
            <SimpleGrid columns={{ base: 1, sm: 2, xl: 1 }} spacing={1} mt={3}>
              {quickLinks.map((item) => (
                <Button
                  key={item.href}
                  as={Link}
                  href={item.href}
                  variant="ghost"
                  h="auto"
                  minH="54px"
                  px={3}
                  py={2.5}
                  justifyContent="flex-start"
                  textAlign="start"
                >
                  <HStack spacing={3} w="full" minW={0}>
                    <Flex
                      layerStyle="iconBrand"
                      w="32px"
                      h="32px"
                      flexShrink={0}
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
            </SimpleGrid>
          ) : (
            <Flex align="center" justify="center" minH="180px">
              <Text color="ink.500" fontSize="sm">
                当前账号暂无可用管理入口。
              </Text>
            </Flex>
          )}

          <SimpleGrid
            columns={3}
            spacing={3}
            mt={5}
            pt={4}
            borderTopWidth="1px"
            borderColor="borderSubtle"
          >
            <DetailValue label="权限节点" value={stats.permissionCount} />
            <DetailValue label="导航菜单" value={stats.menuCount} />
            <DetailValue label="业务模块" value={stats.moduleCount} />
          </SimpleGrid>
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
