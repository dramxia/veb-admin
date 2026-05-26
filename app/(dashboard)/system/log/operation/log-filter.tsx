'use client';

import { Button, HStack, Input, Select, Stack } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { t } from '@/lib/i18n';

const filterKeys = [
  'keyword',
  'actorId',
  'action',
  'status',
  'startAt',
  'endAt',
] as const;

export function OperationLogFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [actorId, setActorId] = useState(searchParams.get('actorId') || '');
  const [action, setAction] = useState(searchParams.get('action') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [startAt, setStartAt] = useState(searchParams.get('startAt') || '');
  const [endAt, setEndAt] = useState(searchParams.get('endAt') || '');

  function applyFilter() {
    const params = new URLSearchParams(searchParams.toString());
    const values = { keyword, actorId, action, status, startAt, endAt };
    for (const key of filterKeys) {
      const value = values[key].trim();
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page');
    router.push(`/system/log/operation?${params.toString()}`);
  }

  return (
    <Stack spacing={3} w="full">
      <HStack flexWrap="wrap">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="keyword / actor / message"
          w="240px"
        />
        <Input
          value={actorId}
          onChange={(event) => setActorId(event.target.value)}
          placeholder="actorId"
          w="220px"
        />
        <Input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="action"
          w="180px"
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          placeholder="ALL"
          w="140px"
        >
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILURE">FAILURE</option>
        </Select>
      </HStack>
      <HStack flexWrap="wrap">
        <Input
          value={startAt}
          onChange={(event) => setStartAt(event.target.value)}
          type="datetime-local"
          w="220px"
        />
        <Input
          value={endAt}
          onChange={(event) => setEndAt(event.target.value)}
          type="datetime-local"
          w="220px"
        />
        <Button onClick={applyFilter}>{t('log.filter')}</Button>
      </HStack>
    </Stack>
  );
}
