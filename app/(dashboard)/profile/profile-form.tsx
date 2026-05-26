'use client';

import { Button, Card, CardBody, CardHeader, FormControl, FormLabel, Heading, Input, Stack, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type User = { username: string; nickname: string | null; email: string | null; avatar: string | null };

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  async function onSubmit(formData: FormData) {
    setLoading(true);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: String(formData.get('nickname') || ''),
        email: String(formData.get('email') || '') || null,
        avatar: String(formData.get('avatar') || '') || null,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok || json.code !== 0) {
      toast({ title: json.message || '保存失败', status: 'error' });
      return;
    }
    toast({ title: '保存成功', status: 'success' });
    router.refresh();
  }
  return <Card><CardHeader><Heading size="md">资料信息</Heading></CardHeader><CardBody>
    <form action={onSubmit}><Stack spacing={4}>
      <FormControl><FormLabel>用户名</FormLabel><Input value={user.username} isReadOnly /></FormControl>
      <FormControl><FormLabel>昵称</FormLabel><Input name="nickname" defaultValue={user.nickname || ''} /></FormControl>
      <FormControl><FormLabel>邮箱</FormLabel><Input name="email" defaultValue={user.email || ''} /></FormControl>
      <FormControl><FormLabel>头像 URL</FormLabel><Input name="avatar" defaultValue={user.avatar || ''} /></FormControl>
      <Button type="submit" colorScheme="blue" isLoading={loading}>保存资料</Button>
    </Stack></form>
  </CardBody></Card>;
}
