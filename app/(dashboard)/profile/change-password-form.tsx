'use client';

import { Button, Card, CardBody, CardHeader, FormControl, FormLabel, Heading, Input, Stack, useToast } from '@chakra-ui/react';
import { useState } from 'react';

export function ChangePasswordForm() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  async function onSubmit(formData: FormData) {
    setLoading(true);
    const res = await fetch('/api/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: String(formData.get('oldPassword') || ''), newPassword: String(formData.get('newPassword') || '') }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok || json.code !== 0) {
      toast({ title: json.message || '修改失败', status: 'error' });
      return;
    }
    toast({ title: '密码已修改', status: 'success' });
  }
  return <Card><CardHeader><Heading size="md">修改密码</Heading></CardHeader><CardBody>
    <form action={onSubmit}><Stack spacing={4}>
      <FormControl isRequired><FormLabel>原密码</FormLabel><Input name="oldPassword" type="password" /></FormControl>
      <FormControl isRequired><FormLabel>新密码</FormLabel><Input name="newPassword" type="password" /></FormControl>
      <Button type="submit" colorScheme="blue" variant="outline" isLoading={loading}>修改密码</Button>
    </Stack></form>
  </CardBody></Card>;
}
