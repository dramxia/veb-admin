'use client';

import { Button, HStack, Text } from '@chakra-ui/react';

export function PaginationControls({
  page,
  pageSize,
  total,
  disabled,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <HStack
      justify="space-between"
      px={{ base: 4, md: 5 }}
      py={4}
      borderTopWidth="1px"
      borderColor="borderSubtle"
    >
      <Button
        size="sm"
        variant="outline"
        isDisabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        上一页
      </Button>
      <Text color="ink.500" fontSize="sm">
        第 {page} / {pages} 页，共 {total} 条
      </Text>
      <Button
        size="sm"
        variant="outline"
        isDisabled={disabled || page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        下一页
      </Button>
    </HStack>
  );
}
