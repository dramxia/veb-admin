'use client';

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AppSelect } from '@/components/common/app-select';
import { toIsoDateTime, toLocalDateTimeInput } from '@/lib/date-time';
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
  const searchKey = searchParams.toString();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [actorId, setActorId] = useState(searchParams.get('actorId') || '');
  const [action, setAction] = useState(searchParams.get('action') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [startAt, setStartAt] = useState(() =>
    toLocalDateTimeInput(searchParams.get('startAt')),
  );
  const [endAt, setEndAt] = useState(() =>
    toLocalDateTimeInput(searchParams.get('endAt')),
  );

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    setKeyword(params.get('keyword') || '');
    setActorId(params.get('actorId') || '');
    setAction(params.get('action') || '');
    setStatus(params.get('status') || '');
    setStartAt(toLocalDateTimeInput(params.get('startAt')));
    setEndAt(toLocalDateTimeInput(params.get('endAt')));
  }, [searchKey]);

  function applyFilter(event?: FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      keyword,
      actorId,
      action,
      status,
      startAt: toIsoDateTime(startAt),
      endAt: toIsoDateTime(endAt),
    };
    for (const key of filterKeys) {
      const value = values[key].trim();
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page');
    const query = params.toString();
    router.push(`/admin/system/log/operation${query ? `?${query}` : ''}`);
  }

  function resetFilter() {
    setKeyword('');
    setActorId('');
    setAction('');
    setStatus('');
    setStartAt('');
    setEndAt('');
    router.push('/admin/system/log/operation');
  }

  return (
    <Box as="form" onSubmit={applyFilter} w="full">
      <Stack spacing={4}>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3}>
          <FormControl>
            <FormLabel fontSize="xs">关键词</FormLabel>
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="动作、操作者或消息"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs">操作者 ID</FormLabel>
            <Input
              value={actorId}
              onChange={(event) => setActorId(event.target.value)}
              placeholder="输入用户 ID"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs">动作</FormLabel>
            <Input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="例如 user.update"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs">状态</FormLabel>
            <AppSelect
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              placeholder="全部状态"
            >
              <option value="SUCCESS">成功</option>
              <option value="FAILURE">失败</option>
            </AppSelect>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} maxW="720px">
          <FormControl>
            <FormLabel fontSize="xs">开始时间</FormLabel>
            <Input
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              type="datetime-local"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs">结束时间</FormLabel>
            <Input
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              type="datetime-local"
            />
          </FormControl>
        </SimpleGrid>

        <HStack spacing={3} justify="flex-end">
          <Button type="button" variant="ghost" onClick={resetFilter}>
            重置
          </Button>
          <Button type="submit">{t('log.filter')}</Button>
        </HStack>
      </Stack>
    </Box>
  );
}
