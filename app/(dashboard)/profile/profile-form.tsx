'use client';

import { Button, FormControl, FormLabel, Heading, Input, Stack } from '@chakra-ui/react';
import { GlassPanel } from '@/components/common/glass-panel';
import { requestJson } from '@/lib/client-api';
import { useActionFeedback } from '@/components/common/use-action-feedback';

type User = { username: string; nickname: string | null; email: string | null; avatar: string | null };

export function ProfileForm({ user }: { user: User }) {
  const { loading, run } = useActionFeedback();

  async function onSubmit(formData: FormData) {
    await run(
      () =>
        requestJson('/api/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            nickname: String(formData.get('nickname') || ''),
            email: String(formData.get('email') || '') || null,
            avatar: String(formData.get('avatar') || '') || null,
          }),
        }),
      { successTitle: '保存成功', errorTitle: '保存失败', refresh: true },
    );
  }

  return (
    <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
      <Stack spacing={5}>
        <Heading size="md" letterSpacing="0">
          资料信息
        </Heading>
        <form action={onSubmit}>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>用户名</FormLabel>
              <Input value={user.username} isReadOnly />
            </FormControl>
            <FormControl>
              <FormLabel>昵称</FormLabel>
              <Input name="nickname" defaultValue={user.nickname || ''} />
            </FormControl>
            <FormControl>
              <FormLabel>邮箱</FormLabel>
              <Input name="email" defaultValue={user.email || ''} />
            </FormControl>
            <FormControl>
              <FormLabel>头像 URL</FormLabel>
              <Input name="avatar" defaultValue={user.avatar || ''} />
            </FormControl>
            <Button type="submit" isLoading={loading}>保存资料</Button>
          </Stack>
        </form>
      </Stack>
    </GlassPanel>
  );
}
