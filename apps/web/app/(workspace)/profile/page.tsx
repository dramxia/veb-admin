export const dynamic = 'force-dynamic';

import { Badge, HStack, SimpleGrid } from '@chakra-ui/react';
import type { ProfileDto } from '@veb/api-contracts';
import { WorkspaceCanvas } from '@/components/common/workspace-canvas';
import { PlainModuleShell } from '@/components/layout/plain-module-shell';
import { requestVebPage } from '@/lib/server-api';
import { ChangePasswordForm } from '../admin/profile/change-password-form';
import { ProfileForm } from '../admin/profile/profile-form';

export default async function ProfilePage() {
  const user = await requestVebPage<ProfileDto>('/api/v1/me');

  return (
    <PlainModuleShell>
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
    </PlainModuleShell>
  );
}
