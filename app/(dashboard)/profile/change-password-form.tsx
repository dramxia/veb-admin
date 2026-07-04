'use client';

import { Button, FormControl, FormLabel, Heading, Input, Stack } from '@chakra-ui/react';
import { GlassPanel } from '@/components/common/glass-panel';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';

export function ChangePasswordForm() {
  const { loading, run } = useActionFeedback();

  async function onSubmit(formData: FormData) {
    await run(
      () =>
        requestJson('/api/profile/change-password', {
          method: 'POST',
          body: JSON.stringify({
            oldPassword: String(formData.get('oldPassword') || ''),
            newPassword: String(formData.get('newPassword') || ''),
          }),
        }),
      { successTitle: '密码已修改', errorTitle: '修改失败' },
    );
  }

  return (
    <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
      <Stack spacing={5}>
        <Heading size="md" letterSpacing="0">
          修改密码
        </Heading>
        <form action={onSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>原密码</FormLabel>
              <Input name="oldPassword" type="password" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>新密码</FormLabel>
              <Input name="newPassword" type="password" />
            </FormControl>
            <Button type="submit" variant="outline" isLoading={loading}>修改密码</Button>
          </Stack>
        </form>
      </Stack>
    </GlassPanel>
  );
}
