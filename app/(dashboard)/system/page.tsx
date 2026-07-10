import { Badge, HStack, Text } from '@chakra-ui/react';
import { GlassPanel } from '@/components/common/glass-panel';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';

export default function SystemPage() {
  return (
    <WorkspaceCanvas
      eyebrow="后台配置"
      title="系统管理"
      description="集中管理用户、角色、权限、菜单、文件与操作日志。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">权限配置</Badge>
          <Badge colorScheme="gray">菜单驱动</Badge>
        </HStack>
      }
    >
      <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
        <Text color="ink.600" lineHeight="1.75">
          请从桌面侧栏或移动端底部导航选择具体模块。可见入口会根据当前账号权限自动过滤。
        </Text>
      </GlassPanel>
    </WorkspaceCanvas>
  );
}
