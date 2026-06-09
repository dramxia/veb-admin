'use client';

import {
  Badge,
  Box,
  Button,
  Link,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/components/auth/auth';
import { AuthButton } from '@/components/auth/auth-button';
import {
  DataTableCard,
  EmptyTableRow,
  TableActions,
} from '@/components/common/data-table';
import { FileUpload } from '@/components/common/file-upload';
import { useActionFeedback } from '@/components/common/use-action-feedback';
import { requestJson } from '@/lib/client-api';

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

export function FileTable({ files }: { files: ManagedFile[] }) {
  const router = useRouter();
  const { loading, run } = useActionFeedback({ refresh: true });

  return (
    <Box>
      <Auth code="system:file:upload">
        <Box mb={4}>
          <FileUpload onChange={() => router.refresh()} />
        </Box>
      </Auth>
      <DataTableCard minW="960px">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>文件名</Th>
              <Th>类型</Th>
              <Th>大小</Th>
              <Th>上传人</Th>
              <Th>时间</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          {files.length > 0 ? (
            <Tbody>
              {files.map((file) => (
                <Tr key={file.id}>
                  <Td>{file.name}</Td>
                  <Td>
                    <Badge>{file.mime}</Badge>
                  </Td>
                  <Td>{formatSize(file.size)}</Td>
                  <Td>
                    {file.uploader?.nickname || file.uploader?.username || '-'}
                  </Td>
                  <Td>
                    {new Date(file.createdAt).toLocaleString('zh-CN', {
                      hour12: false,
                    })}
                  </Td>
                  <Td>
                    <TableActions>
                      <Button
                        as={Link}
                        href={file.url}
                        target="_blank"
                        size="xs"
                      >
                        预览
                      </Button>
                      <Button
                        as={Link}
                        href={`${file.url}?download=1`}
                        size="xs"
                        variant="outline"
                      >
                        下载
                      </Button>
                      <AuthButton
                        code="system:file:delete"
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        isDisabled={loading}
                        onClick={() =>
                          run(
                            () =>
                              requestJson(`/api/files/${file.id}`, {
                                method: 'DELETE',
                              }),
                            {
                              successTitle: '删除成功',
                              errorTitle: '删除失败',
                            },
                          )
                        }
                      >
                        删除
                      </AuthButton>
                    </TableActions>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          ) : (
            <EmptyTableRow colSpan={6} text="暂无文件数据" />
          )}
        </Table>
      </DataTableCard>
    </Box>
  );
}
