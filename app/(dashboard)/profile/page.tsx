export const dynamic = 'force-dynamic';

import { Badge, HStack, SimpleGrid } from '@chakra-ui/react';
import { redirect } from 'next/navigation';
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
      eyebrow="账号设置"
      title="个人中心"
      description="维护当前账号的基础资料与登录密码。"
      heroSlot={
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme="brand">{user.username}</Badge>
          <Badge colorScheme="gray">{user.email || '未设置邮箱'}</Badge>
        </HStack>
      }
    >
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
        <ProfileForm user={user} />
        <ChangePasswordForm />
      </SimpleGrid>
    </WorkspaceCanvas>
  );
}
