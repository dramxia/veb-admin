export const dynamic = 'force-dynamic';

import { Heading, SimpleGrid, Text } from '@chakra-ui/react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChangePasswordForm } from './change-password-form';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, nickname: true, email: true, avatar: true },
  });
  if (!user) redirect('/login');
  return (
    <div>
      <Heading size="lg" mb={2}>个人中心</Heading>
      <Text color="gray.500" mb={4}>维护个人资料与登录密码。</Text>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <ProfileForm user={user} />
        <ChangePasswordForm />
      </SimpleGrid>
    </div>
  );
}
