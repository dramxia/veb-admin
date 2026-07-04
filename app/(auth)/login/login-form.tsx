'use client';

import {
  Button,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { LockKeyhole, UserRound } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        username: String(formData.get('username') ?? ''),
        password: String(formData.get('password') ?? ''),
        redirect: false,
      });

      if (result?.error) {
        toast({ title: '账号或密码错误', status: 'error' });
        return;
      }
      router.replace(searchParams.get('callbackUrl') || '/');
      router.refresh();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '登录失败，请稍后重试', status: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit}>
      <Stack spacing={5}>
        <FormControl isRequired>
          <FormLabel color="ink.700" fontWeight="800">
            用户名
          </FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="ink.400">
              <Icon as={UserRound} boxSize={4} />
            </InputLeftElement>
            <Input name="username" defaultValue="admin" autoComplete="username" size="lg" pl={11} />
          </InputGroup>
        </FormControl>
        <FormControl isRequired>
          <FormLabel color="ink.700" fontWeight="800">
            密码
          </FormLabel>
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
            />
          </InputGroup>
        </FormControl>
        <Button type="submit" size="lg" isLoading={loading} mt={2}>
          登录工作台
        </Button>
        <Text color="ink.400" fontSize="sm" textAlign="center">
          默认演示账号已自动填充，可直接登录体验
        </Text>
      </Stack>
    </form>
  );
}
