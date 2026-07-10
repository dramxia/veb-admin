export const dynamic = 'force-dynamic';

import { Badge, HStack, Text, VStack } from '@chakra-ui/react';
import { KeyRound } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';
import { PermissionTable } from './permission-table';

export default async function PermissionPage() {
  await requirePermission('system:permission:view');
  const permissions = await prisma.permission.findMany({
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });
  return (
    <WorkspaceCanvas
      eyebrow="Permission Codes"
      title="权限管理"
      description="维护菜单和按钮权限码，为页面访问、按钮显隐和 API 守卫提供一致的授权基础。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{permissions.length} 个权限码</Badge>
          <Badge colorScheme="gray">MENU / BUTTON</Badge>
        </HStack>
      }
      sideSlot={
        <GlassPanel variant="soft" p={5}>
          <VStack align="stretch" spacing={3}>
            <KeyRound size={28} color="#0f5ed7" />
            <Text color="surface.900" fontWeight="900">
              命名仍遵守既有规范
            </Text>
            <Text color="surface.600" lineHeight="1.8">
              UI 改造不会改变权限码格式，新增和编辑都继续由后端 schema 校验。
            </Text>
          </VStack>
        </GlassPanel>
      }
    >
      <PermissionTable permissions={permissions} />
    </WorkspaceCanvas>
  );
}
