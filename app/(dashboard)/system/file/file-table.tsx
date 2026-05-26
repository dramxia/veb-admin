'use client';

import { Badge, Box, Button, HStack, Link, Table, Tbody, Td, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/components/auth/auth';
import { AuthButton } from '@/components/auth/auth-button';
import { FileUpload } from '@/components/common/file-upload';

export type ManagedFile = {
  id: string;
  name: string;
  mime: string;
  size: number;
  url: string;
  createdAt: Date | string;
  uploader: { username: string; nickname: string | null } | null;
};

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

async function api(path: string, init: RequestInit) {
  const res = await fetch(path, init);
  const json = await res.json();
  if (!res.ok || json.code !== 0) throw new Error(json.message || '操作失败');
  return json.data;
}

export function FileTable({ files }: { files: ManagedFile[] }) {
  const router = useRouter();
  const toast = useToast();

  async function remove(id: string) {
    try {
      await api(`/api/files/${id}`, { method: 'DELETE' });
      toast({ title: '删除成功', status: 'success' });
      router.refresh();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : '删除失败', status: 'error' });
    }
  }

  return (
    <Box>
      <Auth code="system:file:upload">
        <Box mb={4}>
          <FileUpload onChange={() => router.refresh()} />
        </Box>
      </Auth>
      <Box bg="white" borderWidth="1px" rounded="lg" overflow="hidden">
        <Table size="sm">
          <Thead><Tr><Th>文件名</Th><Th>类型</Th><Th>大小</Th><Th>上传人</Th><Th>时间</Th><Th>操作</Th></Tr></Thead>
          <Tbody>
            {files.map((file) => (
              <Tr key={file.id}>
                <Td>{file.name}</Td>
                <Td><Badge>{file.mime}</Badge></Td>
                <Td>{formatSize(file.size)}</Td>
                <Td>{file.uploader?.nickname || file.uploader?.username || '-'}</Td>
                <Td>{new Date(file.createdAt).toLocaleString('zh-CN', { hour12: false })}</Td>
                <Td>
                  <HStack>
                    <Button as={Link} href={file.url} target="_blank" size="xs">预览</Button>
                    <Button as={Link} href={`${file.url}?download=1`} size="xs" variant="outline">下载</Button>
                    <AuthButton code="system:file:delete" size="xs" colorScheme="red" variant="outline" onClick={() => remove(file.id)}>删除</AuthButton>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}
