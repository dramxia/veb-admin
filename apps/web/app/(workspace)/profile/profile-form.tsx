'use client';

import {
  Alert,
  AlertDescription,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
} from '@chakra-ui/react';
import type { ProfileDto } from '@veb/api-contracts';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { GlassPanel } from '@/components/common/glass-panel';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';

export function ProfileForm({ user }: { user: ProfileDto }) {
  const { error, loading, run } = useActionFeedback();

  async function onSubmit(formData: FormData) {
    await run(
      () =>
        requestJson('/api/v1/me', {
          method: 'PATCH',
          body: JSON.stringify({
            nickname: String(formData.get('nickname') || '') || null,
            email: String(formData.get('email') || '') || null,
            avatar: String(formData.get('avatar') || '') || null,
          }),
        }),
      { successTitle: '资料已保存', errorTitle: '保存失败', refresh: true },
    );
  }

  return (
    <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
      <Stack spacing={5}>
        <Heading size="md">资料信息</Heading>
        {error ? (
          <Alert status="error" aria-live="polite">
            <AlertStatusIcon status="error" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <form action={onSubmit}>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>用户名</FormLabel>
              <Input value={user.username} isReadOnly autoComplete="username" />
            </FormControl>
            <FormControl>
              <FormLabel>昵称</FormLabel>
              <Input
                name="nickname"
                defaultValue={user.nickname || ''}
                autoComplete="nickname"
              />
            </FormControl>
            <FormControl>
              <FormLabel>邮箱</FormLabel>
              <Input
                name="email"
                type="email"
                defaultValue={user.email || ''}
                autoComplete="email"
              />
            </FormControl>
            <FormControl>
              <FormLabel>头像 URL</FormLabel>
              <Input
                name="avatar"
                type="url"
                inputMode="url"
                defaultValue={user.avatar || ''}
                placeholder="https://example.com/avatar.png"
              />
            </FormControl>
            <Button type="submit" isLoading={loading} alignSelf="flex-start">
              保存资料
            </Button>
          </Stack>
        </form>
      </Stack>
    </GlassPanel>
  );
}
