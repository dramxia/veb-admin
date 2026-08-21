'use client';

import {
  Alert,
  AlertDescription,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
} from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AccountIcon, PasswordIcon } from '@/assets/icons';
import { AlertStatusIcon } from '@/components/common/alert-status-icon';
import { LocalIcon } from '@/components/common/local-icon';
import { getSafeInternalPath } from '@/lib/safe-redirect';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    username?: string;
  }>({});

  async function onSubmit(formData: FormData) {
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    const nextFieldErrors = {
      ...(!username ? { username: '请输入用户名。' } : {}),
      ...(!password ? { password: '请输入密码。' } : {}),
    };
    setErrorMessage(null);
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage('账号或密码错误，请检查后重试。');
        return;
      }
      router.replace(getSafeInternalPath(searchParams.get('callbackUrl')));
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '登录失败，请稍后重试。',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit}>
      <Stack spacing={5}>
        {errorMessage ? (
          <Alert status="error" aria-live="polite">
            <AlertStatusIcon status="error" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <FormControl isRequired isInvalid={Boolean(fieldErrors.username)}>
          <FormLabel>用户名</FormLabel>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" h="full" w={12}>
              <LocalIcon icon={AccountIcon} aria-hidden color="brand.600" />
            </InputLeftElement>
            <Input
              name="username"
              autoComplete="username"
              ps={14}
              autoFocus
              onChange={() => {
                setFieldErrors((current) => ({
                  ...current,
                  username: undefined,
                }));
                setErrorMessage(null);
              }}
            />
          </InputGroup>
          <FormErrorMessage>{fieldErrors.username}</FormErrorMessage>
        </FormControl>
        <FormControl isRequired isInvalid={Boolean(fieldErrors.password)}>
          <FormLabel>密码</FormLabel>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" h="full" w={12}>
              <LocalIcon icon={PasswordIcon} aria-hidden color="brand.600" />
            </InputLeftElement>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              ps={14}
              onChange={() => {
                setFieldErrors((current) => ({
                  ...current,
                  password: undefined,
                }));
                setErrorMessage(null);
              }}
            />
          </InputGroup>
          <FormErrorMessage>{fieldErrors.password}</FormErrorMessage>
        </FormControl>
        <Button type="submit" size="lg" isLoading={loading} w="full">
          登录工作台
        </Button>
      </Stack>
    </form>
  );
}
