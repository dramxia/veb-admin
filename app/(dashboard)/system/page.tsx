import { Badge, HStack, Text, VStack } from '@chakra-ui/react';
import { Compass } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';

export default function SystemPage() {
  return (
    <WorkspaceCanvas
      eyebrow="System"
      title="系统管理"
      description="从底部 Dock 进入用户、角色、权限、菜单、文件或日志模块。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="green">权限配置</Badge>
          <Badge colorScheme="gray">菜单驱动</Badge>
        </HStack>
      }
      sideSlot={
        <GlassPanel variant="soft" p={5}>
          <VStack align="stretch" spacing={3}>
            <Compass size={28} color="#168654" />
            <Text color="surface.900" fontWeight="900">
              选择一个模块继续
            </Text>
            <Text color="surface.600" lineHeight="1.8">
              系统管理页作为模块集合入口，不承载官网式介绍内容。
            </Text>
          </VStack>
        </GlassPanel>
      }
    >
      <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
        <Text color="surface.600" lineHeight="1.8">
          当前用户可见的模块会出现在底部 Liquid Dock 中，权限变化后重新登录或刷新会同步菜单范围。
        </Text>
      </GlassPanel>
    </WorkspaceCanvas>
  );
}
