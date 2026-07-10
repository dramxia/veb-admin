'use client';

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
} from '@chakra-ui/react';
import { LockKeyhole, UserRound } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
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
            <AlertIcon />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <FormControl isRequired isInvalid={Boolean(fieldErrors.username)}>
          <FormLabel>用户名</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="ink.400">
              <Icon as={UserRound} boxSize={4} />
            </InputLeftElement>
            <Input
              name="username"
              defaultValue="admin"
              autoComplete="username"
              size="lg"
              pl={11}
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
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="ink.400">
              <Icon as={LockKeyhole} boxSize={4} />
            </InputLeftElement>
            <Input
              name="password"
              type="password"
              defaultValue="Admin@123"
              autoComplete="current-password"
              size="lg"
              pl={11}
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
        <Text color="ink.400" fontSize="sm" textAlign="center">
          演示环境已预填默认账号，可直接登录体验
        </Text>
      </Stack>
    </form>
  );
}
