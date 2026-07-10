export const dynamic = 'force-dynamic';

import { Badge, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { redirect } from 'next/navigation';
import { UserCircle } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChangePasswordForm } from './change-password-form';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      nickname: true,
      email: true,
      avatar: true,
    },
  });
  if (!user) redirect('/login');
  return (
    <WorkspaceCanvas
      eyebrow="Profile"
      title="个人中心"
      description="维护个人资料与登录密码，表单保持轻量、安静和可重复操作。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{user.username}</Badge>
          <Badge colorScheme="gray">{user.email || '未设置邮箱'}</Badge>
        </HStack>
      }
      sideSlot={
        <GlassPanel variant="soft" p={5}>
          <VStack align="stretch" spacing={3}>
            <UserCircle size={28} color="#0f5ed7" />
            <Text color="surface.900" fontWeight="900">
              个人信息只影响当前账号
            </Text>
            <Text color="surface.600" lineHeight="1.8">
              资料保存和密码修改继续走现有个人中心 API，不改变认证链路。
            </Text>
          </VStack>
        </GlassPanel>
      }
    >
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
        <ProfileForm user={user} />
        <ChangePasswordForm />
      </SimpleGrid>
    </WorkspaceCanvas>
  );
}
