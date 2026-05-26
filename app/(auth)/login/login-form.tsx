'use client';

import { Button, FormControl, FormLabel, Input, Stack, useToast } from '@chakra-ui/react';
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
    const result = await signIn('credentials', {
      username: String(formData.get('username') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast({ title: '账号或密码错误', status: 'error' });
      return;
    }
    router.replace(searchParams.get('callbackUrl') || '/');
    router.refresh();
  }

  return (
    <form action={onSubmit}>
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel>用户名</FormLabel>
          <Input name="username" defaultValue="admin" autoComplete="username" />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>密码</FormLabel>
          <Input name="password" type="password" defaultValue="Admin@123" autoComplete="current-password" />
        </FormControl>
        <Button type="submit" colorScheme="blue" isLoading={loading}>登录</Button>
      </Stack>
    </form>
  );
}
