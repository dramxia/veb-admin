'use client';

import {
  Alert,
  AlertDescription,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Stack,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { GlassPanel } from '@/components/common/glass-panel';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { error, loading, run } = useActionFeedback();
  const [fieldErrors, setFieldErrors] = useState<{
    confirmPassword?: string;
    newPassword?: string;
  }>({});

  async function onSubmit(formData: FormData) {
    const oldPassword = String(formData.get('oldPassword') || '');
    const newPassword = String(formData.get('newPassword') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    setFieldErrors({});
    if (newPassword.length < 6) {
      setFieldErrors({ newPassword: '新密码至少需要 6 个字符。' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: '两次输入的新密码不一致。' });
      return;
    }

    const ok = await run(
      () =>
        requestJson('/api/v1/me/change-password', {
          method: 'POST',
          body: JSON.stringify({ oldPassword, newPassword }),
        }),
      { successTitle: '密码已修改', errorTitle: '修改失败' },
    );
    if (ok) {
      formRef.current?.reset();
      setFieldErrors({});
    }
  }

  return (
    <GlassPanel variant="solid" p={{ base: 5, md: 6 }}>
      <Stack spacing={5}>
        <Heading size="md">修改密码</Heading>
        {error ? (
          <Alert status="error" aria-live="polite">
            <AlertStatusIcon status="error" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <form ref={formRef} action={onSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>原密码</FormLabel>
              <Input
                name="oldPassword"
                type="password"
                autoComplete="current-password"
              />
            </FormControl>
            <FormControl
              isRequired
              isInvalid={Boolean(fieldErrors.newPassword)}
            >
              <FormLabel>新密码</FormLabel>
              <Input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                onChange={() =>
                  setFieldErrors((current) => ({
                    ...current,
                    newPassword: undefined,
                  }))
                }
              />
              {fieldErrors.newPassword ? (
                <FormErrorMessage>{fieldErrors.newPassword}</FormErrorMessage>
              ) : (
                <FormHelperText>至少 6 个字符。</FormHelperText>
              )}
            </FormControl>
            <FormControl
              isRequired
              isInvalid={Boolean(fieldErrors.confirmPassword)}
            >
              <FormLabel>确认新密码</FormLabel>
              <Input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                onChange={() =>
                  setFieldErrors((current) => ({
                    ...current,
                    confirmPassword: undefined,
                  }))
                }
              />
              <FormErrorMessage>{fieldErrors.confirmPassword}</FormErrorMessage>
            </FormControl>
            <Button type="submit" isLoading={loading} alignSelf="flex-start">
              修改密码
            </Button>
          </Stack>
        </form>
      </Stack>
    </GlassPanel>
  );
}
